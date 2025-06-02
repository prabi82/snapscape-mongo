import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendNewCompetitionEmail } from '@/lib/emailService';
import { createSystemNotification } from '@/lib/notification-service';

interface NewCompetitionNotificationResult {
  success: boolean;
  message: string;
  emailsSent: number;
  notificationsCreated: number;
  errors: string[];
  competitionTitle: string;
}

/**
 * Send new competition notifications to all users who have opted in
 * @param competitionId - Competition ID
 * @param competitionTitle - Competition title
 * @param competitionDescription - Competition description
 * @param theme - Competition theme
 * @param startDate - Competition start date
 * @param endDate - Competition end date
 * @returns Result object with success status and counts
 */
export async function sendNewCompetitionNotifications(
  competitionId: string,
  competitionTitle: string,
  competitionDescription: string,
  theme: string,
  startDate: string,
  endDate: string
): Promise<NewCompetitionNotificationResult> {
  const result: NewCompetitionNotificationResult = {
    success: true,
    message: '',
    emailsSent: 0,
    notificationsCreated: 0,
    errors: [],
    competitionTitle
  };

  try {
    await dbConnect();

    // Get all verified and active users who have opted in for new competition notifications
    const users = await User.find({
      isVerified: true,
      isActive: true,
      'notificationPreferences.newCompetitions': true
    }).lean();

    console.log(`Found ${users.length} users to notify about new competition: ${competitionTitle}`);

    // Send notifications to each user
    for (const user of users) {
      try {
        // Send email notification
        const emailSent = await sendNewCompetitionEmail(
          user.email,
          user.name,
          competitionTitle,
          competitionId,
          competitionDescription,
          theme,
          startDate,
          endDate
        );

        if (emailSent) {
          result.emailsSent++;
          console.log(`New competition email sent to ${user.email} for competition ${competitionTitle}`);
        } else {
          result.errors.push(`Failed to send email to ${user.email}`);
        }

        // Create in-app notification
        const notificationResult = await createSystemNotification(
          (user._id as any).toString(),
          `🎉 New Competition: "${competitionTitle}"`,
          `A new photography competition "${competitionTitle}" with theme "${theme}" is now live! Submit your best photos and compete with fellow photographers.`,
          `/dashboard/competitions/${competitionId}`
        );

        if (notificationResult.success !== false) {
          result.notificationsCreated++;
        } else {
          result.errors.push(`Failed to create notification for ${user.email}: ${notificationResult.error || 'Unknown error'}`);
        }

        // Add small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (userError: any) {
        console.error(`Error sending new competition notification to user ${user.email}:`, userError);
        result.errors.push(`Error for ${user.email}: ${userError.message}`);
      }
    }

    result.message = `Sent ${result.emailsSent} emails and created ${result.notificationsCreated} notifications for new competition: ${competitionTitle}`;

    if (result.errors.length > 0) {
      result.success = false;
      result.message += `. Errors: ${result.errors.length}`;
    }

  } catch (error: any) {
    console.error('Error sending new competition notifications:', error);
    result.success = false;
    result.message = `Failed to send new competition notifications: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
} 