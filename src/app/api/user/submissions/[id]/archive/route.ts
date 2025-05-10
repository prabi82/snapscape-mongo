import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhotoSubmission from '@/models/PhotoSubmission';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('Archive endpoint called with ID:', params.id);
  
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    console.log('Session check:', { 
      hasSession: Boolean(session), 
      hasUser: Boolean(session?.user),
      userId: session?.user?.id 
    });
    
    // Check authentication
    if (!session || !session.user) {
      console.log('Authentication failed');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find the submission
    const submission = await PhotoSubmission.findById(id);
    console.log('Found submission:', { 
      exists: Boolean(submission),
      submissionId: submission?._id,
      currentArchived: submission?.archived,
      ownerId: submission?.user?.toString()
    });
    
    if (!submission) {
      console.log('Submission not found');
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Only allow the owner to archive their submission
    if (submission.user.toString() !== session.user.id) {
      console.log('Authorization failed:', {
        submissionOwner: submission.user.toString(),
        currentUser: session.user.id
      });
      return NextResponse.json(
        { success: false, message: 'Not authorized to archive this submission' },
        { status: 403 }
      );
    }
    
    try {
      const body = await req.json();
      console.log('Parsed request body:', body);
      const { archived } = body;
      console.log('archived value to set:', archived);
      if (typeof archived !== 'boolean') {
        return NextResponse.json({ success: false, message: 'Missing or invalid archived value' }, { status: 400 });
      }
      // Set the archived status explicitly
      const updatedSubmission = await PhotoSubmission.findByIdAndUpdate(
        id,
        { $set: { archived } },
        { new: true }
      );
      console.log('Update result:', {
        success: Boolean(updatedSubmission),
        newArchivedStatus: updatedSubmission?.archived
      });
      return NextResponse.json({ 
        success: true, 
        message: updatedSubmission.archived ? 'Image archived successfully' : 'Image unarchived successfully',
        data: updatedSubmission
      });
    } catch (updateError: any) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error updating submission',
          error: updateError.message 
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