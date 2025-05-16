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
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow admins to run this endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can run this operation' },
        { status: 403 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Step 1: Ensure proper indexes exist on the Result collection
    await ensureProperIndexes();
    
    // Step 2: Get all users
    const users = await User.find({}).select('_id name email').lean();
    
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No users found'
      });
    }
    
    // Step 3: Get all completed competitions
    const competitions = await Competition.find({
      endDate: { $lt: new Date() } // Only completed competitions
    }).lean();
    
    if (competitions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No completed competitions found'
      });
    }
    
    // Delete all existing results (we'll rebuild everything)
    await Result.deleteMany({});
    console.log(`Deleted all existing results`);
    
    const results: any[] = [];
    const errors: any[] = [];
    const userStats: Record<string, any> = {};
    
    // Process each user
    for (const user of users) {
      try {
        const userId = user._id.toString();
        userStats[userId] = {
          name: user.name,
          email: user.email,
          totalResults: 0,
          firstPlace: 0,
          secondPlace: 0,
          thirdPlace: 0
        };
        
        // Process each competition for this user
        for (const competition of competitions) {
          try {
            if (!competition._id) continue;
            
            const competitionId = competition._id.toString();
            
            // Get all approved submissions for this competition
            const submissions = await PhotoSubmission.find({
              competition: competitionId,
              status: 'approved'
            })
            .populate('user')
            .sort({ averageRating: -1, ratingCount: -1 }) // Sort by rating
            .lean();
            
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
              
              // Add the submission with its rank
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
              s.user && s.user._id && s.user._id.toString() === userId
            );
            
            console.log(`User ${user.name}: Competition ${competition.title}: Found ${userSubmissions.length} submissions`);
            
            if (userSubmissions.length === 0) continue;
            
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
                
                console.log(`Creating result for user ${user.name}, rank ${position} in competition ${competition.title}`);
                
                // Create result record
                const result = new Result({
                  competition: competitionId,
                  user: userId,
                  photo: bestSubmission._id,
                  position: position,
                  finalScore: bestSubmission.averageRating || 0,
                  prize: position === 1 ? 'Gold Medal' : 
                         position === 2 ? 'Silver Medal' : 'Bronze Medal',
                });
                
                await result.save();
                results.push(result);
                
                // Update user stats
                userStats[userId].totalResults += 1;
                if (position === 1) userStats[userId].firstPlace += 1;
                if (position === 2) userStats[userId].secondPlace += 1;
                if (position === 3) userStats[userId].thirdPlace += 1;
              } else if (position === 3) {
                // Special case for 3rd place - if no exact 3rd place submission,
                // look for the next best submission that's not already used
                
                // Get photos already used for 1st and 2nd place
                const userResults = results.filter(r => 
                  r.user && r.user.toString() === userId &&
                  r.competition && r.competition.toString() === competitionId
                );
                const usedPhotoIds = userResults.map(r => r.photo ? r.photo.toString() : '');
                
                // Find submissions not used for higher positions
                const availableSubmissions = userSubmissions.filter(s => 
                  !usedPhotoIds.includes(s._id.toString())
                );
                
                if (availableSubmissions.length > 0) {
                  // Sort by rank (lower is better)
                  const bestSubmission = availableSubmissions.sort((a, b) => a.rank - b.rank)[0];
                  
                  console.log(`Creating 3rd place result for user ${user.name} using submission with rank ${bestSubmission.rank} in competition ${competition.title}`);
                  
                  const result = new Result({
                    competition: competitionId,
                    user: userId,
                    photo: bestSubmission._id,
                    position: 3,
                    finalScore: bestSubmission.averageRating || 0,
                    prize: 'Bronze Medal',
                  });
                  
                  await result.save();
                  results.push(result);
                  
                  // Update user stats
                  userStats[userId].totalResults += 1;
                  userStats[userId].thirdPlace += 1;
                }
              }
            }
          } catch (error: any) {
            console.error(`Error processing competition ${competition.title || competition._id} for user ${user.name}:`, error);
            errors.push({
              userId: userId,
              userName: user.name,
              competitionId: competition._id,
              competitionTitle: competition.title,
              error: error.message
            });
          }
        }
      } catch (error: any) {
        console.error(`Error processing user ${user.name}:`, error);
        errors.push({
          userId: user._id,
          userName: user.name,
          error: error.message
        });
      }
    }
    
    // Count totals
    const totalResults = results.length;
    const firstPlace = results.filter(r => r.position === 1).length;
    const secondPlace = results.filter(r => r.position === 2).length;
    const thirdPlace = results.filter(r => r.position === 3).length;
    
    return NextResponse.json({
      success: true,
      message: `Synchronized ${totalResults} result records for ${users.length} users`,
      data: {
        totalUsers: users.length,
        totalResults,
        firstPlace,
        secondPlace,
        thirdPlace,
        userStats,
        errors: errors.length > 0 ? errors : null
      }
    });
    
  } catch (error: any) {
    console.error('Error synchronizing all achievements:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while synchronizing achievements' },
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