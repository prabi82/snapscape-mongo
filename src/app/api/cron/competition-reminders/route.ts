import { NextRequest, NextResponse } from 'next/server';
import { processAllCompetitionReminders, sendTestCompetitionReminder } from '@/lib/competition-reminder-service';

export async function POST(req: NextRequest) {
  try {
    console.log('Competition reminder cron job triggered');
    
    // Get the reminder type from query parameters or body
    const url = new URL(req.url);
    const reminderType = url.searchParams.get('type') as 'day_before' | 'last_day';
    
    // Validate reminder type
    if (!reminderType || !['day_before', 'last_day'].includes(reminderType)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid reminder type. Must be "day_before" or "last_day"' 
        },
        { status: 400 }
      );
    }
    
    // Optional: Add basic authentication for security
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.log('Unauthorized cron job attempt');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`Processing ${reminderType} competition reminders...`);
    
    // Process the reminders
    const result = await processAllCompetitionReminders(reminderType);
    
    console.log('Competition reminder result:', result);
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        totalCompetitions: result.totalCompetitions,
        totalEmailsSent: result.totalEmailsSent,
        totalNotificationsCreated: result.totalNotificationsCreated,
        errors: result.errors,
        competitionResults: result.competitionResults
      }
    }, { 
      status: result.success ? 200 : 500 
    });
    
  } catch (error: any) {
    console.error('Error in competition reminder cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// GET method for testing/manual triggering
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const reminderType = url.searchParams.get('type') as 'day_before' | 'last_day';
    const testEmail = url.searchParams.get('testEmail');
    const competitionId = url.searchParams.get('competitionId');
    
    if (!reminderType || !['day_before', 'last_day'].includes(reminderType)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid reminder type. Must be "day_before" or "last_day"' 
        },
        { status: 400 }
      );
    }
    
    // If testEmail is provided, send test email instead of processing all reminders
    if (testEmail) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid email format' 
          },
          { status: 400 }
        );
      }
      
      console.log(`Manual test trigger: Sending ${reminderType} reminder to ${testEmail}...`);
      
      const result = await sendTestCompetitionReminder(testEmail, reminderType, competitionId || undefined);
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          totalCompetitions: 1,
          totalEmailsSent: result.emailsSent,
          totalNotificationsCreated: result.notificationsCreated,
          errors: result.errors,
          competitionResults: [{
            competitionId: competitionId || 'test',
            competitionTitle: result.competitionTitle || 'Test Competition',
            success: result.success,
            emailsSent: result.emailsSent,
            notificationsCreated: result.notificationsCreated,
            errors: result.errors
          }]
        }
      }, { 
        status: result.success ? 200 : 500 
      });
    }
    
    console.log(`Manual trigger: Processing ${reminderType} competition reminders...`);
    
    const result = await processAllCompetitionReminders(reminderType);
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        totalCompetitions: result.totalCompetitions,
        totalEmailsSent: result.totalEmailsSent,
        totalNotificationsCreated: result.totalNotificationsCreated,
        errors: result.errors,
        competitionResults: result.competitionResults
      }
    }, { 
      status: result.success ? 200 : 500 
    });
    
  } catch (error: any) {
    console.error('Error in manual competition reminder trigger:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 