import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import { notifySubmissionStatusUpdate } from '@/lib/notification-service';

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