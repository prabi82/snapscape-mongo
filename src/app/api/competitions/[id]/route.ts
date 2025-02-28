import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import dbConnect from '@/lib/dbConnect';

// GET a single competition
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    
    const competition = await Competition.findById(id)
      .populate('createdBy', 'name');
    
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: competition });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT update a competition (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession();
    const { id } = params;
    
    // Check authentication and admin role
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find the competition
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to update
    // In a real implementation, you would check if the user is an admin
    // This is just a placeholder
    // if (!isAdmin && competition.createdBy.toString() !== session.user.id) {
    //   return NextResponse.json(
    //     { success: false, message: 'Not authorized' },
    //     { status: 403 }
    //   );
    // }
    
    const body = await req.json();
    
    // Update competition
    const updatedCompetition = await Competition.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({ success: true, data: updatedCompetition });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE a competition (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession();
    const { id } = params;
    
    // Check authentication and admin role
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find the competition
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to delete
    // In a real implementation, you would check if the user is an admin
    // This is just a placeholder
    // if (!isAdmin && competition.createdBy.toString() !== session.user.id) {
    //   return NextResponse.json(
    //     { success: false, message: 'Not authorized' },
    //     { status: 403 }
    //   );
    // }
    
    // Check if there are any submissions
    const submissionsExist = await PhotoSubmission.exists({ competition: id });
    
    if (submissionsExist) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete competition with existing submissions' 
        },
        { status: 400 }
      );
    }
    
    // Delete competition
    await Competition.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Competition deleted successfully' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 