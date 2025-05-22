import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import PhotoSubmission from '@/models/PhotoSubmission';
import { deleteFromCloudinary } from '@/lib/cloudinary';

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

// DELETE a photo submission (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    // @ts-ignore - authOptions type mismatch is a known issue
    const session = await getServerSession(authOptions) as ExtendedSession;
    const { id } = params;
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session?.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized - admin access required' },
        { status: 403 }
      );
    }
    
    // Find the submission
    const submission = await PhotoSubmission.findById(id);
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Delete from Cloudinary first if we have the public ID
    if (submission.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(submission.cloudinaryPublicId);
        console.log(`Deleted image ${submission.cloudinaryPublicId} from Cloudinary`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }
    
    // Delete from database
    await PhotoSubmission.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Submission deleted successfully',
      data: {
        id: submission._id,
        userId: submission.user
      }
    });
  } catch (error: any) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 