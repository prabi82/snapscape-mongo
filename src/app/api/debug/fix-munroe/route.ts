import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import Result from '@/models/Result';
import { Session } from 'next-auth';

// Define proper TypeScript interfaces
interface UserDocument {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
}

interface SubmissionWithRank {
  _id: string;
  rank: number;
  averageRating?: number;
  user?: UserDocument;
  [key: string]: any;
}

interface ResultDocument {
  _id: string;
  competition: string;
  user: string;
  photo: string;
  position: number;
  finalScore: number;
  prize: string;
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
    
    // Connect to the database
    await dbConnect();
    
    // Get the Munroe Island competition
    const competition = await Competition.findOne({
      title: 'Munroe Island'
    }).lean();
    
    if (!competition) {
      return NextResponse.json({
        success: false,
        message: 'Munroe Island competition not found'
      });
    }

    // Safely get the competition ID
    const competitionId = competition._id ? competition._id.toString() : '';
    
    // Get all approved submissions for this competition
    const submissions = await PhotoSubmission.find({
      competition: competitionId,
      status: 'approved'
    })
    .populate('user')
    .sort({ averageRating: -1, ratingCount: -1 })
    .lean();
    
    // Map the rankings to the submissions
    const rankedSubmissions = submissions.map((submission, index) => ({
      ...submission,
      rank: index + 1
    })) as SubmissionWithRank[];
    
    // Get user submissions
    const userSubmissions = rankedSubmissions.filter(s => 
      s.user && s.user._id && s.user._id.toString() === session.user.id
    );
    
    // Get existing results
    const existingResults = await Result.find({
      competition: competitionId,
      user: session.user.id
    }).lean();
    
    return NextResponse.json({
      success: true,
      data: {
        competition,
        submissionsCount: submissions.length,
        userSubmissionsCount: userSubmissions.length,
        userSubmissions,
        existingResults
      }
    });
    
  } catch (error: any) {
    console.error('Error checking Munroe Island:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
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
    
    // Connect to the database
    await dbConnect();
    
    // Get the Munroe Island competition
    const competition = await Competition.findOne({
      title: 'Munroe Island'
    }).lean();
    
    if (!competition) {
      return NextResponse.json({
        success: false,
        message: 'Munroe Island competition not found'
      });
    }
    
    // Safely get the competition ID
    const competitionId = competition._id ? competition._id.toString() : '';
    
    // Get all approved submissions for this competition
    const submissions = await PhotoSubmission.find({
      competition: competitionId,
      status: 'approved'
    })
    .populate('user')
    .sort({ averageRating: -1, ratingCount: -1 })
    .lean();
    
    // Map the rankings to the submissions
    const rankedSubmissions = submissions.map((submission, index) => ({
      ...submission,
      rank: index + 1
    })) as SubmissionWithRank[];
    
    // Get user's submissions with rankings
    const userSubmissions = rankedSubmissions.filter(s => 
      s.user && s.user._id && s.user._id.toString() === session.user.id
    );
    
    console.log(`Found ${userSubmissions.length} submissions for user in Munroe Island`);
    
    // Delete existing results for this competition for this user
    await Result.deleteMany({
      competition: competitionId,
      user: session.user.id
    });
    
    const results: ResultDocument[] = [];
    
    // Create results for each position (1st, 2nd, 3rd)
    for (let position = 1; position <= 3; position++) {
      // Find submissions with this exact rank
      const positionSubmissions = userSubmissions.filter(s => s.rank === position);
      
      if (positionSubmissions.length > 0) {
        // Use the best one by rating
        const bestSubmission = positionSubmissions.sort((a, b) => 
          ((b.averageRating || 0) - (a.averageRating || 0))
        )[0];
        
        console.log(`Creating result for rank ${position} in Munroe Island`);
        
        const result = new Result({
          competition: competitionId,
          user: session.user.id,
          photo: bestSubmission._id.toString(),
          position: position,
          finalScore: bestSubmission.averageRating || 0,
          prize: position === 1 ? 'Gold Medal' : 
                 position === 2 ? 'Silver Medal' : 'Bronze Medal',
        });
        
        await result.save();
        results.push(result.toObject());
      } else if (position === 3) {
        // Special case for 3rd place: If we didn't find an exact rank 3,
        // find the next best submission after 1st and 2nd place
        
        // Get photos already used for 1st and 2nd place
        const usedPhotoIds = results.map(r => r.photo.toString());
        
        // Find remaining submissions not used for higher positions
        const availableSubmissions = userSubmissions.filter(s => 
          !usedPhotoIds.includes(s._id.toString())
        );
        
        if (availableSubmissions.length > 0) {
          // Sort by rank (lower is better)
          const bestSubmission = availableSubmissions.sort((a, b) => a.rank - b.rank)[0];
          
          console.log(`Creating 3rd place result using submission with rank ${bestSubmission.rank} in Munroe Island`);
          
          const result = new Result({
            competition: competitionId,
            user: session.user.id,
            photo: bestSubmission._id.toString(),
            position: 3,
            finalScore: bestSubmission.averageRating || 0,
            prize: 'Bronze Medal',
          });
          
          await result.save();
          results.push(result.toObject());
        }
      }
    }
    
    // Get all achievements after fix
    const allResults = await Result.find({
      user: session.user.id
    })
    .populate('competition')
    .sort({ position: 1 })
    .lean();
    
    // Count achievements by position
    const firstPlace = allResults.filter(r => r.position === 1).length;
    const secondPlace = allResults.filter(r => r.position === 2).length;
    const thirdPlace = allResults.filter(r => r.position === 3).length;
    
    // Also clear any cached achievements data in memory
    try {
      // Force refresh of REDIS cache if available
      const redisInstance = (global as any).__redis;
      if (redisInstance) {
        const achievementsCacheKey = `achievements:${session.user.id}`;
        await redisInstance.del(achievementsCacheKey);
      }
    } catch (e) {
      console.log('Redis cache refresh failed or not available:', e);
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed Munroe Island achievements. Created ${results.length} result records.`,
      data: {
        munroeIslandResults: results,
        stats: {
          firstPlace,
          secondPlace,
          thirdPlace,
          total: firstPlace + secondPlace + thirdPlace
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error fixing Munroe Island:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fixing Munroe Island achievements' },
      { status: 500 }
    );
  }
} 