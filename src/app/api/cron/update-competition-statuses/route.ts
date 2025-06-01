import { NextRequest, NextResponse } from 'next/server';
import { updateCompetitionStatuses, getCompetitionsNeedingStatusUpdate } from '@/lib/competition-auto-status-service';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header (for cron job security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting automatic competition status update');
    
    // Update competition statuses
    const results = await updateCompetitionStatuses();
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`[CRON] Status update completed: ${successCount} successful, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Competition status update completed`,
      results: {
        total: results.length,
        successful: successCount,
        errors: errorCount,
        updates: results
      }
    });

  } catch (error: any) {
    console.error('[CRON] Error in competition status update:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during status update',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Manual trigger endpoint (admin only)
    const { bypassManualOverride } = await request.json();
    
    console.log('[MANUAL] Starting manual competition status update');
    
    // Update competition statuses
    const results = await updateCompetitionStatuses(bypassManualOverride || false);
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`[MANUAL] Status update completed: ${successCount} successful, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Manual competition status update completed`,
      results: {
        total: results.length,
        successful: successCount,
        errors: errorCount,
        updates: results
      }
    });

  } catch (error: any) {
    console.error('[MANUAL] Error in manual competition status update:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during manual status update',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Preview endpoint to see what competitions need updates
export async function PUT(request: NextRequest) {
  try {
    console.log('[PREVIEW] Getting competitions needing status update');
    
    const competitions = await getCompetitionsNeedingStatusUpdate();
    
    return NextResponse.json({
      success: true,
      message: `Found ${competitions.length} competitions needing status updates`,
      competitions: competitions.map(comp => ({
        id: comp._id,
        title: comp.title,
        currentStatus: comp.currentStatus,
        expectedStatus: comp.expectedStatus,
        startDate: comp.startDate,
        endDate: comp.endDate,
        votingEndDate: comp.votingEndDate
      }))
    });

  } catch (error: any) {
    console.error('[PREVIEW] Error getting competitions needing update:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during preview',
        error: error.message 
      },
      { status: 500 }
    );
  }
} 