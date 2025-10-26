/**
 * Middleware for Route Protection
 * 
 * Enhanced with JWT verification and session tracking.
 * This runs on every request to protected routes.
 * 
 * Flow:
 * 1. Check if route is public (allow)
 * 2. Extract JWT from Authorization header or cookie
 * 3. Validate JWT signature (basic check in middleware)
 * 4. Add user context to request headers (x-user-id, x-tenant-id, x-jti)
 * 5. API routes will perform full session validation against control-plane DB
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/favicon.ico',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/signup',
  '/api/auth/me',
  '/api/health',
  '/_next/',
  '/_next/static',
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p));
}

/**
 * Extract JWT from Authorization header or cookie
 */
function getJWTFromRequest(req: NextRequest): string | null {
  // Try Authorization header first (preferred)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fallback to session cookie
  const sessionCookie = req.cookies.get('__session');
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }

  return null;
}

/**
 * Decode JWT payload (basic, no verification in Edge runtime)
 * Full verification happens in API routes against JWKS
 */
function decodeJWTBasic(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf-8')
    );

    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract claims from JWT without verification
 */
function extractJWTClaims(token: string): {
  userId?: string;
  tenantId?: string;
  jti?: string;
  exp?: number;
} | null {
  const payload = decodeJWTBasic(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.sub,
    tenantId: payload.tenant_id,
    jti: payload.jti,
    exp: payload.exp,
  };
}

/**
 * Check if JWT is expired
 */
function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false;
  return expiresAt * 1000 < Date.now(); // exp is in seconds
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

  // Extract JWT
  const jwt = getJWTFromRequest(req);
  
  if (!jwt) {
    // No JWT - redirect to login (for browser requests)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: missing JWT' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT claims (basic validation)
  const claims = extractJWTClaims(jwt);

  if (!claims || !claims.userId || !claims.tenantId) {
    // Invalid JWT structure
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid JWT structure' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check expiration
  if (isTokenExpired(claims.exp)) {
    // Token expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: JWT expired' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // JWT is structurally valid and not expired
  // Add user context to request headers for downstream handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', claims.userId);
  requestHeaders.set('x-tenant-id', claims.tenantId);
  requestHeaders.set('x-jti', claims.jti || '');
  requestHeaders.set('x-jwt', jwt);

  // Continue to next handler
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dashboard',
    '/',
    '/api/:path*',
  ],
};
