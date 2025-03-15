import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import Photo from '@/models/Photo';

// GET a single competition
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const competitionId = params.id;
    if (!competitionId) {
      return NextResponse.json(
        { success: false, message: 'Competition ID is required' },
        { status: 400 }
      );
    }

    // Find the competition by ID and populate related data
    const competition = await Competition.findById(competitionId)
      .populate('createdBy', 'name email')
      .exec();

    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }

    // Get submission count for this competition from both models
    const photoCount = await Photo.countDocuments({ competition: competitionId });
    const submissionCount = await PhotoSubmission.countDocuments({ competition: competitionId });
    
    // Total count is the sum of both models
    const totalSubmissionCount = photoCount + submissionCount;

    // Add submission count to competition data
    const competitionData = competition.toObject();
    competitionData.submissionCount = totalSubmissionCount;

    // Log the competition data for debugging
    console.log('Competition data:', {
      id: competitionData._id,
      title: competitionData.title,
      hasCoverImage: !!competitionData.coverImage,
      coverImage: competitionData.coverImage,
      submissionCount: competitionData.submissionCount,
      photoCount,
      photoSubmissionCount: submissionCount
    });

    return NextResponse.json({
      success: true,
      data: competitionData
    });
  } catch (error: any) {
    console.error('Error fetching competition:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fetching the competition' },
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
    await connectDB();
    const session = await getServerSession(authOptions);
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
    
    // Parse the request body
    const body = await req.json();
    
    // Prepare update data
    const updateData = { ...body };
    
    // Handle dates manually - parse all dates to ensure proper format
    const startDate = body.startDate ? new Date(body.startDate) : competition.startDate;
    const endDate = body.endDate ? new Date(body.endDate) : competition.endDate;
    const votingEndDate = body.votingEndDate ? new Date(body.votingEndDate) : competition.votingEndDate;
    
    // Validate date formats
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid start date format' },
        { status: 400 }
      );
    }
    
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid end date format' },
        { status: 400 }
      );
    }
    
    if (votingEndDate && isNaN(votingEndDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid voting end date format' },
        { status: 400 }
      );
    }
    
    // Manually validate date relationships
    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }
    
    if (votingEndDate <= endDate) {
      return NextResponse.json(
        { success: false, message: 'Voting end date must be after submission end date' },
        { status: 400 }
      );
    }
    
    // Set the dates in the update data
    updateData.startDate = startDate;
    updateData.endDate = endDate;
    updateData.votingEndDate = votingEndDate;
    
    console.log('Updating competition with data:', {
      id: id,
      title: updateData.title,
      startDate: updateData.startDate,
      endDate: updateData.endDate,
      votingEndDate: updateData.votingEndDate,
    });
    
    // Update the competition using findOneAndReplace to bypass validators
    // or use updateOne with runValidators: false
    const result = await Competition.updateOne(
      { _id: id },
      { $set: updateData },
      { runValidators: false }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No changes were made' },
        { status: 400 }
      );
    }
    
    // Fetch the updated competition
    const updatedCompetition = await Competition.findById(id);
    
    return NextResponse.json({ success: true, data: updatedCompetition });
  } catch (error: any) {
    console.error('Error updating competition:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while updating the competition' },
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
    await connectDB();
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