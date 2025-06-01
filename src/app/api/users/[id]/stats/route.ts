import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import PhotoSubmission from '@/models/PhotoSubmission';
import Rating from '@/models/Rating';
import Badge from '@/models/Badge';
import Result from '@/models/Result';
import Competition from '@/models/Competition';
import mongoose from 'mongoose';
import { Session } from 'next-auth';

// Define the structure for point breakdown details
interface PointBreakdownDetail {
  id: string;
  title: string;
  position: number;
  totalRating: number;
  points: number;
  competition: {
    id: string;
    title: string;
  };
  competitionName: string;
}

// Define the structure for other submissions
interface OtherSubmissionDetail {
  id: string;
  title: string;
  totalRating: number;
  points: number;
  competition: {
    id: string;
    title: string;
  } | null;
  competitionName: string;
}

// Define the overall points breakdown structure
interface PointsBreakdown {
  firstPlacePoints: number;
  secondPlacePoints: number;
  thirdPlacePoints: number;
  votingPoints: number;
  otherSubmissionsPoints: number;
  details: PointBreakdownDetail[];
  otherSubmissions: OtherSubmissionDetail[];
}

// Create a map to cache competition names by ID to avoid repetitive lookups
const competitionNamesMap = new Map<string, string>();

// Function to get competition name from ID - caching results
const getCompetitionName = async (competitionId: string): Promise<string> => {
  if (competitionNamesMap.has(competitionId)) {
    return competitionNamesMap.get(competitionId) || 'Unknown Competition';
  }
  
  try {
    const competition = await Competition.findById(competitionId).select('title');
    const title = competition?.title || 'Unknown Competition';
    competitionNamesMap.set(competitionId, title);
    return title;
  } catch (error) {
    console.error(`Error fetching competition ${competitionId}:`, error);
    return 'Unknown Competition';
  }
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Get user ID from URL parameter - fix for sync params access warning
    const { id: userId } = await context.params;
    
    // Get user details for debugging
    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).select('email name');
    console.log(`[DEBUG-USER] Processing stats for user: ${user?.email} (${user?.name}) - ID: ${userId}`);
    
    // Get total submissions count
    const totalSubmissions = await PhotoSubmission.countDocuments({ user: userId });
    console.log(`[DEBUG-SUBMISSIONS-TOTAL] User ${user?.email} has ${totalSubmissions} total submissions`);
    
    // Get only completed competitions to calculate points from
    const completedCompetitions = await Competition.find({ 
      status: 'completed' 
    }).select('_id title status').lean();
    
    const completedCompetitionIds = completedCompetitions.map(comp => 
      (comp._id as mongoose.Types.ObjectId).toString()
    );
    
    console.log(`[DEBUG-COMPETITIONS] Found ${completedCompetitions.length} completed competitions:`, 
      completedCompetitions.map(c => `${c.title} (${c.status})`));
    console.log(`[DEBUG-COMPETITIONS] Completed competition IDs:`, completedCompetitionIds);
    
    // Get top placements only from completed competitions
    const firstPlace = await Result.countDocuments({ 
      user: userId, 
      position: 1,
      competition: { $in: completedCompetitionIds }
    });
    const secondPlace = await Result.countDocuments({ 
      user: userId, 
      position: 2,
      competition: { $in: completedCompetitionIds }
    });
    const thirdPlace = await Result.countDocuments({ 
      user: userId, 
      position: 3,
      competition: { $in: completedCompetitionIds }
    });
    
    console.log(`[DEBUG-RESULTS] User ${user?.email} placements in completed competitions: 1st=${firstPlace}, 2nd=${secondPlace}, 3rd=${thirdPlace}`);
    
    // Count submissions by competition
    const submissionsByCompetition = await PhotoSubmission.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$competition', count: { $sum: 1 } } }
    ]);
    
    // Count unique competitions
    const uniqueCompetitionsCount = submissionsByCompetition.length;
    
    // Get all user submissions with their ratings to calculate total points
    // Only include submissions from completed competitions for points calculation
    const userSubmissions = await PhotoSubmission.find({ 
      user: userId,
      status: 'approved', // Only count approved submissions
      competition: { $in: completedCompetitionIds } // Only from completed competitions
    }).lean();
    
    console.log(`[DEBUG-SUBMISSIONS] Found ${userSubmissions.length} submissions from completed competitions for user ${user?.email}`);
    console.log(`[DEBUG-SUBMISSIONS] Submission details:`, userSubmissions.map(s => ({
      title: s.title,
      competition: s.competition?.toString(),
      averageRating: s.averageRating,
      ratingCount: s.ratingCount,
      status: s.status
    })));
    
    // Get user results to find ranking positions - only from completed competitions
    const userResults = await Result.find({
      user: userId,
      competition: { $in: completedCompetitionIds } // Only from completed competitions
    }).lean();
    
    console.log(`[DEBUG-RESULTS] Found ${userResults.length} result records for user ${user?.email} in completed competitions`);
    console.log(`[DEBUG-RESULTS] Result details:`, userResults.map(r => ({
      competition: r.competition?.toString(),
      position: r.position
    })));
    
    // Get count of unique photos rated by this user (votes cast)
    // Improved query to ensure uniqueness and proper vote counting
    const ratings = await Rating.find({ user: userId }).lean();
    
    // Create a Set of unique photo IDs to ensure each vote is counted only once
    const uniquePhotoIds = new Set();
    ratings.forEach(rating => {
      uniquePhotoIds.add(rating.photo.toString());
    });
    
    // The count of unique photos rated is the size of the Set
    const ratingsCount = uniquePhotoIds.size;
    
    // Debug: Log the specific photos that were voted on
    console.log(`[DEBUG-VOTING-DETAIL] User ${user?.email} voted on these photos:`, Array.from(uniquePhotoIds));
    
    // Detect self-votes (users voting on their own photos)
    // First get all photos submitted by this user
    const userSubmittedPhotoIds = userSubmissions.map(sub => 
      (sub._id as mongoose.Types.ObjectId).toString()
    );
    
    // Check if any of the rated photos are also submitted by the user (should not happen due to API checks)
    const selfVotes = Array.from(uniquePhotoIds).filter(photoId => 
      userSubmittedPhotoIds.includes(photoId as string)
    );
    
    if (selfVotes.length > 0) {
      console.log(`[DEBUG-VOTING-WARNING] User ${user?.email} has ${selfVotes.length} self-votes: `, selfVotes);
    }
    
    // Calculate total points based on the new ranking formula:
    // 1st place: totalRating * 5
    // 2nd place: totalRating * 3
    // 3rd place: totalRating * 2
    // Plus 1 point for each vote cast
    let totalPoints = 0;
    
    // Track point breakdown for detailed display
    const pointsBreakdown: PointsBreakdown = {
      firstPlacePoints: 0,
      secondPlacePoints: 0,
      thirdPlacePoints: 0,
      votingPoints: ratingsCount, // Each vote = 1 point (regardless of rating value)
      otherSubmissionsPoints: 0,
      details: [],
      otherSubmissions: []
    };
    
    // DEBUG: Log all ratings for this user to check for issues
    console.log(`[DEBUG-VOTING] User ${user?.email} has ${ratingsCount} unique photo votes in the database (1 vote = 1 point)`);
    
    console.log(`[DEBUG-POINTS] Starting calculation for user ${user?.email} with voting points = ${pointsBreakdown.votingPoints}`);
    
    // Since we have 0 completed competitions, userSubmissions should be empty
    // Let's verify this and see if there's any unexpected data
    if (userSubmissions.length === 0) {
      console.log(`[DEBUG-POINTS] ✅ CORRECT: No submissions from completed competitions, so no ranking points should be calculated`);
    } else {
      console.log(`[DEBUG-POINTS] ❌ ERROR: Found ${userSubmissions.length} submissions from completed competitions when there should be 0!`);
    }
    
    // Points from ranking positions (1st, 2nd, 3rd places)
    const rankedSubmissions: string[] = [];
    
    // Get all competition photo submissions and their ranks
    const competitionPhotoRanks = new Map<string, Map<string, number>>();
    
    // First, fetch all ranking positions for all user photos across competitions
    // This is needed to handle cases where a user has multiple photos at the same rank
    // Only process completed competitions
    for (const submission of userSubmissions) {
      if (submission.competition) {
        const competitionId = submission.competition.toString();
        
        // Skip if this competition is not completed
        if (!completedCompetitionIds.includes(competitionId)) {
          continue;
        }
        
        try {
          // Get all approved submissions for this competition to calculate dense ranks
          const allCompetitionSubmissions = await PhotoSubmission.find({
            competition: competitionId,
            status: 'approved'
          })
          .sort({ averageRating: -1, ratingCount: -1 }) // Sort by rating
          .lean();
          
          // Calculate dense rankings - photos with same rating get same rank
          let currentRank = 0;
          let lastRating = Number.MAX_VALUE;
          let lastRatingCount = Number.MAX_VALUE;
          
          // Map of photoId -> rank
          const photoRanks = new Map<string, number>();
          
          for (const sub of allCompetitionSubmissions) {
            if (sub.averageRating !== lastRating || (sub.ratingCount || 0) !== lastRatingCount) {
              currentRank++;
            }
            
            // Apply type assertion to handle TypeScript error
            photoRanks.set((sub._id as mongoose.Types.ObjectId).toString(), currentRank);
            
            lastRating = sub.averageRating;
            lastRatingCount = sub.ratingCount || 0;
          }
          
          competitionPhotoRanks.set(competitionId, photoRanks);
        } catch (error) {
          console.error(`Error calculating ranks for competition ${competitionId}:`, error);
        }
      }
    }
    
    // Process result records first (official placements)
    for (const result of userResults) {
      // Get the submission that earned this result
      const submission = userSubmissions.find(sub => 
        sub.competition && sub.competition.toString() === result.competition?.toString()
      );
      
      if (submission) {
        const totalRating = (submission.averageRating || 0) * (submission.ratingCount || 0);
        
        // Add this submission ID to the ranked list
        rankedSubmissions.push((submission._id as mongoose.Types.ObjectId).toString());
        
        let points = 0;
        let category: string = 'otherSubmissionsPoints';
        
        // Get the photo's actual rank in the competition
        const competitionId = submission.competition.toString();
        const photoId = (submission._id as mongoose.Types.ObjectId).toString();
        const photoRanks = competitionPhotoRanks.get(competitionId);
        let actualRank = photoRanks?.get(photoId) || 4; // Default to 4th if unknown
        
        // Apply the correct multiplier based on the photo's actual rank
        if (actualRank === 1) {
          points = totalRating * 5; // Correct multiplier for 1st place
          category = 'firstPlacePoints';
        } else if (actualRank === 2) {
          points = totalRating * 3; // Correct multiplier for 2nd place
          category = 'secondPlacePoints';
        } else if (actualRank === 3) {
          points = totalRating * 2; // Correct multiplier for 3rd place
          category = 'thirdPlacePoints';
        } else {
          // Position 4+ gets totalRating * 1
          points = totalRating * 1; // Explicitly show multiplier for clarity
        }
        
        // Add points to the appropriate category using type safety
        if (category === 'firstPlacePoints') {
          pointsBreakdown.firstPlacePoints += points;
        } else if (category === 'secondPlacePoints') {
          pointsBreakdown.secondPlacePoints += points;
        } else if (category === 'thirdPlacePoints') {
          pointsBreakdown.thirdPlacePoints += points;
        } else {
          pointsBreakdown.otherSubmissionsPoints += points;
        }
        
        // Add detailed point information
        pointsBreakdown.details.push({
          id: (submission._id as mongoose.Types.ObjectId).toString(),
          title: submission.title,
          position: result.position,
          totalRating: totalRating,
          points: points,
          competition: {
            id: submission.competition.toString(),
            title: 'Competition' // We could fetch the competition title here if needed
          },
          competitionName: await getCompetitionName(submission.competition.toString())
        });
      }
    }
    
    // Process remaining submissions (those without a Result record)
    // Find submissions that aren't in the rankedSubmissions array
    const otherSubmissions = userSubmissions.filter(sub => 
      !rankedSubmissions.includes((sub._id as mongoose.Types.ObjectId).toString()) && 
      sub.status === 'approved' // Only count approved submissions
    );
    
    console.log(`[DEBUG-OTHER-SUBMISSIONS] User ${user?.email} - Found ${otherSubmissions.length} other submissions to process`);
    console.log(`[DEBUG-OTHER-SUBMISSIONS] Other submissions details:`, otherSubmissions.map(s => ({
      title: s.title,
      competition: s.competition?.toString(),
      averageRating: s.averageRating,
      ratingCount: s.ratingCount
    })));
    
    // Calculate points for these other submissions based on their actual rank
    for (const submission of otherSubmissions) {
      if (!submission.competition) continue;
      
      const competitionId = submission.competition.toString();
      const photoId = (submission._id as mongoose.Types.ObjectId).toString();
      
      console.log(`[DEBUG-OTHER-PROCESSING] User ${user?.email} - Processing submission "${submission.title}" from competition ${competitionId}`);
      
      // Get the photo's actual rank in the competition
      const photoRanks = competitionPhotoRanks.get(competitionId);
      let actualRank = photoRanks?.get(photoId) || 4; // Default to 4th if unknown
      
      const totalRating = (submission.averageRating || 0) * (submission.ratingCount || 0);
      
      let points = 0;
      let category: string = 'otherSubmissionsPoints';
      
      // Apply the correct multiplier based on the photo's actual rank
      if (actualRank === 1) {
        points = totalRating * 5; // Correct multiplier for 1st place
        category = 'firstPlacePoints';
      } else if (actualRank === 2) {
        points = totalRating * 3; // Correct multiplier for 2nd place
        category = 'secondPlacePoints';
      } else if (actualRank === 3) {
        points = totalRating * 2; // Correct multiplier for 3rd place
        category = 'thirdPlacePoints';
      } else {
        // Position 4+ gets totalRating * 1
        points = totalRating * 1; // Explicitly show multiplier for clarity
      }
      
      // Add points to the appropriate category using type safety
      if (category === 'firstPlacePoints') {
        pointsBreakdown.firstPlacePoints += points;
      } else if (category === 'secondPlacePoints') {
        pointsBreakdown.secondPlacePoints += points;
      } else if (category === 'thirdPlacePoints') {
        pointsBreakdown.thirdPlacePoints += points;
      } else {
        pointsBreakdown.otherSubmissionsPoints += points;
      }
      
      console.log(`[DEBUG-POINTS] User ${user?.email} - Photo "${submission.title}" has rank ${actualRank}, adding ${points} points to ${category}`);
      console.log(`[DEBUG-POINTS] User ${user?.email} - Calculation: totalRating=${totalRating} (${submission.averageRating} × ${submission.ratingCount}), multiplier=${actualRank <= 3 ? (actualRank === 1 ? 5 : actualRank === 2 ? 3 : 2) : 1}`);
      
      // Add detailed point information
      if (category !== 'otherSubmissionsPoints') {
        pointsBreakdown.details.push({
          id: photoId,
          title: submission.title,
          position: actualRank,
          totalRating: totalRating,
          points: points,
          competition: {
            id: competitionId,
            title: 'Competition' 
          },
          competitionName: await getCompetitionName(competitionId)
        });
      } else {
        // Store details about this submission in the otherSubmissions array
        pointsBreakdown.otherSubmissions.push({
          id: photoId,
          title: submission.title,
          totalRating: totalRating,
          points: points,
          competition: submission.competition ? {
            id: submission.competition.toString(),
            title: 'Competition'
          } : null,
          competitionName: submission.competition ? await getCompetitionName(submission.competition.toString()) : 'Unknown Competition'
        });
      }
    }
    
    // Add 1 point for each vote cast by the user (use the possibly corrected votingPoints value)
    totalPoints += pointsBreakdown.votingPoints;
    console.log(`[DEBUG-FINAL-CALC] User ${user?.email} - Added voting points: ${pointsBreakdown.votingPoints}, running total: ${totalPoints}`);
    
    // Add points from all the different categories
    totalPoints += pointsBreakdown.firstPlacePoints;
    console.log(`[DEBUG-FINAL-CALC] User ${user?.email} - Added 1st place points: ${pointsBreakdown.firstPlacePoints}, running total: ${totalPoints}`);
    
    totalPoints += pointsBreakdown.secondPlacePoints;
    console.log(`[DEBUG-FINAL-CALC] User ${user?.email} - Added 2nd place points: ${pointsBreakdown.secondPlacePoints}, running total: ${totalPoints}`);
    
    totalPoints += pointsBreakdown.thirdPlacePoints;
    console.log(`[DEBUG-FINAL-CALC] User ${user?.email} - Added 3rd place points: ${pointsBreakdown.thirdPlacePoints}, running total: ${totalPoints}`);
    
    totalPoints += pointsBreakdown.otherSubmissionsPoints;
    console.log(`[DEBUG-FINAL-CALC] User ${user?.email} - Added other submissions points: ${pointsBreakdown.otherSubmissionsPoints}, running total: ${totalPoints}`);
    
    // Round to the nearest integer for display
    totalPoints = Math.round(totalPoints);
    console.log(`[DEBUG-FINAL-CALC] User ${user?.email} - Final total points after rounding: ${totalPoints}`);
    
    // Log the complete breakdown for debugging
    console.log(`[DEBUG-BREAKDOWN] User ${user?.email} complete points breakdown:`, {
      votingPoints: pointsBreakdown.votingPoints,
      firstPlacePoints: pointsBreakdown.firstPlacePoints,
      secondPlacePoints: pointsBreakdown.secondPlacePoints,
      thirdPlacePoints: pointsBreakdown.thirdPlacePoints,
      otherSubmissionsPoints: pointsBreakdown.otherSubmissionsPoints,
      totalCalculated: totalPoints,
      detailsCount: pointsBreakdown.details.length,
      otherSubmissionsCount: pointsBreakdown.otherSubmissions.length
    });
    
    const stats = {
      totalSubmissions,
      uniqueCompetitionsCount,
      topPlacements: {
        firstPlace,
        secondPlace,
        thirdPlace,
        totalTopThree: firstPlace + secondPlace + thirdPlace
      },
      submissionsByCompetition,
      totalPoints,
      pointsBreakdown
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
} 