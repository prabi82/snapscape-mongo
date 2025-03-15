import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import Rating from '@/models/Rating';

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
    const competitionId = url.searchParams.get('competition');
    const status = url.searchParams.get('status') || 'approved';
    const userId = url.searchParams.get('user');
    
    // Parse pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (competitionId) {
      query.competition = competitionId;
      
      // Verify the competition exists and is in voting or completed status
      const competition = await Competition.findById(competitionId);
      if (!competition) {
        return NextResponse.json(
          { success: false, message: 'Competition not found' },
          { status: 404 }
        );
      }
      
      // Only return approved submissions for competitions in voting or completed status
      if (competition.status === 'voting' || competition.status === 'completed') {
        query.status = 'approved';
      } else {
        // If checking own submissions (user is specified and matches current user)
        if (userId && userId === session.user.id) {
          // Allow viewing own submissions regardless of competition status
        } else {
          // For other cases, block access to submissions for non-voting competitions
          return NextResponse.json(
            { success: false, message: 'Competition is not in voting phase' },
            { status: 403 }
          );
        }
      }
    }
    
    // Add user filter if specified
    if (userId) {
      query.user = userId;
    }
    
    // Add status filter if specified and user is viewing their own submissions
    // or user is an admin
    if (userId === session.user.id || session.user.role === 'admin') {
      if (status && status !== 'all') {
        query.status = status;
      }
    } else {
      // Non-admins and users viewing others' submissions can only see approved photos
      query.status = 'approved';
    }

    // Execute query with pagination
    const submissions = await PhotoSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email profileImage')
      .lean();
    
    const total = await PhotoSubmission.countDocuments(query);

    // For each submission, check if the current user has rated it
    const submissionsWithUserRatings = await Promise.all(
      submissions.map(async (submission) => {
        const userRating = await Rating.findOne({
          photo: submission._id,
          user: session.user.id,
        });
        
        return {
          ...submission,
          userRating: userRating ? userRating.score : undefined,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: submissionsWithUserRatings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching photo submissions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fetching photo submissions' },
      { status: 500 }
    );
  }
} 