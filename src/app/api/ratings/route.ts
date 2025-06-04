import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Rating from '@/models/Rating';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';

// Define extended session types
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

// GET ratings (for a specific submission or by user)
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const photoId = url.searchParams.get('photo');
    const detailed = url.searchParams.get('detailed') === 'true';
    const type = url.searchParams.get('type'); // 'judge' or undefined

    if (!photoId) {
      return NextResponse.json(
        { success: false, message: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // Check if admin and detailed mode
    const isAdmin = session.user?.role === 'admin';
    
    if (isAdmin && detailed) {
      // For admins requesting detailed ratings, return all ratings for the photo with user details
      const ratings = await Rating.find({ photo: photoId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        data: ratings
      });
    } else if (type === 'judge') {
      // For judge evaluation tab - return ratings from judges only
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      
      // First get all judges
      const judges = await User.find({ role: 'judge' }).select('_id');
      const judgeIds = judges.map(judge => judge._id);
      
      // Then find ratings from judges for this photo
      const judgeRatings = await Rating.find({ 
        photo: photoId,
        user: { $in: judgeIds }
      })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        data: judgeRatings
      });
    } else {
      // Regular behavior - find the user's rating for this photo
      const rating = await Rating.findOne({
        photo: photoId,
        user: session.user?.id,
      });

      return NextResponse.json({
        success: true,
        data: rating ? { score: rating.score } : null,
      });
    }
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
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { photo: photoId, score } = body;

    console.log('Received rating request:', { photoId, score, userId: session.user?.id }); // Debug log

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
    if (photo.user.toString() === session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot vote on your own photo' },
        { status: 400 }
      );
    }

    // Check if user has already rated this photo
    const existingRating = await Rating.findOne({
      photo: photoId,
      user: session.user?.id,
    });

    let rating;
    if (existingRating) {
      // Update existing rating
      existingRating.score = score;
      await existingRating.save();
      rating = existingRating;
    } else {
      // Create new rating
      rating = await Rating.create({
        photo: photoId,
        user: session.user?.id,
        score,
      });
    }

    // Update the photo's average rating
    const ratings = await Rating.find({ photo: photoId });
    const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
    const averageRating = totalScore / ratings.length;

    photo.averageRating = averageRating;
    photo.ratingCount = ratings.length;
    photo.totalRatingSum = totalScore;
    await photo.save();

    console.log('Rating saved successfully:', { 
      photoId, 
      averageRating, 
      ratingCount: ratings.length,
      userRating: score 
    }); // Debug log

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