/**
 * Middleware for Route Protection
 * 
 * Verifies session cookies and redirects unauthenticated users to login.
 * This runs on every request to protected routes.
 * 
 * Note: We use a simpler cookie check here because Edge runtime has limitations.
 * Full session verification happens in API routes and server components.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/favicon.ico',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/permissions',
  '/_next/',
  '/_next/static',
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets and explicit public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Protect root, dashboard, and API endpoints
  const shouldProtect = 
    pathname === '/' || 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/api/');

  if (!shouldProtect) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = req.cookies.get('__session');
  
  if (!sessionCookie || !sessionCookie.value) {
    // No session cookie - redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie exists - allow request to proceed
  // Full verification will happen in API routes/server components
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/', '/api/:path*'],
};
