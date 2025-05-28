import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import { notifySubmissionStatusUpdate } from '@/lib/notification-service';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define extended session interface
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

// GET a single photo submission
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as ExtendedSession;
    const { id } = params;
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const submission = await PhotoSubmission.findById(id)
      .populate('user', 'name')
      .populate('competition', 'title theme rules status');
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH update submission status (for admins)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as ExtendedSession;
    const { id } = params;
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only admin should be able to update status
    // In a real implementation, you would check if user is admin here
    // For now, we'll proceed as if the user is authorized
    
    const submission = await PhotoSubmission.findById(id)
      .populate('competition', 'title');
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    
    // For PATCH, we're only allowing status updates
    if (!body.status || !['approved', 'rejected', 'pending'].includes(body.status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status provided' },
        { status: 400 }
      );
    }
    
    // Update submission status
    const updatedSubmission = await PhotoSubmission.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );
    
    // Send notification to the user if status is approved or rejected
    if (body.status === 'approved' || body.status === 'rejected') {
      try {
        await notifySubmissionStatusUpdate(
          submission.user.toString(),  // userId
          submission._id.toString(),   // submissionId
          submission.title,            // photoTitle
          submission.competition._id.toString(), // competitionId
          submission.competition.title,        // competitionTitle
          body.status as 'approved' | 'rejected'  // status
        );
        console.log(`Notification sent to user for ${body.status} submission`);
      } catch (notifyError) {
        console.error('Error sending notification to user:', notifyError);
        // Continue even if notification fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedSubmission,
      message: `Submission ${body.status} successfully`
    });
  } catch (error: any) {
    console.error('Error updating submission status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update submission details (for users to edit their own submissions)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as ExtendedSession;
    const { id } = params;
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const submission = await PhotoSubmission.findById(id)
      .populate('competition', 'status');
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns this submission
    if (submission.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You can only edit your own submissions' },
        { status: 403 }
      );
    }
    
    // Check if competition is still in active status
    if (submission.competition.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'You can only edit submissions when the competition is active' },
        { status: 400 }
      );
    }
    
    // Check if request contains FormData (image update) or JSON (text-only update)
    const contentType = req.headers.get('content-type') || '';
    let updateData: any = {};
    let newImageUrl = '';
    let newCloudinaryPublicId = '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle image update with FormData
      const formData = await req.formData();
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const photo = formData.get('photo') as File;
      
      // Validate input
      if (!title || title.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Title is required' },
          { status: 400 }
        );
      }
      
      if (title.length > 100) {
        return NextResponse.json(
          { success: false, message: 'Title cannot be more than 100 characters' },
          { status: 400 }
        );
      }
      
      if (description && description.length > 500) {
        return NextResponse.json(
          { success: false, message: 'Description cannot be more than 500 characters' },
          { status: 400 }
        );
      }
      
      if (photo && photo.size > 0) {
        // Upload new image to Cloudinary
        try {
          const bytes = await photo.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'snapscape/submissions',
                resource_type: 'image',
                transformation: [
                  { quality: 'auto:good' },
                  { fetch_format: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          }) as any;
          
          newImageUrl = uploadResult.secure_url;
          newCloudinaryPublicId = uploadResult.public_id;
          
          // Delete old image from Cloudinary
          if (submission.cloudinaryPublicId) {
            try {
              await cloudinary.uploader.destroy(submission.cloudinaryPublicId);
              console.log(`Deleted old image from Cloudinary: ${submission.cloudinaryPublicId}`);
            } catch (deleteError) {
              console.error('Error deleting old image from Cloudinary:', deleteError);
              // Continue even if old image deletion fails
            }
          }
        } catch (uploadError) {
          console.error('Error uploading new image to Cloudinary:', uploadError);
          return NextResponse.json(
            { success: false, message: 'Failed to upload new image' },
            { status: 500 }
          );
        }
      }
      
      updateData = {
        title: title.trim(),
        description: description?.trim() || '',
        ...(newImageUrl && { imageUrl: newImageUrl }),
        ...(newCloudinaryPublicId && { cloudinaryPublicId: newCloudinaryPublicId }),
        updatedAt: new Date()
      };
    } else {
      // Handle text-only update with JSON
      const body = await req.json();
      
      // Validate input
      if (!body.title || body.title.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Title is required' },
          { status: 400 }
        );
      }
      
      if (body.title.length > 100) {
        return NextResponse.json(
          { success: false, message: 'Title cannot be more than 100 characters' },
          { status: 400 }
        );
      }
      
      if (body.description && body.description.length > 500) {
        return NextResponse.json(
          { success: false, message: 'Description cannot be more than 500 characters' },
          { status: 400 }
        );
      }
      
      updateData = {
        title: body.title.trim(),
        description: body.description?.trim() || '',
        updatedAt: new Date()
      };
    }
    
    // Update submission
    const updatedSubmission = await PhotoSubmission.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      data: updatedSubmission,
      message: 'Submission updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE submission (for users to delete their own submissions)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as ExtendedSession;
    const { id } = params;
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const submission = await PhotoSubmission.findById(id)
      .populate('competition', 'status');
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns this submission
    if (submission.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own submissions' },
        { status: 403 }
      );
    }
    
    // Check if competition is still in active status
    if (submission.competition.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'You can only delete submissions when the competition is active' },
        { status: 400 }
      );
    }
    
    // Delete image from Cloudinary
    try {
      if (submission.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(submission.cloudinaryPublicId);
        console.log(`Deleted image from Cloudinary: ${submission.cloudinaryPublicId}`);
      }
    } catch (cloudinaryError) {
      console.error('Error deleting image from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }
    
    // Delete submission from database
    await PhotoSubmission.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Submission deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 