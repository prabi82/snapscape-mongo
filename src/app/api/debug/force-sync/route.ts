import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import Result from '@/models/Result';
import User from '@/models/User';
import { Session } from 'next-auth';
import mongoose from 'mongoose';

// Define interface for submission with rank
interface SubmissionWithRank {
  _id?: string | mongoose.Types.ObjectId;
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  user?: {
    _id?: string | mongoose.Types.ObjectId;
    name?: string;
    email?: string;
  };
  averageRating?: number;
  ratingCount?: number;
  rank: number;
  [key: string]: any;
}

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
    
    // Get userId from query params or use logged in user
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId') || session.user.id;
    
    // Connect to database
    await dbConnect();
    
    // Debug information
    const debugInfo: Record<string, any> = {
      userInfo: {
        requestedUserId: targetUserId,
        sessionUserId: session.user.id,
      },
      userExists: false,
      competitionInfo: [],
      results: [],
      achievementCounts: {
        firstPlace: 0,
        secondPlace: 0,
        thirdPlace: 0,
        total: 0
      }
    };
    
    // Check if user exists
    const user = await User.findById(targetUserId);
    debugInfo.userExists = user !== null;
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        debug: debugInfo
      }, { status: 404 });
    }
    
    // Get completed competitions
    const competitions = await Competition.find({
      endDate: { $lt: new Date() } // Only completed competitions
    }).lean();
    
    debugInfo.competitionInfo = competitions.map(c => ({
      id: c._id?.toString(),
      title: c.title,
      endDate: c.endDate
    }));
    
    // Get existing results
    const existingResults = await Result.find({ user: targetUserId })
      .populate({
        path: 'competition',
        select: '_id title endDate'
      })
      .populate({
        path: 'photo',
        select: '_id title imageUrl thumbnailUrl'
      }).lean();
    
    debugInfo.existingResults = existingResults.map(r => ({
      id: r._id?.toString(),
      position: r.position,
      competition: r.competition?.title || 'Unknown',
      photo: r.photo?.title || 'Unknown'
    }));
    
    // Check user's submissions in each competition
    for (const competition of competitions) {
      const competitionId = competition._id?.toString();
      if (!competitionId) continue;
      
      // Get all approved submissions for this competition
      const allCompetitionSubmissions = await PhotoSubmission.find({
        competition: competitionId,
        status: 'approved'
      })
      .select('_id title imageUrl thumbnailUrl user averageRating ratingCount')
      .populate('user', '_id name email')
      .lean();
      
      // Get user's submissions
      const userSubmissions = allCompetitionSubmissions.filter(
        s => s.user && s.user._id && s.user._id.toString() === targetUserId
      );
      
      // Calculate ranks for all submissions
      const rankedSubmissions: SubmissionWithRank[] = [];
      let currentRank = 1;
      let lastRating = -1;
      let lastCount = -1;
      
      // Sort all submissions by rating first
      const sortedSubmissions = [...allCompetitionSubmissions].sort((a, b) => {
        if ((b.averageRating || 0) !== (a.averageRating || 0)) {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        return (b.ratingCount || 0) - (a.ratingCount || 0);
      });
      
      // Assign dense ranks
      for (const submission of sortedSubmissions) {
        if (submission.averageRating !== lastRating || submission.ratingCount !== lastCount) {
          currentRank = rankedSubmissions.length + 1;
        }
        
        rankedSubmissions.push({
          ...submission,
          rank: currentRank
        });
        
        lastRating = submission.averageRating;
        lastCount = submission.ratingCount;
      }
      
      // Find user submissions with ranks
      const userRankedSubmissions = rankedSubmissions.filter(
        s => s.user && s.user._id && s.user._id.toString() === targetUserId
      );
      
      // Add to debug info
      debugInfo.competitionInfo.push({
        id: competitionId,
        title: competition.title,
        totalSubmissions: allCompetitionSubmissions.length,
        userSubmissions: userSubmissions.length,
        userRankedSubmissions: userRankedSubmissions.map(s => ({
          id: s._id?.toString(),
          title: s.title,
          rank: s.rank,
          rating: s.averageRating
        }))
      });
      
      // Check if user has top 3 submissions
      for (let position = 1; position <= 3; position++) {
        const inPosition = userRankedSubmissions.filter(s => s.rank === position);
        
        if (inPosition.length > 0) {
          if (position === 1) debugInfo.achievementCounts.firstPlace++;
          if (position === 2) debugInfo.achievementCounts.secondPlace++;
          if (position === 3) debugInfo.achievementCounts.thirdPlace++;
          debugInfo.achievementCounts.total++;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug info generated successfully',
      debug: debugInfo
    });
    
  } catch (error: any) {
    console.error('[DEBUG-FORCE-SYNC] Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'An error occurred',
      error: error.toString()
    }, { status: 500 });
  }
} 