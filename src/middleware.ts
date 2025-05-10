import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is protected (dashboard or admin routes)
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAdminRoute = pathname.startsWith('/admin');
  
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
    
    // If admin route but user is not admin
    if (isAdminRoute && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If user route but user is admin, redirect to admin dashboard
    if (pathname === '/dashboard' && token.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }
  
  // Handle OPTIONS request for API endpoints
  if (pathname.startsWith('/api') && request.method === 'OPTIONS') {
    console.log('Middleware handling OPTIONS request for:', pathname);
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
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
}; 