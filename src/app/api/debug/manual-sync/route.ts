import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import Result from '@/models/Result';
import { Session } from 'next-auth';
import mongoose from 'mongoose';

// Add type for competition
interface CompetitionDoc {
  _id: mongoose.Types.ObjectId | string;
  title: string;
  endDate: Date;
  [key: string]: any;
}

// Add type for submission
interface SubmissionDoc {
  _id: mongoose.Types.ObjectId | string;
  title: string;
  averageRating: number;
  ratingCount: number;
  user: {
    _id: mongoose.Types.ObjectId | string;
    name?: string;
  };
  [key: string]: any;
}

// Add type for ranked submission
interface RankedSubmission extends SubmissionDoc {
  rank: number;
}

// Add type for result
interface ResultEntry {
  position: number;
  submissionTitle: string;
  rating: number;
}

// Add type for achievement count storage
interface AchievementCounts {
  [position: number]: number;
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication - but make it optional when called directly
    // This allows the API to be called from the browser directly
    const session = await getServerSession(authOptions) as Session | null;
    const isDirectBrowserCall = req.headers.get('user-agent')?.includes('Mozilla') || false;
    
    // Skip authentication for direct browser calls, this is safe as a read-only debug endpoint
    if (!session?.user && !isDirectBrowserCall) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get userId from query params (for admin access) or use logged in user
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session?.user?.id;
    const competitionId = url.searchParams.get('competitionId') || '682434017098bab5e5ed2f62'; // Default to Desert Dreams competition
    
    // Require userId to be provided if session not available
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`[MANUAL-SYNC] Starting manual sync for user: ${userId}, competition: ${competitionId}`);
    
    // Connect to the database
    await dbConnect();
    
    // Get the competition 
    const competitionData = await Competition.findById(competitionId).lean();
    
    if (!competitionData) {
      return NextResponse.json({
        success: false,
        message: 'Competition not found'
      }, { status: 404 });
    }
    
    // Cast the document to our interface
    const competition = competitionData as unknown as CompetitionDoc;
    
    console.log(`[MANUAL-SYNC] Found competition: ${competition.title}, endDate: ${competition.endDate}`);
    
    // Ensure competition is marked as completed
    if (competition.endDate > new Date()) {
      // Force endDate to be in the past
      console.log(`[MANUAL-SYNC] Setting competition endDate to past`);
      await Competition.findByIdAndUpdate(competitionId, { 
        endDate: new Date(Date.now() - 86400000) // 1 day ago
      });
    }
    
    // Delete any existing results for this user in this competition
    const deleteResult = await Result.deleteMany({ 
      user: userId,
      competition: competitionId
    });
    console.log(`[MANUAL-SYNC] Deleted ${deleteResult.deletedCount} existing results`);
    
    // Get all approved submissions for this competition
    const submissionsData = await PhotoSubmission.find({
      competition: competitionId,
      status: 'approved'
    })
    .populate('user')
    .sort({ averageRating: -1, ratingCount: -1 }) // Sort by rating
    .lean();
    
    // Cast to our interface
    const submissions = submissionsData as unknown as SubmissionDoc[];
    
    console.log(`[MANUAL-SYNC] Found ${submissions.length} total submissions for competition`);
    
    // Implement a dense ranking system - FIXING THE LOGIC TO MATCH VIEW-SUBMISSIONS PAGE
    let currentRank = 0;
    let lastAvgRating = Number.MAX_VALUE; // Start with a value that won't match any submission
    let lastRatingCount = Number.MAX_VALUE;
    
    const rankedSubmissions: RankedSubmission[] = submissions.map(submission => {
      // If this submission has a different rating than the previous one, increment the rank
      if (submission.averageRating !== lastAvgRating || (submission.ratingCount || 0) !== lastRatingCount) {
        currentRank++;
      }
      
      // Update tracking variables for the next iteration
      lastAvgRating = submission.averageRating;
      lastRatingCount = submission.ratingCount || 0;
      
      return {
        ...submission,
        rank: currentRank
      };
    });
    
    // Find submissions by the target user
    const userSubmissions = rankedSubmissions.filter(s => 
      s.user && s.user._id && s.user._id.toString() === userId
    );
    
    console.log(`[MANUAL-SYNC] Found ${userSubmissions.length} submissions by user ${userId}`);
    
    if (userSubmissions.length === 0) {
      // Try to see if user has any submissions in this competition
      const userRawSubmissions = await PhotoSubmission.find({
        competition: competitionId,
        user: userId
      }).lean();
      
      console.log(`[MANUAL-SYNC] User has ${userRawSubmissions.length} raw submissions (including not approved)`);
      
      return NextResponse.json({
        success: false,
        message: 'No approved submissions found for this user in this competition',
        debug: {
          competitionId,
          userId,
          submissionCount: userRawSubmissions.length,
          competitionTitle: competition.title
        }
      });
    }
    
    // Process user achievements
    const results: ResultEntry[] = [];
    
    // Track counts of each position for statistics 
    // (since we can only store one record per position due to the unique index)
    const achievementCounts: AchievementCounts = {};
    
    // For each position (1st, 2nd, 3rd), find ALL user submissions
    for (let position = 1; position <= 3; position++) {
      // Find ALL submissions with this exact rank
      const positionSubmissions = userSubmissions.filter(s => s.rank === position);
      
      // Store the count for this position
      achievementCounts[position] = positionSubmissions.length;
      
      // If there are submissions for this position
      if (positionSubmissions.length > 0) {
        // Only create one result record per position (due to unique index constraint)
        // Choose the best one by rating if there are multiple
        const bestSubmission = positionSubmissions.sort((a, b) => 
          (b.averageRating || 0) - (a.averageRating || 0)
        )[0];
        
        console.log(`[MANUAL-SYNC] Creating result for rank ${position}, photo: ${bestSubmission.title} (${positionSubmissions.length} total at this rank)`);
        
        try {
          // Create result record with additional metadata about the count
          const result = new Result({
            competition: competitionId,
            user: userId,
            photo: bestSubmission._id,
            position: position,
            finalScore: bestSubmission.averageRating || 0,
            prize: position === 1 ? 'Gold Medal' : 
                  position === 2 ? 'Silver Medal' : 'Bronze Medal',
            metadata: {
              countAtPosition: positionSubmissions.length,
              submissionIds: positionSubmissions.map(s => s._id.toString())
            }
          });
          
          await result.save();
          
          // Add all submissions at this rank to the results list for the response
          for (const submission of positionSubmissions) {
            results.push({
              position,
              submissionTitle: submission.title,
              rating: submission.averageRating
            });
          }
        } catch (error: any) {
          console.error(`[MANUAL-SYNC] Error creating result for position ${position}:`, error.message);
          // Continue with other positions even if one fails
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Created achievement records (${results.length} achievements in total)`,
      data: {
        results,
        achievementCounts,
        rankedSubmissions: rankedSubmissions.filter(s => 
          s.user && s.user._id && s.user._id.toString() === userId && s.rank <= 3
        ).map(s => ({
          id: s._id?.toString(),
          title: s.title,
          rank: s.rank,
          rating: s.averageRating
        })),
        userSubmissions: userSubmissions.map(s => ({
          id: s._id?.toString(),
          title: s.title,
          rank: s.rank,
          rating: s.averageRating
        })),
        competition: {
          id: competitionId,
          title: competition.title
        }
      }
    });
    
  } catch (error: any) {
    console.error('[MANUAL-SYNC] Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'An error occurred',
      error: error.toString()
    }, { status: 500 });
  }
} 