import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import User from '@/models/User';
import { queueBulkNotifications, sendBulkNotificationsSync } from '@/lib/bulk-notification-service';
import { sendNewCompetitionEmail } from '@/lib/emailService';

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

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions as any) as ExtendedSession;
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { competitionId, testEmail } = body;

    // Validate required fields
    if (!competitionId) {
      return NextResponse.json(
        { success: false, message: 'Competition ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch the competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }

    let result;

    if (testEmail) {
      // Send to specific user only
      const emailSent = await sendNewCompetitionEmail(
        testEmail,
        'User', // We'll use a generic name since we don't have user details
        competition.title,
        competitionId,
        competition.description,
        competition.theme,
        competition.startDate.toISOString(),
        competition.endDate.toISOString()
      );

      result = {
        success: emailSent,
        message: emailSent 
          ? `New competition notification sent to ${testEmail}` 
          : `Failed to send new competition notification to ${testEmail}`,
        emailsSent: emailSent ? 1 : 0,
        notificationsCreated: 0, // We don't create in-app notifications for specific email tests
        errors: emailSent ? [] : [`Failed to send email to ${testEmail}`],
        competitionTitle: competition.title,
        totalUsers: 1,
        processingBatches: 0,
        estimatedTimeMinutes: 0
      };
    } else {
      // Get user count to determine processing method
      const userCount = await User.countDocuments({
        isVerified: true,
        isActive: true,
        'notificationPreferences.newCompetitions': true
      });

      if (userCount <= 100) {
        // Use synchronous processing for small user counts
        console.log(`Using synchronous processing for ${userCount} users`);
        const syncResult = await sendBulkNotificationsSync(
          competitionId,
          competition.title,
          competition.description,
          competition.theme,
          competition.startDate.toISOString(),
          competition.endDate.toISOString(),
          'new_competition'
        );

        result = {
          ...syncResult,
          competitionTitle: competition.title,
          totalUsers: userCount,
          processingBatches: 1,
          estimatedTimeMinutes: 0
        };
      } else {
        // Use asynchronous batch processing for large user counts
        console.log(`Using asynchronous batch processing for ${userCount} users`);
        const batchResult = await queueBulkNotifications(
          competitionId,
          competition.title,
          competition.description,
          competition.theme,
          competition.startDate.toISOString(),
          competition.endDate.toISOString(),
          'new_competition'
        );

        result = {
          success: batchResult.success,
          message: batchResult.message,
          emailsSent: 0, // Will be processed asynchronously
          notificationsCreated: 0, // Will be processed asynchronously
          errors: [],
          competitionTitle: competition.title,
          totalUsers: batchResult.totalUsers,
          processingBatches: batchResult.processingBatches,
          estimatedTimeMinutes: batchResult.estimatedTimeMinutes
        };
      }
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        totalCompetitions: 1,
        totalEmailsSent: result.emailsSent,
        totalNotificationsCreated: result.notificationsCreated,
        totalUsers: result.totalUsers,
        processingBatches: result.processingBatches,
        estimatedTimeMinutes: result.estimatedTimeMinutes,
        errors: result.errors,
        competitionResults: [{
          competitionTitle: result.competitionTitle,
          emailsSent: result.emailsSent,
          notificationsCreated: result.notificationsCreated,
          totalUsers: result.totalUsers,
          processingBatches: result.processingBatches,
          estimatedTimeMinutes: result.estimatedTimeMinutes,
          errors: result.errors
        }]
      }
    });

  } catch (error: any) {
    console.error('Error sending new competition notifications:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
} 