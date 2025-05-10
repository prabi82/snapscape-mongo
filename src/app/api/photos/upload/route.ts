import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import connectDB from '@/lib/mongodb';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  console.log('OPTIONS request received at /api/photos/upload');
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
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
    } catch (formError) {
      console.error('Failed to parse FormData:', formError);
      return NextResponse.json(
        { success: false, message: 'Failed to parse form data', error: formError.message },
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

    // Upload image to Cloudinary
    try {
      console.log('Preparing to upload image to Cloudinary');
      const arrayBuffer = await photo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uniqueFilename = `${session.user.id}_${Date.now()}`;

      // Simple upload with minimal options
      console.log('Starting Cloudinary upload with unique filename:', uniqueFilename);
      const uploadResult = await uploadToCloudinary(buffer, {
        folder: `snapscape/competitions/${competitionId}`,
        public_id: uniqueFilename,
      });

      console.log('Cloudinary upload result received:', uploadResult ? 'success' : 'undefined');
      
      if (!uploadResult || !uploadResult.secure_url) {
        console.error('No URL returned from Cloudinary');
        return NextResponse.json(
          { success: false, message: 'Failed to upload image', error: 'No URL returned from cloud storage' },
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
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error uploading image to cloud storage',
          error: cloudinaryError.message,
          stack: cloudinaryError.stack 
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message, stack: error.stack },
      { status: 500, headers: corsHeaders }
    );
  }
} 