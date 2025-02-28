import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import dbConnect from '@/lib/dbConnect';

// GET competition leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }
    
    // Ensure the competition is closed or archived to view leaderboard
    if (competition.status !== 'closed' && competition.status !== 'archived') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Leaderboard is only available after the competition has ended' 
        },
        { status: 400 }
      );
    }
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Get top-rated submissions
    const topSubmissions = await PhotoSubmission.find({
      competition: id,
      status: 'approved',
      ratingCount: { $gt: 0 } // Only include submissions with at least 1 rating
    })
    .sort({ averageRating: -1 })
    .limit(limit)
    .populate('user', 'name');
    
    // Get top contributors (users with most submissions)
    const topContributors = await PhotoSubmission.aggregate([
      { $match: { competition: id, status: 'approved' } },
      { $group: {
          _id: '$user',
          submissionCount: { $sum: 1 },
          totalRating: { $sum: '$averageRating' }
        }
      },
      { $sort: { submissionCount: -1, totalRating: -1 } },
      { $limit: limit }
    ]);
    
    // Populate user details for top contributors
    const userIds = topContributors.map(contributor => contributor._id);
    const users = await Promise.all(
      userIds.map(async userId => {
        const user = await (await import('@/models/User')).default.findById(userId).select('name');
        return user;
      })
    );
    
    // Map user names to top contributors
    const contributorsWithNames = topContributors.map((contributor, index) => ({
      userId: contributor._id,
      name: users[index]?.name || 'Unknown',
      submissionCount: contributor.submissionCount,
      averageRating: contributor.totalRating / contributor.submissionCount
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        topSubmissions,
        topContributors: contributorsWithNames,
        competitionTitle: competition.title,
        competitionStatus: competition.status
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 