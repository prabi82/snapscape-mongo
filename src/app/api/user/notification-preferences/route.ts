import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

// Define a proper session type to fix TypeScript errors
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

interface NotificationPreferences {
  competitionReminders: boolean;
  votingOpen: boolean;
  competitionCompleted: boolean;
  newCompetitions: boolean;
  achievementNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
}

const defaultPreferences: NotificationPreferences = {
  competitionReminders: true,
  votingOpen: true,
  competitionCompleted: true,
  newCompetitions: true,
  achievementNotifications: true,
  weeklyDigest: false,
  marketingEmails: false,
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find user and get their notification preferences
    const user = await User.findById(session.user.id).select('notificationPreferences');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return preferences or defaults if not set
    const preferences = user.notificationPreferences || defaultPreferences;

    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    // Validate each preference key
    const validKeys = Object.keys(defaultPreferences);
    const providedKeys = Object.keys(preferences);
    
    for (const key of providedKeys) {
      if (!validKeys.includes(key)) {
        return NextResponse.json(
          { success: false, message: `Invalid preference key: ${key}` },
          { status: 400 }
        );
      }
      if (typeof preferences[key] !== 'boolean') {
        return NextResponse.json(
          { success: false, message: `Preference ${key} must be a boolean` },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    // Update user's notification preferences
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { 
        $set: { 
          notificationPreferences: {
            ...defaultPreferences,
            ...preferences
          }
        }
      },
      { new: true, upsert: false }
    ).select('notificationPreferences');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences
    });

  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
} 