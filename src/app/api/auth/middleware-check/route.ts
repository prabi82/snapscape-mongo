import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  try {
    // Get the JWT token
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Get request info
    const host = req.headers.get('host') || 'unknown';
    const referer = req.headers.get('referer') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check env variables
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'not set';
    const environment = process.env.NODE_ENV || 'unknown';

    // If there's no token, return unauthorized
    if (!token) {
      return NextResponse.json(
        { 
          error: 'Not authenticated',
          info: {
            host,
            referer,
            environment,
            nextAuthUrl,
            userAgent: userAgent.substring(0, 100) // Truncate to avoid huge strings
          }
        },
        { status: 401 }
      );
    }

    // Return debugging info
    return NextResponse.json({
      tokenInfo: {
        id: token.id,
        email: token.email,
        role: token.role,
        roleType: typeof token.role,
        isAdmin: token.role === 'admin',
        hasRole: 'role' in token,
      },
      requestInfo: {
        host,
        referer,
        environment,
        nextAuthUrl,
        url: req.url,
        userAgent: userAgent.substring(0, 100) // Truncate to avoid huge strings
      }
    });
  } catch (error) {
    console.error('Error in middleware-check:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve middleware information', details: String(error) },
      { status: 500 }
    );
  }
} 