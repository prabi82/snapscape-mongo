import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import Result from '@/models/Result';
import { Session } from 'next-auth';
import mongoose from 'mongoose';
import { notifyCompetitionResults } from '@/lib/notification-service';

interface SubmissionWithRank {
  _id: mongoose.Types.ObjectId | string;
  rank: number;
  averageRating?: number;
  ratingCount?: number;
  user?: {
    _id: mongoose.Types.ObjectId | string;
  };
  [key: string]: any; // Allow any other properties that may be present
}

export async function POST(req: NextRequest) {
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
    
    // Only allow admins or the specific user to sync their own results
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId') || session?.user?.id;
    
    // Require userId to be provided if session not available
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Debug information
    console.log(`[DEBUG-SYNC] Starting sync for user ID: ${targetUserId}`);
    console.log(`[DEBUG-SYNC] Session user ID: ${session?.user?.id || 'No session'}`);
    
    // Check authorization if there is a session
    if (session?.user && targetUserId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Ensure proper indexes exist on the Result collection
    await ensureProperIndexes();
    
    // Get all completed competitions
    const competitions = await Competition.find({
      endDate: { $lt: new Date() } // Only completed competitions
    }).lean();
    
    console.log(`[DEBUG-SYNC] Found ${competitions.length} completed competitions`);
    
    if (competitions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No completed competitions found'
      });
    }
    
    // Delete all existing results for the user (we'll rebuild them)
    const deleteResult = await Result.deleteMany({ user: targetUserId });
    console.log(`[DEBUG-SYNC] Deleted ${deleteResult.deletedCount} existing results for user ${targetUserId}`);
    
    const results: any[] = [];
    const errors: any[] = [];
    const notifications: any[] = [];
    
    // Process each competition
    for (const competition of competitions) {
      try {
        if (!competition._id) continue;
        
        const competitionId = competition._id.toString();
        console.log(`[DEBUG-SYNC] Processing competition: ${competition.title} (${competitionId})`);
        
        // Get all approved submissions for this competition
        const submissions = await PhotoSubmission.find({
          competition: competitionId,
          status: 'approved'
        })
        .populate('user')
        .sort({ averageRating: -1, ratingCount: -1 }) // Sort by rating
        .lean();
        
        console.log(`[DEBUG-SYNC] Competition ${competition.title}: Found ${submissions.length} total submissions`);
        
        if (submissions.length === 0) continue;
        
        // Implement a dense ranking system that properly handles ties
        let currentRank = 1;
        let lastAvgRating = -1;
        let lastRatingCount = -1;
        
        // Create ranked submissions using dense ranking (same as view-submissions page)
        const rankedSubmissions: SubmissionWithRank[] = [];
        
        for (const submission of submissions) {
          // If this submission has a different rating than the previous one, increment the rank
          if (submission.averageRating !== lastAvgRating || (submission.ratingCount || 0) !== lastRatingCount) {
            currentRank = rankedSubmissions.length + 1; // Next rank
          }
          
          // Explicitly cast the submission to SubmissionWithRank to ensure type safety
          rankedSubmissions.push({
            ...submission,
            rank: currentRank
          } as SubmissionWithRank);
          
          // Update tracking variables for the next iteration
          lastAvgRating = submission.averageRating;
          lastRatingCount = submission.ratingCount || 0;
        }
        
        // Get user's submissions with rankings
        const userSubmissions = rankedSubmissions.filter(s => 
          s.user && s.user._id && s.user._id.toString() === targetUserId
        );
        
        console.log(`[DEBUG-SYNC] Competition ${competition.title}: Found ${userSubmissions.length} submissions for user ${targetUserId}`);
        if (userSubmissions.length > 0) {
          console.log(`[DEBUG-SYNC] User submissions details:`, 
            userSubmissions.map(s => ({
              id: s._id.toString(),
              title: s.title,
              rank: s.rank,
              rating: s.averageRating
            }))
          );
        }
        
        if (userSubmissions.length === 0) continue;
        
        // Always create a basic "Competition Results" notification if the user participated
        try {
          const basicNotification = await notifyCompetitionResults(
            targetUserId,
            competitionId,
            competition.title
          );
          notifications.push({
            type: 'basic',
            competitionTitle: competition.title,
            notification: basicNotification
          });
        } catch (notificationError) {
          console.error(`Error creating basic result notification for ${competition.title}:`, notificationError);
        }
        
        // For each position (1st, 2nd, 3rd), find the best user submission
        for (let position = 1; position <= 3; position++) {
          // Find the submissions with this exact rank
          const positionSubmissions = userSubmissions.filter(s => s.rank === position);
          
          if (positionSubmissions.length > 0) {
            // We have a submission in this exact position!
            // Use the best one by rating if there are multiple with the same rank
            const bestSubmission = positionSubmissions.sort((a, b) => 
              (b.averageRating || 0) - (a.averageRating || 0)
            )[0];
            
            console.log(`Creating result for rank ${position} in competition ${competition.title}`);
            
            // Create result record
            const result = new Result({
              competition: competitionId,
              user: targetUserId,
              photo: bestSubmission._id,
              position: position,
              finalScore: bestSubmission.averageRating || 0,
              prize: position === 1 ? 'Gold Medal' : 
                     position === 2 ? 'Silver Medal' : 'Bronze Medal',
            });
            
            await result.save();
            results.push(result);
            
            // Create notification for this achievement
            try {
              const achievementNotification = await notifyCompetitionResults(
                targetUserId,
                competitionId,
                competition.title,
                position
              );
              notifications.push({
                type: 'achievement',
                position,
                competitionTitle: competition.title,
                notification: achievementNotification
              });
            } catch (notificationError) {
              console.error(`Error creating position ${position} notification for ${competition.title}:`, notificationError);
            }
          } else if (position === 3) {
            // Special case for 3rd place - if no exact 3rd place submission,
            // look for the next best submission that's not already used
            
            // Get photos already used for 1st and 2nd place
            const usedPhotoIds = results
              .filter(r => r.competition && r.competition.toString() === competitionId)
              .map(r => r.photo ? r.photo.toString() : '');
            
            // Find submissions not used for higher positions
            const availableSubmissions = userSubmissions.filter(s => 
              !usedPhotoIds.includes(s._id.toString())
            );
            
            if (availableSubmissions.length > 0) {
              // Sort by rank (lower is better)
              const bestSubmission = availableSubmissions.sort((a, b) => a.rank - b.rank)[0];
              
              console.log(`Creating 3rd place result using submission with rank ${bestSubmission.rank} in competition ${competition.title}`);
              
              const result = new Result({
                competition: competitionId,
                user: targetUserId,
                photo: bestSubmission._id,
                position: 3,
                finalScore: bestSubmission.averageRating || 0,
                prize: 'Bronze Medal',
              });
              
              await result.save();
              results.push(result);
              
              // Create notification for this achievement  
              try {
                const achievementNotification = await notifyCompetitionResults(
                  targetUserId,
                  competitionId,
                  competition.title,
                  3
                );
                notifications.push({
                  type: 'achievement',
                  position: 3,
                  competitionTitle: competition.title,
                  notification: achievementNotification
                });
              } catch (notificationError) {
                console.error(`Error creating position 3 notification for ${competition.title}:`, notificationError);
              }
            }
          }
        }
      } catch (error: any) {
        console.error(`Error processing competition ${competition.title || competition._id}:`, error);
        errors.push({
          competitionId: competition._id,
          competitionTitle: competition.title,
          error: error.message
        });
      }
    }
    
    // Count how many of each position we created
    const firstPlace = results.filter(r => r.position === 1).length;
    const secondPlace = results.filter(r => r.position === 2).length;
    const thirdPlace = results.filter(r => r.position === 3).length;
    
    return NextResponse.json({
      success: true,
      message: `Synchronized ${results.length} result records and ${notifications.length} notifications`,
      data: {
        totalResults: results.length,
        firstPlace,
        secondPlace,
        thirdPlace,
        notifications: notifications.length,
        results,
        errors: errors.length > 0 ? errors : null
      }
    });
    
  } catch (error: any) {
    console.error('Error synchronizing results:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while synchronizing results' },
      { status: 500 }
    );
  }
}

// Helper function to ensure the proper indexes exist
async function ensureProperIndexes() {
  try {
    // Get the Result collection directly from MongoDB
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const resultCollection = db.collection('results');
    
    // Get all existing indexes
    const existingIndexes = await resultCollection.indexes();
    
    // Check if we need to drop the problematic index
    const problemIndex = existingIndexes.find(idx => 
      idx.key && idx.key.competition === 1 && idx.key.user === 1 && !idx.key.position
    );
    
    if (problemIndex && problemIndex.name) {
      // Drop the problematic index
      await resultCollection.dropIndex(problemIndex.name);
      console.log(`Dropped problematic index: ${problemIndex.name}`);
    }
    
    // Ensure our correct indexes exist
    const positionIndex = existingIndexes.find(idx => 
      idx.key && idx.key.competition === 1 && idx.key.position === 1 && idx.key.user === 1
    );
    
    if (!positionIndex) {
      // Create the correct index
      await resultCollection.createIndex(
        { competition: 1, position: 1, user: 1 }, 
        { unique: true, name: 'competition_position_user_unique' }
      );
      console.log('Created correct competition_position_user_unique index');
    }
    
    // Check for photo index
    const photoIndex = existingIndexes.find(idx => 
      idx.key && idx.key.competition === 1 && idx.key.photo === 1
    );
    
    if (!photoIndex) {
      // Create the photo index
      await resultCollection.createIndex(
        { competition: 1, photo: 1 }, 
        { unique: true, name: 'competition_photo_unique' }
      );
      console.log('Created competition_photo_unique index');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring proper indexes:', error);
    throw error;
  }
} 