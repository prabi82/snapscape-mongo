import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Temporarily allow this in production for debugging
  // const isDevelopment = process.env.NODE_ENV === 'development';
  
  // if (!isDevelopment) {
  //   return NextResponse.json(
  //     { success: false, message: 'This endpoint is only available in development' },
  //     { status: 403 }
  //   );
  // }
  
  const envCheck = {
    EMAIL_HOST: process.env.EMAIL_HOST ? 'SET' : 'NOT SET',
    EMAIL_PORT: process.env.EMAIL_PORT ? 'SET' : 'NOT SET', 
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    // Show partial values for debugging (first 3 characters)
    EMAIL_HOST_PARTIAL: process.env.EMAIL_HOST ? process.env.EMAIL_HOST.substring(0, 3) + '...' : 'NOT SET',
    EMAIL_USER_PARTIAL: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '...' : 'NOT SET',
  };
  
  return NextResponse.json({
    success: true,
    environment: envCheck,
    message: 'Environment variables check completed',
    timestamp: new Date().toISOString()
  });
} 