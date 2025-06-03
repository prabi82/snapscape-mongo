import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Notification from '@/models/Notification';
import dbConnect from '@/lib/dbConnect';

// Define extended session interface
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

// GET a single notification
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions as any) as ExtendedSession;
    const { id } = await params;
    
    console.log('[NOTIFICATION GET] Request received:', {
      notificationId: id,
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role
    });
    
    // Check authentication
    if (!session?.user?.id) {
      console.log('[NOTIFICATION GET] Authentication failed');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const notification = await Notification.findById(id)
      .populate('relatedCompetition', 'title')
      .populate('relatedSubmission', 'title')
      .populate('relatedBadge', 'name icon');
    
    if (!notification) {
      console.log('[NOTIFICATION GET] Notification not found:', id);
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Only allow user to view their own notifications
    if (notification.user.toString() !== session.user.id) {
      console.log('[NOTIFICATION GET] Authorization failed:', {
        notificationUserId: notification.user.toString(),
        sessionUserId: session.user.id
      });
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      );
    }
    
    console.log('[NOTIFICATION GET] Success:', id);
    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    console.error('[NOTIFICATION GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH mark notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions as any) as ExtendedSession;
    const { id } = await params;
    
    console.log('[NOTIFICATION PATCH] Request received:', {
      notificationId: id,
      hasSession: !!session,
      userId: session?.user?.id
    });
    
    // Check authentication
    if (!session?.user?.id) {
      console.log('[NOTIFICATION PATCH] Authentication failed');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      console.log('[NOTIFICATION PATCH] Notification not found:', id);
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Only allow user to mark their own notifications as read
    if (notification.user.toString() !== session.user.id) {
      console.log('[NOTIFICATION PATCH] Authorization failed');
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      );
    }
    
    // Mark as read
    notification.read = true;
    await notification.save();
    
    console.log('[NOTIFICATION PATCH] Success:', id);
    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error: any) {
    console.error('[NOTIFICATION PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE a notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n=== NOTIFICATION DELETE REQUEST START ===');
  
  try {
    // Step 1: Connect to database
    console.log('[DELETE] Step 1: Connecting to database...');
    await dbConnect();
    console.log('[DELETE] Step 1: Database connected ✓');
    
    // Step 2: Get session
    console.log('[DELETE] Step 2: Getting session...');
    const session = await getServerSession(authOptions as any) as ExtendedSession;
    console.log('[DELETE] Step 2: Session result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });
    
    // Step 3: Extract ID (await params for Next.js 15)
    const { id } = await params;
    console.log('[DELETE] Step 3: Notification ID:', id);
    
    // Step 4: Authentication check
    console.log('[DELETE] Step 4: Checking authentication...');
    if (!session?.user?.id) {
      console.log('[DELETE] Step 4: FAILED - No session or user ID');
      return NextResponse.json(
        { success: false, message: 'Not authenticated', debug: 'No session or user ID' },
        { status: 401 }
      );
    }
    console.log('[DELETE] Step 4: Authentication passed ✓');
    
    // Step 5: Find notification
    console.log('[DELETE] Step 5: Finding notification in database...');
    const notification = await Notification.findById(id);
    console.log('[DELETE] Step 5: Query result:', {
      found: !!notification,
      notificationId: notification?._id,
      notificationTitle: notification?.title,
      notificationUserId: notification?.user?.toString(),
      notificationType: notification?.type
    });
    
    if (!notification) {
      console.log('[DELETE] Step 5: FAILED - Notification not found');
      return NextResponse.json(
        { success: false, message: 'Notification not found', debug: `No notification with ID: ${id}` },
        { status: 404 }
      );
    }
    console.log('[DELETE] Step 5: Notification found ✓');
    
    // Step 6: Authorization check
    console.log('[DELETE] Step 6: Checking authorization...');
    const notificationUserId = notification.user.toString();
    const sessionUserId = session.user.id;
    const isAuthorized = notificationUserId === sessionUserId;
    
    console.log('[DELETE] Step 6: Authorization details:', {
      notificationUserId,
      sessionUserId,
      isAuthorized,
      userIdsMatch: notificationUserId === sessionUserId
    });
    
    if (!isAuthorized) {
      console.log('[DELETE] Step 6: FAILED - User not authorized');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Not authorized', 
          debug: `User ${sessionUserId} cannot delete notification owned by ${notificationUserId}` 
        },
        { status: 403 }
      );
    }
    console.log('[DELETE] Step 6: Authorization passed ✓');
    
    // Step 7: Perform deletion
    console.log('[DELETE] Step 7: Performing database deletion...');
    const deleteResult = await Notification.findByIdAndDelete(id);
    console.log('[DELETE] Step 7: Deletion result:', {
      deletedNotification: !!deleteResult,
      deletedId: deleteResult?._id,
      deletedTitle: deleteResult?.title
    });
    
    if (!deleteResult) {
      console.log('[DELETE] Step 7: WARNING - No document was deleted');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to delete notification',
          debug: 'findByIdAndDelete returned null'
        },
        { status: 500 }
      );
    }
    
    // Step 8: Verify deletion
    console.log('[DELETE] Step 8: Verifying deletion...');
    const verifyNotification = await Notification.findById(id);
    console.log('[DELETE] Step 8: Verification result:', {
      stillExists: !!verifyNotification,
      verificationId: verifyNotification?._id
    });
    
    if (verifyNotification) {
      console.log('[DELETE] Step 8: ERROR - Notification still exists after deletion!');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Notification deletion failed',
          debug: 'Notification still exists after delete operation'
        },
        { status: 500 }
      );
    }
    
    console.log('[DELETE] Step 8: Deletion verified ✓');
    console.log('[DELETE] SUCCESS: Notification deleted successfully');
    console.log('=== NOTIFICATION DELETE REQUEST END ===\n');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification deleted successfully',
      debug: {
        deletedId: id,
        deletedTitle: deleteResult.title,
        deletedAt: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[DELETE] ERROR: Exception occurred:', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name
    });
    console.log('=== NOTIFICATION DELETE REQUEST END (ERROR) ===\n');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        debug: {
          errorType: error.name,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 