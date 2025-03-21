import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // For security, only show certain information
    return NextResponse.json({
      auth: {
        nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
        hasGoogleCredentials: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        currentEnvironment: process.env.NODE_ENV,
        isAuthenticated: !!session,
        user: session ? {
          name: session.user?.name,
          email: session.user?.email,
          role: session.user?.role
        } : null
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred checking auth configuration' },
      { status: 500 }
    );
  }
} 