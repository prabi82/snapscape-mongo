import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Photo from '@/models/Photo';
import Rating from '@/models/Rating';
import { Badge, UserBadge } from '@/models/Badge';
import Competition from '@/models/Competition';
import Result from '@/models/Result';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    const userId = session.user.id;
    
    // Get all stats in parallel
    const [
      totalSubmissions,
      photosRated,
      badgesEarned,
      competitionsEntered,
      competitionsWon
    ] = await Promise.all([
      // Count total photo submissions by the user
      Photo.countDocuments({ user: userId }),
      
      // Count ratings submitted by the user
      Rating.countDocuments({ user: userId }),
      
      // Count badges earned by the user
      UserBadge.countDocuments({ user: userId }),
      
      // Count unique competitions entered by the user
      Photo.distinct('competition', { user: userId }).then(competitions => competitions.length),
      
      // Count first place wins
      Result.countDocuments({ user: userId, position: 1 })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        totalSubmissions,
        photosRated,
        badgesEarned,
        competitionsEntered,
        competitionsWon
      }
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
} 