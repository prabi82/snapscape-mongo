import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Result from '@/models/Result';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import User from '@/models/User';
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
    
    // Get results for the current user
    const userResults = await Result.find({ user: session.user.id })
      .populate({
        path: 'competition',
        select: '_id title'
      })
      .populate({
        path: 'photo',
        select: '_id title imageUrl'
      })
      .lean();
    
    // Get user's photos
    const userPhotos = await PhotoSubmission.find({ user: session.user.id })
      .populate({
        path: 'competition',
        select: '_id title'
      })
      .limit(10)
      .lean();
    
    // Only include additional data for admins
    let adminData = {};
    if (session.user.role === 'admin') {
      // Get all results
      const allResults = await Result.find()
        .populate({
          path: 'competition',
          select: '_id title'
        })
        .populate({
          path: 'user',
          select: '_id name email'
        })
        .populate({
          path: 'photo',
          select: '_id title imageUrl'
        })
        .lean();
      
      // Get all users
      const allUsers = await User.find().select('_id name email').lean();
      
      // Get all competitions
      const allCompetitions = await Competition.find().select('_id title').lean();
      
      adminData = {
        allResultsCount: allResults.length,
        allResults,
        usersCount: allUsers.length,
        competitionsCount: allCompetitions.length,
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        userResultsCount: userResults.length,
        userResults,
        photosCount: userPhotos.length,
        samplePhotos: userPhotos.slice(0, 3),
        ...adminData
      }
    });
    
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 