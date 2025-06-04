import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for "View as User" mode for judges
  const viewAsUser = request.nextUrl.searchParams.get('viewAsUser') === 'true';
  
  // Check if the path is protected (dashboard, admin, or judge routes)
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/judge');
  const isAdminRoute = pathname.startsWith('/admin');
  const isJudgeRoute = pathname.startsWith('/judge');
  const isRootDashboard = pathname === '/dashboard' || pathname === '/dashboard/';
  
  // Check if this is a competition detail page that judges should be able to access
  const isCompetitionDetailPage = pathname.match(/^\/dashboard\/competitions\/[^\/]+(?:\/.*)?$/);
  
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
      console.log(`Middleware: User ${token.email} with role ${token.role} accessing ${pathname}${viewAsUser ? ' (View as User mode)' : ''}`);
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
    
    // Judge-specific routing logic
    if (token.role === 'judge') {
      // Check if this is the role selection page itself
      const isRoleSelectionPage = pathname === '/role-selection';
      
      // If judge is explicitly in "View as User" mode, allow dashboard access
      if (viewAsUser) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware: Judge in "View as User" mode, allowing dashboard access');
        }
        const response = NextResponse.next();
        response.headers.set('X-View-As-User', 'true');
        return response;
      }
      
      // If judge is accessing competition details (not in view as user mode), allow it but keep them in judge context
      if (isCompetitionDetailPage) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware: Judge accessing competition details, allowing access');
        }
        return NextResponse.next();
      }
      
      // If judge tries to access root dashboard and it's not from role selection, redirect to role selection
      if (isRootDashboard && !isRoleSelectionPage) {
        // Check if they have a role preference (this should be handled by the client-side logic)
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware: Judge accessing dashboard, redirecting to role selection');
        }
        return NextResponse.redirect(new URL('/role-selection', request.url));
      }
      
      // If judge is accessing other dashboard routes (not view as user mode) and not from role selection, redirect to role selection
      if (pathname.startsWith('/dashboard') && !viewAsUser && !isRoleSelectionPage) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware: Judge accessing dashboard route, redirecting to role selection');
        }
        return NextResponse.redirect(new URL('/role-selection', request.url));
      }
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
    '/role-selection',
    '/api/:path*',
    '/profile/:path*',
  ],
}; 