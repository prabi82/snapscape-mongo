import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '@/lib/dbConnect';
import ReminderLog from '@/models/ReminderLog';

// Define a proper session type to fix TypeScript errors
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions) as ExtendedSession;
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const triggerType = searchParams.get('triggerType') || '';
    const triggerMethod = searchParams.get('triggerMethod') || '';

    // Build filter query
    const filter: any = {};
    
    if (triggerType) {
      filter.triggerType = triggerType;
    }
    
    if (triggerMethod) {
      filter.triggerMethod = triggerMethod;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await ReminderLog.countDocuments(filter);

    // Get logs with pagination, filtering, and sorting (newest first)
    const logs = await ReminderLog.find(filter)
      .sort({ executionTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format logs for display
    const formattedLogs = logs.map(log => ({
      ...log,
      omanTime: new Date(log.executionTime).toLocaleString('en-US', {
        timeZone: 'Asia/Muscat',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching reminder logs:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
} 