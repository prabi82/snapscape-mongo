import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions as any) as ExtendedSession;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user role
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Update users who don't have notification preferences set
    const updateResult = await User.updateMany(
      {
        $or: [
          { notificationPreferences: { $exists: false } },
          { 'notificationPreferences.newCompetitions': { $exists: false } }
        ]
      },
      {
        $set: {
          'notificationPreferences.competitionReminders': true,
          'notificationPreferences.votingOpen': true,
          'notificationPreferences.competitionCompleted': true,
          'notificationPreferences.newCompetitions': true,
          'notificationPreferences.achievementNotifications': true,
          'notificationPreferences.weeklyDigest': false,
          'notificationPreferences.marketingEmails': false,
        }
      }
    );

    // Get count of users who now qualify for notifications
    const qualifiedUsers = await User.countDocuments({
      isVerified: true,
      isActive: true,
      'notificationPreferences.newCompetitions': true
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      updateResult: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        acknowledged: updateResult.acknowledged
      },
      qualifiedUsersAfterUpdate: qualifiedUsers
    });

  } catch (error: any) {
    console.error('Error fixing notification preferences:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 