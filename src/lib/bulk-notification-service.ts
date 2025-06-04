import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendNewCompetitionEmail } from '@/lib/emailService';
import { createSystemNotification } from '@/lib/notification-service';

interface BulkNotificationResult {
  success: boolean;
  message: string;
  totalUsers: number;
  processingBatches: number;
  estimatedTimeMinutes: number;
}

interface UserDoc {
  _id: string;
  email: string;
  name: string;
}

const BATCH_SIZE = 50; // Process 50 users at a time
const BATCH_DELAY = 1000; // 1 second delay between batches

// Check if we're in build time to avoid hanging the build process
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === undefined;

/**
 * Queue notifications for processing in the background
 * This approach avoids function timeouts by returning immediately
 * and processing notifications asynchronously
 */
export async function queueBulkNotifications(
  competitionId: string,
  competitionTitle: string,
  competitionDescription: string,
  theme: string,
  startDate: string,
  endDate: string,
  notificationType: 'new_competition' | 'voting_open' | 'competition_completed' = 'new_competition'
): Promise<BulkNotificationResult> {
  try {
    // Skip background processing during build time
    if (isBuildTime) {
      return {
        success: true,
        message: 'Notification queuing skipped during build time',
        totalUsers: 0,
        processingBatches: 0,
        estimatedTimeMinutes: 0
      };
    }

    await dbConnect();

    // Get count of users who should receive notifications
    const userQuery = {
      isVerified: true,
      isActive: true,
      ...(notificationType === 'new_competition' && { 'notificationPreferences.newCompetitions': true })
    };

    const totalUsers = await User.countDocuments(userQuery);
    
    if (totalUsers === 0) {
      return {
        success: true,
        message: 'No users found to notify',
        totalUsers: 0,
        processingBatches: 0,
        estimatedTimeMinutes: 0
      };
    }

    const totalBatches = Math.ceil(totalUsers / BATCH_SIZE);
    const estimatedTimeMinutes = Math.ceil((totalBatches * BATCH_DELAY) / 60000);

    // Start processing batches in the background (don't await) - only in runtime
    if (typeof window === 'undefined' && !isBuildTime) {
      processBulkNotificationsBatches(
        competitionId,
        competitionTitle,
        competitionDescription,
        theme,
        startDate,
        endDate,
        notificationType,
        totalBatches
      ).catch(error => {
        console.error('Error in background notification processing:', error);
      });
    }

    return {
      success: true,
      message: `Queued ${totalUsers} notifications for processing in ${totalBatches} batches`,
      totalUsers,
      processingBatches: totalBatches,
      estimatedTimeMinutes
    };

  } catch (error: any) {
    console.error('Error queuing bulk notifications:', error);
    return {
      success: false,
      message: `Failed to queue notifications: ${error.message}`,
      totalUsers: 0,
      processingBatches: 0,
      estimatedTimeMinutes: 0
    };
  }
}

/**
 * Process notifications in batches to avoid overwhelming the system
 */
async function processBulkNotificationsBatches(
  competitionId: string,
  competitionTitle: string,
  competitionDescription: string,
  theme: string,
  startDate: string,
  endDate: string,
  notificationType: 'new_competition' | 'voting_open' | 'competition_completed',
  totalBatches: number
): Promise<void> {
  // Skip background processing during build time
  if (isBuildTime) {
    console.log('Skipping background notification processing during build time');
    return;
  }

  console.log(`Starting bulk notification processing for ${competitionTitle} - ${totalBatches} batches`);
  
  let emailsSent = 0;
  let notificationsCreated = 0;
  let errors: string[] = [];

  try {
    await dbConnect();

    // Process each batch
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const skip = batchIndex * BATCH_SIZE;
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (users ${skip + 1}-${skip + BATCH_SIZE})`);

      try {
        // Get users for this batch
        const userQuery = {
          isVerified: true,
          isActive: true,
          ...(notificationType === 'new_competition' && { 'notificationPreferences.newCompetitions': true })
        };

        const users = await User.find(userQuery)
          .skip(skip)
          .limit(BATCH_SIZE)
          .lean() as unknown as UserDoc[];

        // Process all users in this batch in parallel
        const batchPromises = users.map(async (user) => {
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

            let emailResult = false;
            let notificationResult = { success: false };

            if (emailSent) {
              emailResult = true;
              console.log(`Email sent to ${user.email} for competition ${competitionTitle}`);
            } else {
              console.warn(`Failed to send email to ${user.email}`);
            }

            // Create in-app notification
            const notificationTitle = getNotificationTitle(notificationType, competitionTitle);
            const notificationMessage = getNotificationMessage(notificationType, competitionTitle, theme);

            notificationResult = await createSystemNotification(
              user._id.toString(),
              notificationTitle,
              notificationMessage,
              `/dashboard/competitions/${competitionId}`
            );

            if (notificationResult.success !== false) {
              console.log(`In-app notification created for ${user.email}`);
            } else {
              console.warn(`Failed to create notification for ${user.email}`);
            }

            return {
              userId: user._id.toString(),
              email: user.email,
              emailSent: emailResult,
              notificationCreated: notificationResult.success !== false,
              error: null
            };

          } catch (userError: any) {
            console.error(`Error processing user ${user.email}:`, userError);
            return {
              userId: user._id.toString(),
              email: user.email,
              emailSent: false,
              notificationCreated: false,
              error: userError.message
            };
          }
        });

        // Wait for all users in this batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Aggregate results
        batchResults.forEach(result => {
          if (result.emailSent) emailsSent++;
          if (result.notificationCreated) notificationsCreated++;
          if (result.error) errors.push(`${result.email}: ${result.error}`);
        });

        console.log(`Batch ${batchIndex + 1} completed: ${batchResults.filter(r => r.emailSent).length} emails, ${batchResults.filter(r => r.notificationCreated).length} notifications`);

        // Add delay between batches to avoid overwhelming external services
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }

      } catch (batchError: any) {
        console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
        errors.push(`Batch ${batchIndex + 1}: ${batchError.message}`);
      }
    }

    console.log(`Bulk notification processing completed for ${competitionTitle}`);
    console.log(`Total results: ${emailsSent} emails sent, ${notificationsCreated} notifications created, ${errors.length} errors`);

    if (errors.length > 0) {
      console.warn('Notification errors:', errors.slice(0, 10)); // Log first 10 errors
    }

  } catch (error: any) {
    console.error('Fatal error in bulk notification processing:', error);
  }
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(type: string, competitionTitle: string): string {
  switch (type) {
    case 'new_competition':
      return `🎉 New Competition: "${competitionTitle}"`;
    case 'voting_open':
      return `🗳️ Voting Open: "${competitionTitle}"`;
    case 'competition_completed':
      return `🏆 Results Available: "${competitionTitle}"`;
    default:
      return `📢 Update: "${competitionTitle}"`;
  }
}

/**
 * Get notification message based on type
 */
function getNotificationMessage(type: string, competitionTitle: string, theme: string): string {
  switch (type) {
    case 'new_competition':
      return `A new photography competition "${competitionTitle}" with theme "${theme}" is now live! Submit your best photos and compete with fellow photographers.`;
    case 'voting_open':
      return `Voting is now open for "${competitionTitle}". Cast your vote for your favorite photos!`;
    case 'competition_completed':
      return `Results for "${competitionTitle}" are now available. Check out the final rankings!`;
    default:
      return `There's an update for the competition "${competitionTitle}".`;
  }
}

/**
 * Direct processing for smaller user counts (< 100 users)
 * This can be used when we know the user count is small enough to process synchronously
 */
export async function sendBulkNotificationsSync(
  competitionId: string,
  competitionTitle: string,
  competitionDescription: string,
  theme: string,
  startDate: string,
  endDate: string,
  notificationType: 'new_competition' | 'voting_open' | 'competition_completed' = 'new_competition'
): Promise<{
  success: boolean;
  message: string;
  emailsSent: number;
  notificationsCreated: number;
  errors: string[];
}> {
  const result = {
    success: true,
    message: '',
    emailsSent: 0,
    notificationsCreated: 0,
    errors: [] as string[]
  };

  try {
    await dbConnect();

    // Get users (limit to 100 for sync processing)
    const userQuery = {
      isVerified: true,
      isActive: true,
      ...(notificationType === 'new_competition' && { 'notificationPreferences.newCompetitions': true })
    };

    const users = await User.find(userQuery).limit(100).lean();

    if (users.length === 0) {
      result.message = 'No users found to notify';
      return result;
    }

    // Process all users in parallel for faster execution
    const promises = users.map(async (user) => {
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

        // Create in-app notification
        const notificationTitle = getNotificationTitle(notificationType, competitionTitle);
        const notificationMessage = getNotificationMessage(notificationType, competitionTitle, theme);

        const notificationResult = await createSystemNotification(
          (user._id as any).toString(),
          notificationTitle,
          notificationMessage,
          `/dashboard/competitions/${competitionId}`
        );

        return {
          emailSent: emailSent,
          notificationCreated: notificationResult.success !== false,
          error: null
        };

      } catch (userError: any) {
        return {
          emailSent: false,
          notificationCreated: false,
          error: `${user.email}: ${userError.message}`
        };
      }
    });

    // Wait for all notifications to complete
    const results = await Promise.all(promises);

    // Aggregate results
    results.forEach(userResult => {
      if (userResult.emailSent) result.emailsSent++;
      if (userResult.notificationCreated) result.notificationsCreated++;
      if (userResult.error) result.errors.push(userResult.error);
    });

    result.message = `Sent ${result.emailsSent} emails and created ${result.notificationsCreated} notifications`;
    
    if (result.errors.length > 0) {
      result.success = false;
      result.message += `. Errors: ${result.errors.length}`;
    }

  } catch (error: any) {
    console.error('Error in sync bulk notifications:', error);
    result.success = false;
    result.message = `Failed to send notifications: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
} 