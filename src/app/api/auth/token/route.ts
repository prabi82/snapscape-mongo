import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  try {
    // Get the JWT token
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If there's no token, return unauthorized
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return the token data, excluding sensitive fields
    return NextResponse.json({
      // Include these fields
      id: token.id,
      name: token.name,
      email: token.email,
      role: token.role,
      iat: token.iat,
      exp: token.exp,
      
      // Add debugging info
      isAdmin: token.role === 'admin',
      tokenType: typeof token.role,
      
      // Include the raw token for inspection
      hasRole: 'role' in token,
    });
  } catch (error) {
    console.error('Error retrieving token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve token information' },
      { status: 500 }
    );
  }
} 