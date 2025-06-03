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

export async function GET(request: NextRequest) {
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

    // Get all users
    const allUsers = await User.find({}).lean();
    
    // Analyze notification preferences
    const analysis = {
      totalUsers: allUsers.length,
      activeUsers: 0,
      verifiedUsers: 0,
      activeAndVerified: 0,
      newCompetitionOptIns: {
        explicitlyTrue: 0,
        explicitlyFalse: 0,
        undefined: 0,
        nullOrMissing: 0
      },
      qualifiedForNotifications: 0,
      sampleUsers: [] as any[]
    };

    for (const user of allUsers) {
      if (user.isActive) analysis.activeUsers++;
      if (user.isVerified) analysis.verifiedUsers++;
      if (user.isActive && user.isVerified) analysis.activeAndVerified++;

      // Check newCompetitions preference
      const newCompPref = user.notificationPreferences?.newCompetitions;
      
      if (newCompPref === true) {
        analysis.newCompetitionOptIns.explicitlyTrue++;
      } else if (newCompPref === false) {
        analysis.newCompetitionOptIns.explicitlyFalse++;
      } else if (newCompPref === undefined) {
        analysis.newCompetitionOptIns.undefined++;
      } else {
        analysis.newCompetitionOptIns.nullOrMissing++;
      }

      // Check if user qualifies for notifications (matches the query logic)
      if (user.isVerified && user.isActive && user.notificationPreferences?.newCompetitions === true) {
        analysis.qualifiedForNotifications++;
      }

      // Add sample users for inspection
      if (analysis.sampleUsers.length < 10) {
        analysis.sampleUsers.push({
          id: user._id,
          email: user.email,
          isActive: user.isActive,
          isVerified: user.isVerified,
          notificationPreferences: user.notificationPreferences,
          newCompetitionsValue: user.notificationPreferences?.newCompetitions,
          qualifiesForNotifications: user.isVerified && user.isActive && user.notificationPreferences?.newCompetitions === true
        });
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      explanation: {
        issue: "Users created before notification preferences were added might not have the field populated",
        defaultValue: "newCompetitions should default to true according to schema",
        currentQualified: analysis.qualifiedForNotifications,
        shouldBeQualified: analysis.activeAndVerified
      }
    });

  } catch (error: any) {
    console.error('Error analyzing user notification status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 