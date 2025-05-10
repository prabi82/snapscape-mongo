import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhotoSubmission from '@/models/PhotoSubmission';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
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
    
    // Only allow the owner to delete their submission
    if (submission.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete this submission' },
        { status: 403 }
      );
    }
    
    try {
      // Delete from Cloudinary first
      if (submission.cloudinaryPublicId) {
        await deleteFromCloudinary(submission.cloudinaryPublicId);
      }
      
      // Then delete from database
      await PhotoSubmission.findByIdAndDelete(id);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Submission deleted successfully' 
      });
    } catch (deleteError: any) {
      console.error('Error deleting submission:', deleteError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error deleting submission',
          error: deleteError.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
} 