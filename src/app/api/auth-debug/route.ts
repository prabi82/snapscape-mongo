import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const headersList = headers();
    const host = headersList.get('host') || 'unknown';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const fullUrl = `${protocol}://${host}`;
    
    // For security, only show certain information
    return NextResponse.json({
      auth: {
        nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
        actualUrl: fullUrl,
        hasGoogleCredentials: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        currentEnvironment: process.env.NODE_ENV,
        isAuthenticated: !!session,
        callbackUrl: `${fullUrl}/api/auth/callback/google`,
        providers: authOptions.providers.map(p => p.id),
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