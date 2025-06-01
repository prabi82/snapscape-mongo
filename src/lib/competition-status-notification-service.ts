import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendCompetitionStatusChangeEmail } from '@/lib/emailService';
import { notifyCompetitionStatusChange } from '@/lib/notification-service';

interface StatusChangeNotificationResult {
  success: boolean;
  message: string;
  emailsSent: number;
  notificationsCreated: number;
  errors: string[];
  competitionTitle: string;
}

/**
 * Send status change notifications to all users
 * @param competitionId - Competition ID
 * @param competitionTitle - Competition title
 * @param newStatus - New status ('voting' or 'completed')
 * @param votingEndDate - Voting end date (for voting status)
 * @returns Result object with success status and counts
 */
export async function sendCompetitionStatusChangeNotifications(
  competitionId: string,
  competitionTitle: string,
  newStatus: 'voting' | 'completed',
  votingEndDate?: string
): Promise<StatusChangeNotificationResult> {
  const result: StatusChangeNotificationResult = {
    success: true,
    message: '',
    emailsSent: 0,
    notificationsCreated: 0,
    errors: [],
    competitionTitle
  };

  try {
    await dbConnect();

    // Get all verified and active users
    const users = await User.find({
      isVerified: true,
      isActive: true
    }).lean();

    console.log(`Found ${users.length} users to notify about status change for competition: ${competitionTitle}`);
    console.log(`Status change: ${newStatus === 'voting' ? 'Active → Voting' : 'Voting → Completed'}`);

    // Send notifications to each user
    for (const user of users) {
      try {
        // Send email notification
        const emailSent = await sendCompetitionStatusChangeEmail(
          user.email,
          user.name,
          competitionTitle,
          competitionId,
          newStatus,
          votingEndDate
        );

        if (emailSent) {
          result.emailsSent++;
          console.log(`Status change email sent to ${user.email} for competition ${competitionTitle}`);
        } else {
          result.errors.push(`Failed to send email to ${user.email}`);
        }

        // Create in-app notification
        const notificationResult = await notifyCompetitionStatusChange(
          (user._id as any).toString(),
          competitionId,
          competitionTitle,
          newStatus
        );

        if (notificationResult.success !== false) {
          result.notificationsCreated++;
        } else {
          result.errors.push(`Failed to create notification for ${user.email}: ${notificationResult.error || 'Unknown error'}`);
        }

        // Add small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (userError: any) {
        console.error(`Error sending status change notification to user ${user.email}:`, userError);
        result.errors.push(`Error for ${user.email}: ${userError.message}`);
      }
    }

    const statusText = newStatus === 'voting' ? 'voting phase started' : 'competition completed';
    result.message = `Sent ${result.emailsSent} emails and created ${result.notificationsCreated} notifications for ${statusText}: ${competitionTitle}`;

    if (result.errors.length > 0) {
      result.success = false;
      result.message += `. Errors: ${result.errors.length}`;
    }

  } catch (error: any) {
    console.error('Error in sendCompetitionStatusChangeNotifications:', error);
    result.success = false;
    result.message = `Failed to send status change notifications: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Log status change notification activity
 * @param competitionId - Competition ID
 * @param competitionTitle - Competition title
 * @param newStatus - New status
 * @param result - Notification result
 */
export async function logStatusChangeNotification(
  competitionId: string,
  competitionTitle: string,
  newStatus: 'voting' | 'completed',
  result: StatusChangeNotificationResult
) {
  try {
    // Import ReminderLog model here to avoid circular dependencies
    const { default: ReminderLog } = await import('@/models/ReminderLog');
    
    await dbConnect();

    const logEntry = new ReminderLog({
      triggerType: newStatus === 'voting' ? 'status_change_voting' : 'status_change_completed',
      triggerMethod: 'automatic',
      executionTime: new Date(),
      competitionsFound: 1,
      competitionsProcessed: [
        {
          competitionId,
          competitionTitle,
          success: result.success,
          message: result.message,
          emailsSent: result.emailsSent,
          notificationsCreated: result.notificationsCreated,
          errors: result.errors
        }
      ],
      totalEmailsSent: result.emailsSent,
      totalNotificationsCreated: result.notificationsCreated,
      errors: result.errors,
      success: result.success,
      message: result.message,
      userAgent: 'System/StatusChange',
      ipAddress: 'internal'
    });

    await logEntry.save();
    console.log(`Status change notification logged for competition: ${competitionTitle}`);

  } catch (error: any) {
    console.error('Error logging status change notification:', error);
  }
} 