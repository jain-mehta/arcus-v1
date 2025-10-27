/**
 * Session Management Utilities
 * 
 * Provides server-side session cookie management for Supabase Authentication.
 * Sessions are 7 days by default and stored as httpOnly cookies.
 */

import { cookies } from 'next/headers';
import { supabaseClient, getSupabaseServerClient } from './supabase/client';

export const SESSION_COOKIE_NAME = '__session';
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Build a Set-Cookie header string for a session cookie value.
 * If maxAge is 0 this will create a deletion cookie compatible with browsers.
 */
export function buildSessionSetCookieHeader(sessionValue: string, maxAge?: number) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;

  const domainPart = cookieDomain && cookieDomain !== 'localhost' ? `; Domain=${cookieDomain}` : '';
  const securePart = isProd ? '; Secure' : '';

  // URL-encode the value
  const value = sessionValue ? encodeURIComponent(sessionValue) : '';
  const age = typeof maxAge === 'number' ? maxAge : SESSION_COOKIE_MAX_AGE;

  // Set Expires for compatibility and ensure deletion uses an expired date
  const expires = age > 0
    ? new Date(Date.now() + age * 1000).toUTCString()
    : new Date(0).toUTCString(); // Thu, 01 Jan 1970 00:00:00 GMT

  return `${SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}; Expires=${expires}${securePart}${domainPart}`;
}

/**
 * Create a session cookie from Supabase session
 * @param idToken - Supabase JWT token from client
 * @returns Session cookie value
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  // For Supabase, we store the JWT directly
  return idToken;
}

/**
 * Verify and decode a session cookie
 * @param sessionCookie - The session cookie value
 * @returns Decoded token with user claims
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    // Get the session from Supabase
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session) {
      console.error('[Session] Failed to verify session:', error);
      return null;
    }
    
    return {
      uid: session.user.id,
      email: session.user.email,
    };
  } catch (error) {
    console.error('[Session] Failed to verify session cookie:', error);
    return null;
  }
}

/**
 * Set session cookie in response headers
 * @param sessionCookie - The session cookie value to set
 */
export async function setSessionCookie(sessionCookie: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the current session cookie value
 * @returns Session cookie value or null
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  return cookie?.value || null;
}

/**
 * Get the current authenticated user from session
 * @returns User claims or null if not authenticated
 */
export async function getCurrentUserFromSession() {
  const sessionCookie = await getSessionCookie();
  
  if (!sessionCookie) {
    return null;
  }
  
  return verifySessionCookie(sessionCookie);
}

/**
 * Get session claims for RBAC checks
 * Includes uid, email, orgId, roleId, reportsTo
 * @returns Session claims or null
 */
export async function getSessionClaims() {
  const decodedClaims = await getCurrentUserFromSession();
  
  if (!decodedClaims) {
    return null;
  }
  
  try {
    // Fetch additional user data from Supabase
    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
      };
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decodedClaims.uid)
      .single();
    
    if (error || !userData) {
      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
      };
    }
    
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      orgId: userData.org_id,
      roleId: userData.role_ids?.[0],
      reportsTo: userData.reports_to,
    };
  } catch (error) {
    console.error('[Session] Error getting session claims:', error);
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
    };
  }
}
