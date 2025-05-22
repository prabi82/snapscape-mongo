import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = headers();
  const host = headersList.get('host') || 'unknown';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const actualUrl = `${protocol}://${host}`;
  
  // Calculate what the base URL would be with our logic
  const calculatedBaseUrl = process.env.NEXTAUTH_URL || 
                           process.env.NEXT_PUBLIC_APP_URL || 
                           process.env.VERCEL_URL || 
                           'http://localhost:3000';
  
  return NextResponse.json({
    debug: {
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      // Environment variables that could affect the base URL
      possibleBaseUrls: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
        VERCEL_URL: process.env.VERCEL_URL || 'Not set',
      },
      // What we're actually using
      calculatedBaseUrl,
      // Request information
      requestInfo: {
        host,
        protocol,
        actualUrl
      }
    }
  });
} 