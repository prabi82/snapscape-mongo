import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    debug: {
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
      vercelEnvironment: process.env.VERCEL_ENV || 'Not set',
      nodeEnvironment: process.env.NODE_ENV || 'Not set',
    }
  });
} 