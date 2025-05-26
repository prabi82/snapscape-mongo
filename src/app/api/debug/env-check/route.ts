import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Only allow this in development or for admin users
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return NextResponse.json(
      { success: false, message: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }
  
  const envCheck = {
    EMAIL_HOST: process.env.EMAIL_HOST ? 'SET' : 'NOT SET',
    EMAIL_PORT: process.env.EMAIL_PORT ? 'SET' : 'NOT SET', 
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };
  
  return NextResponse.json({
    success: true,
    environment: envCheck,
    message: 'Environment variables check completed'
  });
} 