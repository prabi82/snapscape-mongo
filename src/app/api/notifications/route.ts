import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';

// GET user notifications
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Unread filter
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Create filter
    const filter = {
      user: session.user.id,
      ...(unreadOnly ? { read: false } : {})
    };
    
    // Get notifications
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination and unread count
    const [totalNotifications, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: session.user.id, read: false })
    ]);
    
    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total: totalNotifications,
        page,
        limit,
        pages: Math.ceil(totalNotifications / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST create a notification (typically used by system processes)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    
    // This endpoint would typically be protected and only accessible by the system
    // or admins. For simplicity, we'll just check for authentication.
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['user', 'title', 'message', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Create notification
    const notification = await Notification.create(body);
    
    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    const body = await req.json();
    const { ids, markAll, read } = body;
    
    if (!ids && !markAll) {
      return NextResponse.json(
        { success: false, message: 'No notification IDs provided' },
        { status: 400 }
      );
    }
    
    if (typeof read !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Read status not provided' },
        { status: 400 }
      );
    }
    
    let updateResult;
    
    if (markAll) {
      // Mark all notifications as read/unread
      updateResult = await Notification.updateMany(
        { user: session.user.id },
        { $set: { read } }
      );
    } else {
      // Mark specific notifications as read/unread
      updateResult = await Notification.updateMany(
        { 
          _id: { $in: ids },
          user: session.user.id // Ensure user can only update their own notifications
        },
        { $set: { read } }
      );
    }
    
    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      user: session.user.id,
      read: false
    });
    
    return NextResponse.json({
      success: true,
      message: `Notifications ${read ? 'marked as read' : 'marked as unread'}`,
      unreadCount,
      updatedCount: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update notifications' },
      { status: 500 }
    );
  }
} 