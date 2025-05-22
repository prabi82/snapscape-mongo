import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from './lib/dbConnect';
import Setting from './models/Setting';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is protected (dashboard or admin routes)
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAdminRoute = pathname.startsWith('/admin');
  const isRootDashboard = pathname === '/dashboard' || pathname === '/dashboard/';
  
  if (isProtectedRoute) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // If no token, redirect to login
    if (!token) {
      const url = new URL('/', request.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
    
    // Debug: Log user role and path
    if (process.env.NODE_ENV === 'development') {
      console.log(`Middleware: User ${token.email} with role ${token.role} accessing ${pathname}`);
    }
    
    // If admin route but user is not admin
    if (isAdminRoute && token.role !== 'admin') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: Non-admin user attempted to access admin route ${pathname}, redirecting to dashboard`);
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Only check the exact dashboard path (not its sub-routes) for admin redirect
    if (isRootDashboard && token.role === 'admin') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: Admin user at /dashboard, redirecting to admin dashboard`);
      }
      
      // Force a refresh on the admin dashboard URL to ensure a fresh page load
      const adminDashboardUrl = new URL('/admin/dashboard', request.url);
      adminDashboardUrl.searchParams.set('refresh', Date.now().toString());
      adminDashboardUrl.searchParams.set('source', 'middleware');
      
      return NextResponse.redirect(adminDashboardUrl);
    }
  }
  
  // Handle OPTIONS request for API endpoints
  if (pathname.startsWith('/api') && request.method === 'OPTIONS') {
    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware handling OPTIONS request for:', pathname);
    }
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  try {
    // Get the token and user information
    const token = await getToken({ req: request });
    
    if (!token || !token.sub) {
      return NextResponse.next();
    }

    // Connect to database
    await dbConnect();

    // Fetch settings
    const settings = await Setting.findOne({});
    
    // If debug mode is not enabled, continue without modification
    if (!settings || !settings.debugModeEnabled) {
      return NextResponse.next();
    }

    // Check if current user is in the debug users list
    const isDebugUser = settings.debugModeUsers.includes(token.sub);
    
    // Clone the request headers to modify them
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-debug-mode', isDebugUser ? 'true' : 'false');

    // Return the response with the modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue without modification in case of error
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*',
    '/profile/:path*',
  ],
}; 