import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Result from '@/models/Result';
import { Session } from 'next-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow admins to access this endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can access this endpoint' },
        { status: 403 }
      );
    }
    
    // Await params before accessing its properties (Next.js 15 requirement)
    const { id: competitionId } = await params;
    
    if (!competitionId) {
      return NextResponse.json(
        { success: false, message: 'Missing competition ID' },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Fetch all achievement results for this competition
    const achievementResults = await Result.find({
      competition: competitionId,
      position: { $lte: 3 } // Only get top 3 positions
    })
    .populate('user', '_id name email')
    .populate('photo', '_id title imageUrl thumbnailUrl averageRating ratingCount')
    .sort({ position: 1 }) // Sort by position
    .lean();
    
    console.log(`Found ${achievementResults.length} achievements for competition ${competitionId}`);
    
    return NextResponse.json({
      success: true,
      data: achievementResults
    });
    
  } catch (error: any) {
    console.error('Error fetching competition achievements:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch competition achievements' },
      { status: 500 }
    );
  }
} 