import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import User from '@/models/User';
import Result from '@/models/Result';
import { Session } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Get URL parameters
    const url = new URL(req.url);
    const competitionId = url.searchParams.get('competitionId');
    const userId = url.searchParams.get('userId') || session.user.id;
    
    if (!competitionId) {
      return NextResponse.json(
        { success: false, message: 'Competition ID is required' },
        { status: 400 }
      );
    }
    
    // Get the competition
    const competition = await Competition.findById(competitionId).lean();
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }
    
    // Get all approved submissions for this competition
    const submissions = await PhotoSubmission.find({
      competition: competitionId,
      status: 'approved'
    })
    .populate({
      path: 'user',
      select: '_id name username email'
    })
    .sort({ averageRating: -1, ratingCount: -1 }) // Sort by rating
    .lean();
    
    // Calculate rankings
    const rankedSubmissions = submissions.map((submission, index) => ({
      ...submission,
      rank: index + 1
    }));
    
    // Get existing Result documents for this competition
    const results = await Result.find({ competition: competitionId })
      .populate('user')
      .populate('photo')
      .lean();
    
    // Get user's submissions and results
    const userSubmissions = rankedSubmissions.filter(s => 
      s.user && s.user._id.toString() === userId
    );
    
    const userResults = results.filter(r => 
      r.user && r.user._id.toString() === userId
    );
    
    // Get top 3 photos in competition
    const top3Photos = rankedSubmissions.slice(0, 3);
    
    return NextResponse.json({
      success: true,
      data: {
        competition,
        rankedSubmissionsCount: rankedSubmissions.length,
        top3Photos,
        userSubmissions,
        userResults,
        existingResultsCount: results.length,
        // Count how many 1st, 2nd, 3rd places the user has in this competition
        userPlacementsInThisCompetition: {
          firstPlace: userSubmissions.filter(s => s.rank === 1).length,
          secondPlace: userSubmissions.filter(s => s.rank === 2).length,
          thirdPlace: userSubmissions.filter(s => s.rank === 3).length,
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error in debug competition results endpoint:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 