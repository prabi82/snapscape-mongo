import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Rating from '@/models/Rating';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import dbConnect from '@/lib/dbConnect';

// GET ratings (for a specific submission or by user)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const submissionId = url.searchParams.get('submission');
    const competitionId = url.searchParams.get('competition');
    const showUserRatings = url.searchParams.get('userRatings') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (submissionId) {
      query.photoSubmission = submissionId;
    }
    
    if (competitionId) {
      query.competition = competitionId;
    }
    
    // Only show ratings for the current user's submissions or the user's own ratings
    if (showUserRatings) {
      query.user = session.user.id;
    } else {
      // Only show ratings for submissions that belong to the current user
      if (!submissionId && !competitionId) {
        const userSubmissions = await PhotoSubmission.find({ user: session.user.id }).select('_id');
        const submissionIds = userSubmissions.map(sub => sub._id);
        query.photoSubmission = { $in: submissionIds };
      }
    }
    
    const ratings = await Rating.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name')
      .populate('photoSubmission', 'title')
      .populate('competition', 'title');
      
    const total = await Rating.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: ratings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create a new rating
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['photoSubmission', 'rating'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Validate rating value
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Get submission details
    const submission = await PhotoSubmission.findById(body.photoSubmission);
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Submission not found' },
        { status: 404 }
      );
    }
    
    // Check if competition is active or closed (can only rate during active or closed phase)
    const competition = await Competition.findById(submission.competition);
    if (!competition || (competition.status !== 'active' && competition.status !== 'closed')) {
      return NextResponse.json(
        { success: false, message: 'Competition is not available for rating' },
        { status: 400 }
      );
    }
    
    // Prevent users from rating their own submissions
    if (submission.user.toString() === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot rate your own submission' },
        { status: 400 }
      );
    }
    
    // Set user and competition IDs
    body.user = session.user.id;
    body.competition = submission.competition;
    
    // Check if user has already rated this submission
    const existingRating = await Rating.findOne({
      user: session.user.id,
      photoSubmission: body.photoSubmission,
    });
    
    let rating;
    
    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;
      existingRating.rating = body.rating;
      if (body.comment) {
        existingRating.comment = body.comment;
      }
      rating = await existingRating.save();
      
      // Update submission average rating
      submission.totalRatingSum = submission.totalRatingSum - oldRating + body.rating;
      await submission.updateAverageRating();
    } else {
      // Create new rating
      rating = await Rating.create(body);
      
      // Update submission average rating
      submission.totalRatingSum += body.rating;
      submission.ratingCount += 1;
      await submission.updateAverageRating();
    }
    
    return NextResponse.json(
      { success: true, data: rating },
      { status: existingRating ? 200 : 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 