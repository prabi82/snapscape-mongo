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

// Vercel function payload limits
const VERCEL_PAYLOAD_LIMIT = 4.5 * 1024 * 1024; // 4.5MB (Vercel limit)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (user can upload, but will be compressed on frontend)

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

// Helper function to validate request size before processing
function validateRequestSize(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    console.log(`Request content-length: ${(size / 1024 / 1024).toFixed(2)}MB`);
    
    if (size > VERCEL_PAYLOAD_LIMIT) {
      console.log(`Request too large: ${size} bytes > ${VERCEL_PAYLOAD_LIMIT} bytes`);
      return false;
    }
  }
  return true;
}

// Simple handling for other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/photos/upload called');
  
  try {
    // Early request size validation
    if (!validateRequestSize(request)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'File too large for upload. Please compress your image to under 4MB and try again.',
          error: 'PAYLOAD_TOO_LARGE',
          maxSize: '4MB'
        },
        { status: 413, headers: corsHeaders }
      );
    }

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

    // Parse FormData with enhanced error handling
    let formData;
    try {
      // Add timeout for FormData parsing
      const formDataPromise = request.formData();
      const timeoutPromise = createTimeoutPromise(30000, 'FormData parsing');
      
      formData = await Promise.race([formDataPromise, timeoutPromise]);
      console.log('FormData parsed successfully');
    } catch (formError: any) {
      console.error('Failed to parse FormData:', formError);
      
      // Check if it's a size-related error
      if (formError.message.includes('413') || formError.message.includes('too large') || formError.message.includes('payload')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'File too large for upload. Please compress your image to under 4MB and try again.',
            error: 'PAYLOAD_TOO_LARGE',
            maxSize: '4MB'
          },
          { status: 413, headers: corsHeaders }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to parse form data - request may be corrupted', error: formError?.message || 'Unknown error' },
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
      photoSizeMB: photo?.size ? (photo.size / 1024 / 1024).toFixed(2) : 'unknown',
    });

    // Validate required fields
    if (!title || !description || !competitionId || !photo) {
      console.log('Missing required fields');
      return NextResponse.json(
        { success: false, message: 'All fields are required: title, description, competition, photo' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Enhanced file size validation with specific limits
    if (photo.size > MAX_FILE_SIZE) {
      console.log(`File too large: ${photo.size} bytes (${(photo.size / 1024 / 1024).toFixed(2)}MB)`);
      return NextResponse.json(
        { 
          success: false, 
          message: `File size too large. Maximum allowed size is 10MB. Your file is ${(photo.size / 1024 / 1024).toFixed(2)}MB. Please compress your image and try again.`,
          error: 'FILE_TOO_LARGE',
          currentSize: `${(photo.size / 1024 / 1024).toFixed(2)}MB`,
          maxSize: '10MB'
        },
        { status: 413, headers: corsHeaders }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
          error: 'INVALID_FILE_TYPE',
          allowedTypes: allowedTypes
        },
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

    // Upload image to Cloudinary with enhanced error handling
    try {
      console.log('Preparing to upload image to Cloudinary');
      
      // Convert file to buffer with memory management
      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uniqueFilename = `${session.user.id}_${Date.now()}`;

      console.log(`Starting Cloudinary upload - File: ${uniqueFilename}, Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      // Upload with timeout and enhanced options
      const uploadPromise = uploadToCloudinary(buffer, {
        folder: `snapscape/competitions/${competitionId}`,
        public_id: uniqueFilename,
        // Add Cloudinary-specific optimizations
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
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

      // Create optimized thumbnail URL
      const thumbnailUrl = uploadResult.secure_url.replace(
        `/upload/`, 
        `/upload/c_fill,h_300,w_300,q_auto,f_auto/`
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
      
      // Enhanced error message handling
      let errorMessage = 'Error uploading image to cloud storage';
      let statusCode = 500;
      
      if (cloudinaryError.message.includes('413') || cloudinaryError.message.includes('too large') || cloudinaryError.message.includes('payload')) {
        errorMessage = 'Image file is too large for processing. Please compress your image to under 4MB and try again.';
        statusCode = 413;
      } else if (cloudinaryError.message.includes('timeout')) {
        errorMessage = 'Upload timed out - please try again with a smaller image or check your internet connection';
      } else if (cloudinaryError.message.includes('network')) {
        errorMessage = 'Network error during upload - please check your internet connection and try again';
      } else if (cloudinaryError.message.includes('size')) {
        errorMessage = 'Image file is too large - please compress your image and try again';
        statusCode = 413;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          error: cloudinaryError.message,
          retryable: cloudinaryError.message.includes('timeout') || cloudinaryError.message.includes('network'),
          maxSize: '4MB'
        },
        { status: statusCode, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    
    // Enhanced error message handling
    let errorMessage = 'Server error occurred while processing your request';
    let statusCode = 500;
    
    if (error.message.includes('413') || error.message.includes('too large') || error.message.includes('payload')) {
      errorMessage = 'Request too large - please compress your image to under 4MB and try again';
      statusCode = 413;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out - please try again';
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error - please check your connection and try again';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage, 
        error: error.message,
        retryable: error.message.includes('timeout') || error.message.includes('network'),
        maxSize: '4MB'
      },
      { status: statusCode, headers: corsHeaders }
    );
  }
} 