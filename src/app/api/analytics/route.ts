import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Photo from '@/models/Photo';
import Competition from '@/models/Competition';
import Rating from '@/models/Rating';
import PhotoSubmission from '@/models/PhotoSubmission';
import { Session } from 'next-auth';

// Define a type for our extended session
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

interface MonthlyData {
  month: string;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    // @ts-ignore - Ignore type error here
    const session = await getServerSession(authOptions) as ExtendedSession | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30days';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    const activeUsersThisMonth = await User.countDocuments({
      $or: [
        { createdAt: { $gte: startDate } },
        { updatedAt: { $gte: startDate } }
      ]
    });

    // Calculate growth rate
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (now.getDate() - startDate.getDate()));
    const previousPeriodUsers = await User.countDocuments({
      createdAt: { 
        $gte: previousPeriodStart,
        $lt: startDate
      }
    });
    const growthRate = previousPeriodUsers > 0 ? 
      ((newUsersThisMonth - previousPeriodUsers) / previousPeriodUsers * 100) : 
      (newUsersThisMonth > 0 ? 100 : 0);

    // Get photo statistics
    const totalPhotos = await PhotoSubmission.countDocuments();
    const newPhotosThisMonth = await PhotoSubmission.countDocuments({
      createdAt: { $gte: startDate }
    });
    const avgPhotosPerUser = totalUsers > 0 ? Math.round((totalPhotos / totalUsers) * 10) / 10 : 0;

    // Get top photo categories (using competition themes as categories)
    const topCategories = await Competition.aggregate([
      {
        $lookup: {
          from: 'photosubmissions',
          localField: '_id',
          foreignField: 'competition',
          as: 'photos'
        }
      },
      {
        $project: {
          theme: 1,
          photoCount: { $size: '$photos' }
        }
      },
      {
        $group: {
          _id: '$theme',
          count: { $sum: '$photoCount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get competition statistics
    const totalCompetitions = await Competition.countDocuments();
    const activeCompetitions = await Competition.countDocuments({ status: 'active' });
    const upcomingCompetitions = await Competition.countDocuments({ status: 'upcoming' });
    const completedCompetitions = await Competition.countDocuments({ status: 'completed' });
    
    // Calculate average participation
    const participationStats = await Competition.aggregate([
      {
        $lookup: {
          from: 'photosubmissions',
          localField: '_id',
          foreignField: 'competition',
          as: 'submissions'
        }
      },
      {
        $project: {
          submissionCount: { $size: '$submissions' }
        }
      },
      {
        $group: {
          _id: null,
          avgParticipation: { $avg: '$submissionCount' }
        }
      }
    ]);
    const avgParticipation = participationStats.length > 0 ? 
      Math.round(participationStats[0].avgParticipation * 10) / 10 : 0;

    // Get engagement statistics
    const totalRatings = await Rating.countDocuments();
    const avgRatingStats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' }
        }
      }
    ]);
    const avgRatingScore = avgRatingStats.length > 0 ? 
      Math.round(avgRatingStats[0].avgScore * 10) / 10 : 0;

    // Get monthly active users for the last 12 months
    const monthlyActiveUsers: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const activeUsers = await User.countDocuments({
        $or: [
          { createdAt: { $gte: monthStart, $lt: monthEnd } },
          { updatedAt: { $gte: monthStart, $lt: monthEnd } }
        ]
      });
      
      console.log(`Month ${monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}: ${activeUsers} active users`);
      
      monthlyActiveUsers.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count: activeUsers
      });
    }

    // Get photo uploads over time for the last 12 months
    const photoUploadsOverTime: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const photoUploads = await PhotoSubmission.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      
      console.log(`Month ${monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}: ${photoUploads} photo uploads`);
      
      photoUploadsOverTime.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count: photoUploads
      });
    }

    const analyticsData = {
      userStats: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        activeThisMonth: activeUsersThisMonth,
        growthRate: Math.round(growthRate * 10) / 10,
      },
      photoStats: {
        total: totalPhotos,
        newThisMonth: newPhotosThisMonth,
        avgPerUser: avgPhotosPerUser,
        topCategories: topCategories.length > 0 ? topCategories : [
          { name: 'Nature', count: 0 },
          { name: 'Portrait', count: 0 },
          { name: 'Street', count: 0 },
          { name: 'Architecture', count: 0 },
          { name: 'Abstract', count: 0 },
        ],
      },
      competitionStats: {
        total: totalCompetitions,
        active: activeCompetitions,
        upcoming: upcomingCompetitions,
        completed: completedCompetitions,
        avgParticipation: avgParticipation,
      },
      engagementStats: {
        totalRatings: totalRatings,
        avgRatingScore: avgRatingScore,
      },
      monthlyActiveUsers,
      photoUploadsOverTime,
    };

    return NextResponse.json(analyticsData);
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error.message },
      { status: 500 }
    );
  }
} 