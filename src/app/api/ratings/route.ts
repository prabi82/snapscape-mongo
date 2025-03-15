import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Rating from '@/models/Rating';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';

// GET ratings (for a specific submission or by user)
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const photoId = url.searchParams.get('photo');

    if (!photoId) {
      return NextResponse.json(
        { success: false, message: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // Find the user's rating for this photo
    const rating = await Rating.findOne({
      photo: photoId,
      user: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: rating ? { score: rating.score } : null,
    });
  } catch (error: any) {
    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fetching your rating' },
      { status: 500 }
    );
  }
}

// POST create a new rating
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { photo: photoId, score } = body;

    // Validate input
    if (!photoId || !score) {
      return NextResponse.json(
        { success: false, message: 'Photo ID and score are required' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { success: false, message: 'Score must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    // Find the photo
    const photo = await PhotoSubmission.findById(photoId);
    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Photo not found' },
        { status: 404 }
      );
    }

    // Ensure the competition is in voting phase
    const competition = await Competition.findById(photo.competition);
    if (!competition || competition.status !== 'voting') {
      return NextResponse.json(
        { success: false, message: 'This competition is not in the voting phase' },
        { status: 400 }
      );
    }

    // Check if user is voting on their own photo
    if (photo.user.toString() === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot vote on your own photo' },
        { status: 400 }
      );
    }

    // Check if user has already rated this photo
    const existingRating = await Rating.findOne({
      photo: photoId,
      user: session.user.id,
    });

    if (existingRating) {
      // Update existing rating
      existingRating.score = score;
      await existingRating.save();
    } else {
      // Create new rating
      await Rating.create({
        photo: photoId,
        user: session.user.id,
        score,
      });
    }

    // Update the photo's average rating
    const ratings = await Rating.find({ photo: photoId });
    const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
    const averageRating = totalScore / ratings.length;

    photo.averageRating = averageRating;
    photo.ratingsCount = ratings.length;
    photo.totalRatingSum = totalScore;
    await photo.save();

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        photoId,
        averageRating,
        ratingsCount: ratings.length,
        userRating: score,
      },
    });
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while submitting your rating' },
      { status: 500 }
    );
  }
} 