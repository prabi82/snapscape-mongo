import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import { sendCompetitionStatusChangeNotifications, logStatusChangeNotification } from '@/lib/competition-status-notification-service';

// Define the interface locally since it's not exported
interface StatusChangeNotificationResult {
  success: boolean;
  message: string;
  emailsSent: number;
  notificationsCreated: number;
  errors: string[];
  competitionTitle: string;
}

interface StatusUpdateResult {
  competitionId: string;
  title: string;
  oldStatus: string;
  newStatus: string;
  success: boolean;
  message: string;
  notificationResult?: StatusChangeNotificationResult;
}

interface CompetitionNeedingUpdate {
  _id: any;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  votingEndDate: Date;
  currentStatus: string;
  expectedStatus: string;
  // Allow additional properties from the lean() query
  [key: string]: any;
}

/**
 * Automatically update competition statuses based on current date/time
 * @param bypassManualOverride - If true, updates even manually overridden competitions
 * @returns Array of update results
 */
export async function updateCompetitionStatuses(bypassManualOverride: boolean = false): Promise<StatusUpdateResult[]> {
  await dbConnect();
  
  const now = new Date();
  const results: StatusUpdateResult[] = [];
  
  console.log(`[AUTO-STATUS] Starting automatic status update at ${now.toISOString()}`);
  
  try {
    // Build query - exclude manually overridden competitions unless bypassed
    const query: any = {};
    if (!bypassManualOverride) {
      query.$or = [
        { manualStatusOverride: { $exists: false } },
        { manualStatusOverride: false }
      ];
    }
    
    // Get all competitions that might need status updates
    const competitions = await Competition.find(query).lean();
    
    console.log(`[AUTO-STATUS] Found ${competitions.length} competitions to check`);
    
    for (const competition of competitions) {
      const updateResult = await updateSingleCompetitionStatus(competition, now);
      if (updateResult) {
        results.push(updateResult);
      }
    }
    
    console.log(`[AUTO-STATUS] Completed status update. ${results.length} competitions updated.`);
    
  } catch (error: any) {
    console.error('[AUTO-STATUS] Error during automatic status update:', error);
    results.push({
      competitionId: 'system',
      title: 'System Error',
      oldStatus: 'error',
      newStatus: 'error',
      success: false,
      message: `System error: ${error.message}`
    });
  }
  
  return results;
}

/**
 * Update status for a single competition
 */
async function updateSingleCompetitionStatus(competition: any, now: Date): Promise<StatusUpdateResult | null> {
  const competitionId = competition._id.toString();
  const currentStatus = competition.status;
  let newStatus = currentStatus;
  
  // Determine what the status should be based on dates
  if (now < new Date(competition.startDate)) {
    newStatus = 'upcoming';
  } else if (now >= new Date(competition.startDate) && now < new Date(competition.endDate)) {
    newStatus = 'active';
  } else if (now >= new Date(competition.endDate) && now < new Date(competition.votingEndDate)) {
    newStatus = 'voting';
  } else if (now >= new Date(competition.votingEndDate)) {
    newStatus = 'completed';
  }
  
  // If status doesn't need to change, return null
  if (currentStatus === newStatus) {
    return null;
  }
  
  console.log(`[AUTO-STATUS] Competition "${competition.title}" (${competitionId}): ${currentStatus} → ${newStatus}`);
  
  try {
    // Update the competition status
    const updateResult = await Competition.updateOne(
      { _id: competitionId },
      { 
        $set: { 
          status: newStatus,
          lastAutoStatusUpdate: now
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return {
        competitionId,
        title: competition.title,
        oldStatus: currentStatus,
        newStatus: newStatus,
        success: false,
        message: 'Failed to update competition status in database'
      };
    }
    
    // Send notifications for status changes to voting or completed
    let notificationResult: StatusChangeNotificationResult | undefined = undefined;
    if (newStatus === 'voting' || newStatus === 'completed') {
      try {
        notificationResult = await sendCompetitionStatusChangeNotifications(
          competitionId,
          competition.title,
          newStatus as 'voting' | 'completed',
          newStatus === 'voting' ? competition.votingEndDate : undefined
        );
        
        // Log the notification
        await logStatusChangeNotification(
          competitionId,
          competition.title,
          newStatus as 'voting' | 'completed',
          notificationResult
        );
        
        console.log(`[AUTO-STATUS] Sent ${newStatus} notifications for "${competition.title}"`);
      } catch (notificationError: any) {
        console.error(`[AUTO-STATUS] Failed to send notifications for "${competition.title}":`, notificationError);
      }
    }
    
    return {
      competitionId,
      title: competition.title,
      oldStatus: currentStatus,
      newStatus: newStatus,
      success: true,
      message: `Successfully updated from ${currentStatus} to ${newStatus}`,
      notificationResult
    };
    
  } catch (error: any) {
    console.error(`[AUTO-STATUS] Error updating competition "${competition.title}":`, error);
    return {
      competitionId,
      title: competition.title,
      oldStatus: currentStatus,
      newStatus: newStatus,
      success: false,
      message: `Error updating status: ${error.message}`
    };
  }
}

/**
 * Get competitions that need status updates (for preview/testing)
 */
export async function getCompetitionsNeedingStatusUpdate(): Promise<CompetitionNeedingUpdate[]> {
  await dbConnect();
  
  const now = new Date();
  const competitions = await Competition.find({
    $or: [
      { manualStatusOverride: { $exists: false } },
      { manualStatusOverride: false }
    ]
  }).lean();
  
  const needingUpdate: CompetitionNeedingUpdate[] = [];
  
  for (const competition of competitions) {
    const currentStatus = competition.status;
    let expectedStatus = currentStatus;
    
    // Determine what the status should be
    if (now < new Date(competition.startDate)) {
      expectedStatus = 'upcoming';
    } else if (now >= new Date(competition.startDate) && now < new Date(competition.endDate)) {
      expectedStatus = 'active';
    } else if (now >= new Date(competition.endDate) && now < new Date(competition.votingEndDate)) {
      expectedStatus = 'voting';
    } else if (now >= new Date(competition.votingEndDate)) {
      expectedStatus = 'completed';
    }
    
    if (currentStatus !== expectedStatus) {
      needingUpdate.push({
        _id: competition._id,
        title: competition.title,
        status: competition.status,
        startDate: competition.startDate,
        endDate: competition.endDate,
        votingEndDate: competition.votingEndDate,
        currentStatus,
        expectedStatus,
        // Include any additional properties
        ...competition
      });
    }
  }
  
  return needingUpdate;
} 