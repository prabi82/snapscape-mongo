import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is protected (dashboard, admin, or judge routes)
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/judge');
  const isAdminRoute = pathname.startsWith('/admin');
  const isJudgeRoute = pathname.startsWith('/judge');
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
    
    // If judge route but user is not judge or admin
    if (isJudgeRoute && token.role !== 'judge' && token.role !== 'admin') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: Non-judge user attempted to access judge route ${pathname}, redirecting to dashboard`);
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
    
    // Redirect judges to judge dashboard when they visit root dashboard
    if (isRootDashboard && token.role === 'judge') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Middleware: Judge user at /dashboard, redirecting to judge dashboard`);
      }
      
      const judgeDashboardUrl = new URL('/judge', request.url);
      judgeDashboardUrl.searchParams.set('refresh', Date.now().toString());
      judgeDashboardUrl.searchParams.set('source', 'middleware');
      
      return NextResponse.redirect(judgeDashboardUrl);
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

  // Removed database operations to fix Edge Runtime compatibility
  // Debug mode checking should be handled at the component/API level instead
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/judge/:path*',
    '/api/:path*',
    '/profile/:path*',
  ],
}; 