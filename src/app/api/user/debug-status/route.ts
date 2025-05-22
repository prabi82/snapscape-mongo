import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Setting from '@/models/Setting';

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({
        isDebugModeEnabled: false,
        message: 'User not authenticated'
      });
    }

    // Get the user ID
    const userId = (session.user as ExtendedUser).id;
    
    if (!userId) {
      return NextResponse.json({
        isDebugModeEnabled: false,
        message: 'User ID not found in session'
      });
    }

    // Connect to database
    await dbConnect();

    // Fetch settings
    const settings = await Setting.findOne({});
    
    // Check if debug mode is enabled globally and if the user is in the debug users list
    const isDebugModeEnabled = 
      settings?.debugModeEnabled === true && 
      settings.debugModeUsers.includes(userId);

    return NextResponse.json({
      isDebugModeEnabled,
      userId
    });
    
  } catch (error) {
    console.error('Error checking debug status:', error);
    return NextResponse.json({
      isDebugModeEnabled: false,
      message: 'Error checking debug status'
    }, { status: 500 });
  }
} 