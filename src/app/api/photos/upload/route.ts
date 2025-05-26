import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import connectDB from '@/lib/mongodb';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import { notifyAdminsOfPhotoSubmission } from '@/lib/notification-service';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  console.log('OPTIONS request received at /api/photos/upload');
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Helper function to create timeout promise
function createTimeoutPromise(ms: number, operation: string) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${ms}ms`));
    }, ms);
  });
}

// Helper function to retry operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

// Simple handling for other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/photos/upload called');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Authentication check:', { hasSession: Boolean(session), hasUser: Boolean(session?.user) });
    
    if (!session || !session.user) {
      console.log('Unauthorized access attempt');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectDB();
    console.log('Connected to database');

    // Parse FormData with error handling
    let formData;
    try {
      formData = await request.formData();
      console.log('FormData parsed successfully');
    } catch (formError: any) {
      console.error('Failed to parse FormData:', formError);
      return NextResponse.json(
        { success: false, message: 'Failed to parse form data - request may be too large or corrupted', error: formError?.message || 'Unknown error' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const competitionId = formData.get('competition') as string;
    const photo = formData.get('photo') as File;

    console.log('Form data received:', {
      hasTitle: Boolean(title),
      hasDescription: Boolean(description),
      competitionId,
      photoName: photo?.name,
      photoType: photo?.type,
      photoSize: photo?.size,
    });

    // Validate required fields
    if (!title || !description || !competitionId || !photo) {
      console.log('Missing required fields');
      return NextResponse.json(
        { success: false, message: 'All fields are required: title, description, competition, photo' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (photo.size > maxFileSize) {
      console.log('File too large:', photo.size);
      return NextResponse.json(
        { success: false, message: `File size too large. Maximum allowed size is 10MB` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if competition exists
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      console.log('Competition not found:', competitionId);
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check submission limit
    const userSubmissionCount = await PhotoSubmission.countDocuments({
      competition: competitionId,
      user: session.user.id,
    });

    if (userSubmissionCount >= competition.submissionLimit) {
      console.log('Submission limit reached');
      return NextResponse.json(
        { 
          success: false, 
          message: `You have reached the maximum submission limit (${competition.submissionLimit}) for this competition` 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Upload image to Cloudinary with timeout handling
    try {
      console.log('Preparing to upload image to Cloudinary');
      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uniqueFilename = `${session.user.id}_${Date.now()}`;

      console.log('Starting Cloudinary upload with unique filename:', uniqueFilename);
      
      // Add timeout to Cloudinary upload
      const uploadPromise = uploadToCloudinary(buffer, {
        folder: `snapscape/competitions/${competitionId}`,
        public_id: uniqueFilename,
      });
      
      const timeoutPromise = createTimeoutPromise(120000, 'Cloudinary upload'); // 2 minute timeout
      
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);

      console.log('Cloudinary upload result received:', uploadResult ? 'success' : 'undefined');
      
      if (!uploadResult || !uploadResult.secure_url) {
        console.error('No URL returned from Cloudinary');
        return NextResponse.json(
          { success: false, message: 'Failed to upload image - no URL returned from cloud storage' },
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('Image uploaded successfully:', uploadResult.secure_url);

      // Create thumbnail URL
      const thumbnailUrl = uploadResult.secure_url.replace(
        `/upload/`, 
        `/upload/c_fill,h_300,w_300/`
      );

      // Create submission in database
      const submission = await PhotoSubmission.create({
        title,
        description,
        imageUrl: uploadResult.secure_url,
        thumbnailUrl,
        cloudinaryPublicId: uploadResult.public_id,
        competition: competitionId,
        user: session.user.id,
        status: 'pending',
      });

      console.log('Submission created:', submission._id);
      
      // Send notification to admins (don't fail if this fails)
      try {
        await notifyAdminsOfPhotoSubmission(
          submission._id.toString(),
          submission.title || 'Untitled Photo',
          session.user.id,
          session.user.name || 'User',
          competitionId,
          competition.title
        );
      } catch (notifyError) {
        console.error('Error sending admin notifications:', notifyError);
        // Continue even if notification fails
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Photo submitted successfully',
        data: {
          id: submission._id,
          title: submission.title,
        }
      }, { headers: corsHeaders });
      
    } catch (cloudinaryError: any) {
      console.error('Cloudinary error:', cloudinaryError);
      
      // Provide more specific error messages
      let errorMessage = 'Error uploading image to cloud storage';
      if (cloudinaryError.message.includes('timeout')) {
        errorMessage = 'Upload timed out - please try again with a smaller image or check your internet connection';
      } else if (cloudinaryError.message.includes('network')) {
        errorMessage = 'Network error during upload - please check your internet connection and try again';
      } else if (cloudinaryError.message.includes('size')) {
        errorMessage = 'Image file is too large - please compress your image and try again';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          error: cloudinaryError.message,
          retryable: cloudinaryError.message.includes('timeout') || cloudinaryError.message.includes('network')
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Server error occurred while processing your request';
    if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out - please try again';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error - please check your connection and try again';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage, 
        error: error.message,
        retryable: error.message.includes('timeout') || error.message.includes('network')
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 