import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import dbConnect from '@/lib/dbConnect';

// GET a single photo submission
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession();
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
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
    
    // Only allow the owner or admin to view the submission details
    // if (submission.user._id.toString() !== session.user.id && !isAdmin) {
    //   return NextResponse.json(
    //     { success: false, message: 'Not authorized' },
    //     { status: 403 }
    //   );
    // }
    
    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update a photo submission
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession();
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const submission = await PhotoSubmission.findById(id);
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Only allow the owner to update the submission
    if (submission.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      );
    }
    
    // Check if competition is still active
    const competition = await Competition.findById(submission.competition);
    if (!competition || competition.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Competition is not active' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    // Only allow updating certain fields
    const allowedUpdates = ['title', 'description'];
    const updates: any = {};
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    
    // Update submission
    const updatedSubmission = await PhotoSubmission.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({ success: true, data: updatedSubmission });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE a photo submission
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession();
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const submission = await PhotoSubmission.findById(id);
    
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Only allow the owner or admin to delete the submission
    if (submission.user.toString() !== session.user.id) {
      // Check if user is admin
      // const isAdmin = await checkIfUserIsAdmin(session.user.email);
      // if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      );
      // }
    }
    
    // Check if competition is still active
    const competition = await Competition.findById(submission.competition);
    if (!competition || competition.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete submission after competition has ended' },
        { status: 400 }
      );
    }
    
    // Delete submission
    await PhotoSubmission.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Submission deleted successfully' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 