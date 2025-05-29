import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import User from '@/models/User';
import { sendCompetitionReminderEmail } from '@/lib/emailService';
import { createSystemNotification } from '@/lib/notification-service';

interface CompetitionReminderResult {
  success: boolean;
  message: string;
  emailsSent: number;
  notificationsCreated: number;
  errors: string[];
  competitionTitle?: string;
}

/**
 * Get competitions that need reminders sent
 * @param reminderType - 'day_before' for 1 day before, 'last_day' for same day
 * @returns Array of competitions that need reminders
 */
export async function getCompetitionsNeedingReminders(reminderType: 'day_before' | 'last_day') {
  await dbConnect();
  
  // Get current time in Oman timezone (GMT+4)
  const now = new Date();
  const omanTime = new Date(now.getTime() + (4 * 60 * 60 * 1000)); // Add 4 hours for GMT+4
  
  // Set to 6 PM Oman time for comparison
  const targetHour = 18; // 6 PM
  const currentHour = omanTime.getHours();
  
  // Only proceed if it's around 6 PM Oman time (allow 1 hour window)
  if (currentHour < targetHour - 1 || currentHour > targetHour + 1) {
    console.log(`Current Oman time hour: ${currentHour}, target hour: ${targetHour}. Skipping reminder check.`);
    return [];
  }
  
  let startDate: Date;
  let endDate: Date;
  
  if (reminderType === 'day_before') {
    // For day before: find competitions ending tomorrow
    const tomorrow = new Date(omanTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Start of tomorrow (00:00)
    startDate = new Date(tomorrow);
    startDate.setHours(0, 0, 0, 0);
    
    // End of tomorrow (23:59)
    endDate = new Date(tomorrow);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // For last day: find competitions ending today
    const today = new Date(omanTime);
    
    // Start of today (00:00)
    startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    
    // End of today (23:59)
    endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
  }
  
  console.log(`Looking for competitions ending between ${startDate.toISOString()} and ${endDate.toISOString()}`);
  
  // Find active competitions ending in the target date range
  const competitions = await Competition.find({
    status: 'active',
    endDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).lean();
  
  console.log(`Found ${competitions.length} competitions needing ${reminderType} reminders`);
  
  return competitions;
}

/**
 * Send reminder emails for a specific competition
 * @param competition - Competition object
 * @param reminderType - Type of reminder
 * @returns Result object with success status and counts
 */
export async function sendCompetitionReminders(
  competition: any,
  reminderType: 'day_before' | 'last_day'
): Promise<CompetitionReminderResult> {
  const result: CompetitionReminderResult = {
    success: true,
    message: '',
    emailsSent: 0,
    notificationsCreated: 0,
    errors: [],
    competitionTitle: competition.title
  };
  
  try {
    await dbConnect();
    
    // Get all verified and active users
    const users = await User.find({
      isVerified: true,
      isActive: true
    }).lean();
    
    console.log(`Found ${users.length} users to send reminders to for competition: ${competition.title}`);
    
    const isLastDay = reminderType === 'last_day';
    
    // Send emails and create notifications for each user
    for (const user of users) {
      try {
        // Send email reminder
        const emailSent = await sendCompetitionReminderEmail(
          user.email,
          user.name,
          competition.title,
          competition._id.toString(),
          competition.endDate,
          isLastDay
        );
        
        if (emailSent) {
          result.emailsSent++;
          console.log(`Email sent to ${user.email} for competition ${competition.title}`);
        } else {
          result.errors.push(`Failed to send email to ${user.email}`);
        }
        
        // Create in-app notification
        const notificationTitle = isLastDay 
          ? `🚨 Last Day: "${competition.title}" ends today!`
          : `⏰ Reminder: "${competition.title}" ends tomorrow!`;
          
        const notificationMessage = isLastDay
          ? `Final hours to submit your photos for "${competition.title}". Don't miss out!`
          : `"${competition.title}" ends tomorrow. Submit your photos now!`;
        
        const notificationResult = await createSystemNotification(
          (user._id as any).toString(),
          notificationTitle,
          notificationMessage,
          `/dashboard/competitions/${competition._id}`
        );
        
        if (notificationResult.success) {
          result.notificationsCreated++;
        } else {
          result.errors.push(`Failed to create notification for ${user.email}: ${notificationResult.error}`);
        }
        
        // Add small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (userError: any) {
        console.error(`Error sending reminder to user ${user.email}:`, userError);
        result.errors.push(`Error for ${user.email}: ${userError.message}`);
      }
    }
    
    result.message = `Sent ${result.emailsSent} emails and created ${result.notificationsCreated} notifications for competition: ${competition.title}`;
    
    if (result.errors.length > 0) {
      result.success = false;
      result.message += `. Errors: ${result.errors.length}`;
    }
    
  } catch (error: any) {
    console.error('Error in sendCompetitionReminders:', error);
    result.success = false;
    result.message = `Failed to send reminders: ${error.message}`;
    result.errors.push(error.message);
  }
  
  return result;
}

/**
 * Process all competition reminders for a given type
 * @param reminderType - Type of reminder to process
 * @returns Summary of all reminders sent
 */
export async function processAllCompetitionReminders(reminderType: 'day_before' | 'last_day') {
  console.log(`Processing ${reminderType} competition reminders...`);
  
  const summary = {
    success: true,
    totalCompetitions: 0,
    totalEmailsSent: 0,
    totalNotificationsCreated: 0,
    errors: [] as string[],
    competitionResults: [] as any[]
  };
  
  try {
    // Get competitions that need reminders
    const competitions = await getCompetitionsNeedingReminders(reminderType);
    summary.totalCompetitions = competitions.length;
    
    if (competitions.length === 0) {
      return {
        ...summary,
        message: `No competitions found needing ${reminderType} reminders at this time.`
      };
    }
    
    // Process each competition
    for (const competition of competitions) {
      console.log(`Processing reminders for competition: ${competition.title}`);
      
      const result = await sendCompetitionReminders(competition, reminderType);
      
      summary.totalEmailsSent += result.emailsSent;
      summary.totalNotificationsCreated += result.notificationsCreated;
      summary.errors.push(...result.errors);
      summary.competitionResults.push({
        competitionId: competition._id,
        competitionTitle: competition.title,
        ...result
      });
      
      if (!result.success) {
        summary.success = false;
      }
      
      // Add delay between competitions to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const message = `Processed ${summary.totalCompetitions} competitions. Sent ${summary.totalEmailsSent} emails and created ${summary.totalNotificationsCreated} notifications.`;
    
    return {
      ...summary,
      message: summary.errors.length > 0 ? `${message} Errors: ${summary.errors.length}` : message
    };
    
  } catch (error: any) {
    console.error('Error in processAllCompetitionReminders:', error);
    return {
      ...summary,
      success: false,
      message: `Failed to process competition reminders: ${error.message}`,
      errors: [error.message]
    };
  }
}

/**
 * Send test reminder email to a specific email address
 * @param testEmail - Email address to send test to
 * @param reminderType - Type of reminder to test
 * @param competitionId - Optional specific competition ID to use
 * @returns Result object with success status
 */
export async function sendTestCompetitionReminder(
  testEmail: string,
  reminderType: 'day_before' | 'last_day',
  competitionId?: string
): Promise<CompetitionReminderResult> {
  const result: CompetitionReminderResult = {
    success: true,
    message: '',
    emailsSent: 0,
    notificationsCreated: 0,
    errors: [],
    competitionTitle: 'Test Competition'
  };

  try {
    await dbConnect();

    let competition: any;

    if (competitionId) {
      // Use specific competition if ID provided
      competition = await Competition.findById(competitionId).lean();
      
      if (!competition) {
        result.success = false;
        result.message = `Competition with ID ${competitionId} not found`;
        result.errors.push(`Competition not found: ${competitionId}`);
        return result;
      }
      
      // For real competitions, ensure they end at midnight (12:00 AM) in Oman timezone
      // This ensures consistency with the new datetime functionality
      const endDate = new Date(competition.endDate);
      
      // Set to midnight in Oman timezone (GMT+4)
      const omanMidnight = new Date(endDate);
      omanMidnight.setUTCHours(20, 0, 0, 0); // 20:00 UTC = 00:00 GMT+4 (midnight in Oman)
      
      // Update the competition object with the corrected end time
      competition = {
        ...competition,
        endDate: omanMidnight
      };
      
      result.competitionTitle = competition.title;
    } else {
      // Create a mock competition for testing with proper midnight end time in Oman timezone
      const endDate = new Date();
      
      if (reminderType === 'day_before') {
        // For day_before test: set end date to tomorrow at midnight Oman time
        endDate.setDate(endDate.getDate() + 1);
        endDate.setUTCHours(20, 0, 0, 0); // 20:00 UTC = 00:00 GMT+4 (midnight in Oman)
      } else {
        // For last_day test: set end date to today at midnight Oman time (end of today)
        endDate.setDate(endDate.getDate() + 1);
        endDate.setUTCHours(20, 0, 0, 0); // 20:00 UTC = 00:00 GMT+4 (midnight in Oman)
      }
      
      competition = {
        _id: 'test',
        title: 'Test Competition',
        endDate: endDate,
        status: 'active'
      };
      
      result.competitionTitle = 'Test Competition';
    }

    console.log(`Sending test ${reminderType} reminder to: ${testEmail}`);

    const isLastDay = reminderType === 'last_day';

    // Send test email
    const emailSent = await sendCompetitionReminderEmail(
      testEmail,
      'Test User', // Use a generic test name
      competition.title,
      competition._id.toString(),
      competition.endDate.toISOString ? competition.endDate.toISOString() : competition.endDate,
      isLastDay
    );

    if (emailSent) {
      result.emailsSent = 1;
      result.message = `Test ${reminderType} reminder email sent successfully to ${testEmail}`;
      console.log(`Test email sent to ${testEmail} for competition ${competition.title}`);
    } else {
      result.success = false;
      result.message = `Failed to send test email to ${testEmail}`;
      result.errors.push(`Failed to send email to ${testEmail}`);
    }

  } catch (error: any) {
    console.error('Error in sendTestCompetitionReminder:', error);
    result.success = false;
    result.message = `Failed to send test reminder: ${error.message}`;
    result.errors.push(error.message);
  }

  return result;
} 