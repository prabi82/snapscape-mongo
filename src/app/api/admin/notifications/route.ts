import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { Notification, User, ensureModelsAreLoaded } from '@/lib/model-import-helper';

// Define interface for extended session
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

// GET admin notifications (similar to user notifications but fetches for all users of admin type)
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Ensure models are loaded
    ensureModelsAreLoaded();
    
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Unread filter
    const unreadOnly = searchParams.get('unread') === 'true';
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }, '_id');
    const adminIds = adminUsers.map(admin => admin._id);
    
    // Create filter to get all admin notifications
    const filter = {
      user: { $in: adminIds },
      ...(unreadOnly ? { read: false } : {})
    };
    
    // Get notifications - explicitly sort by createdAt in descending order (newest first)
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }) // Ensure newest notifications appear first
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination and unread count
    const [totalNotifications, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: { $in: adminIds }, read: false })
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
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch admin notifications' },
      { status: 500 }
    );
  }
}

// PUT update admin notifications (mark as read/unread)
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
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
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }, '_id');
    const adminIds = adminUsers.map(admin => admin._id);
    
    let updateResult;
    
    if (markAll) {
      // Mark all admin notifications as read/unread
      updateResult = await Notification.updateMany(
        { user: { $in: adminIds } },
        { $set: { read } }
      );
    } else {
      // Mark specific notifications as read/unread
      updateResult = await Notification.updateMany(
        { 
          _id: { $in: ids },
          user: { $in: adminIds } // Ensure admin can only update admin notifications
        },
        { $set: { read } }
      );
    }
    
    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      user: { $in: adminIds },
      read: false
    });
    
    return NextResponse.json({
      success: true,
      message: `Notifications ${read ? 'marked as read' : 'marked as unread'}`,
      unreadCount,
      updatedCount: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('Error updating admin notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update admin notifications' },
      { status: 500 }
    );
  }
}

// DELETE admin notifications
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    const body = await req.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No notification IDs provided' },
        { status: 400 }
      );
    }
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }, '_id');
    const adminIds = adminUsers.map(admin => admin._id);
    
    // Delete the specified notifications for admin users
    const deleteResult = await Notification.deleteMany({
      _id: { $in: ids },
      user: { $in: adminIds } // Ensure admin can only delete admin notifications
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin notifications deleted successfully',
      deletedCount: deleteResult.deletedCount
    });
    
  } catch (error) {
    console.error('Error deleting admin notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete admin notifications' },
      { status: 500 }
    );
  }
} 