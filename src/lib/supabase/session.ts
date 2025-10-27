/**
 * Supabase Session Management
 * 
 * Handles JWT token storage in httpOnly cookies and verification.
 * Uses Supabase for session management.
 * 
 * Token Storage:
 * - Access token: short-lived (15 minutes), stored in httpOnly cookie
 * - Refresh token: long-lived (7 days), stored in httpOnly cookie
 * - Verification: JWT signature verified against Supabase JWKS endpoint
 */

import { cookies } from 'next/headers';

export const ACCESS_TOKEN_COOKIE_NAME = '__supabase_access_token.env.local';
export const REFRESH_TOKEN_COOKIE_NAME = '__supabase_refresh_token';
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
export const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes in seconds
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Set access token in httpOnly cookie
 * @param token JWT access token
 */
export async function setAccessTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  });
}

/**
 * Set refresh token in httpOnly cookie
 * @param token JWT refresh token
 */
export async function setRefreshTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/',
  });
}

/**
 * Get access token from cookie
 * @returns Access token or null
 */
export async function getAccessTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME);

  return cookie?.value || null;
}

/**
 * Get refresh token from cookie
 * @returns Refresh token or null
 */
export async function getRefreshTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME);

  return cookie?.value || null;
}

/**
 * Clear both access and refresh tokens
 */
export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}

/**
 * Clear a specific token cookie
 */
export async function clearTokenCookie(tokenType: 'access' | 'refresh'): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = tokenType === 'access' ? ACCESS_TOKEN_COOKIE_NAME : REFRESH_TOKEN_COOKIE_NAME;

  cookieStore.delete(cookieName);
}

/**
 * Build Set-Cookie header for token (for direct header manipulation if needed)
 */
export function buildSetCookieHeader(
  tokenName: string,
  tokenValue: string,
  maxAge: number
): string {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;

  const domainPart = cookieDomain && cookieDomain !== 'localhost' ? `; Domain=${cookieDomain}` : '';
  const securePart = isProd ? '; Secure' : '';

  const value = tokenValue ? encodeURIComponent(tokenValue) : '';
  const expires = maxAge > 0
    ? new Date(Date.now() + maxAge * 1000).toUTCString()
    : new Date(0).toUTCString();

  return `${tokenName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Expires=${expires}${securePart}${domainPart}`;
}

/**
 * Decode JWT payload without verification
 * Full signature verification happens in middleware
 * @param token JWT token
 * @returns Decoded payload or null
 */
export function decodeJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return payload;
  } catch (error) {
    console.error('[Session] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract claims from JWT
 * @param token JWT token
 * @returns Claims object or null
 */
export function extractJWTClaims(token: string): {
  userId?: string;
  tenantId?: string;
  email?: string;
  exp?: number;
} | null {
  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.sub, // Supabase uses 'sub' for user ID
    email: payload.email,
    exp: payload.exp,
    tenantId: payload.tenant_id, // Custom claim if set during signup
  };
}

/**
 * Check if JWT is expired
 * @param expiresAt Expiration timestamp in seconds
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false;
  return expiresAt * 1000 < Date.now();
}

/**
 * Get session from both cookies
 * @returns Session object with tokens or null
 */
export async function getSessionFromCookies(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
} | null> {
  const accessToken = await getAccessTokenCookie();
  const refreshToken = await getRefreshTokenCookie();

  if (!accessToken && !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Verify JWT payload structure and expiration
 * Full signature verification should happen in middleware using JWKS
 * @param token JWT token
 * @returns true if structurally valid and not expired
 */
export function isTokenValid(token: string): boolean {
  const claims = extractJWTClaims(token);

  if (!claims || !claims.userId) {
    return false;
  }

  if (isTokenExpired(claims.exp)) {
    return false;
  }

  return true;
}

/**
 * Get token from Authorization header
 * Extracts JWT from "Bearer {token}" format
 * @param authHeader Authorization header value
 * @returns Token or null
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7);
}

export default {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  clearSessionCookies,
  clearTokenCookie,
  buildSetCookieHeader,
  decodeJWT,
  extractJWTClaims,
  isTokenExpired,
  getSessionFromCookies,
  isTokenValid,
  getTokenFromHeader,
};

