import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session) {
      return NextResponse.json({ authenticated: false, message: 'Not authenticated' });
    }
    
    // Get direct user data from database for comparison
    await dbConnect();
    const dbUser = await User.findById(session.user.id).select('-password');
    
    // Return both session data and database data
    return NextResponse.json({
      authenticated: true,
      session: {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          hasImage: !!session.user.image,
          role: (session.user as any).role
        }
      },
      database: dbUser ? {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image,
        hasImage: !!dbUser.image,
        role: dbUser.role,
        provider: dbUser.provider
      } : null,
      mismatch: dbUser ? {
        name: dbUser.name !== session.user.name,
        email: dbUser.email !== session.user.email,
        image: dbUser.image !== session.user.image
      } : null
    });
  } catch (error) {
    console.error('Error in debug-session route:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving session data' },
      { status: 500 }
    );
  }
} 