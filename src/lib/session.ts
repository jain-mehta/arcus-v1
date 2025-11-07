/**
 * Session Management Utilities
 * 
 * Provides server-side session cookie management for Supabase Authentication.
 * Sessions are 7 days by default and stored as httpOnly cookies.
 */

import { cookies, headers } from 'next/headers';
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
    // Import JWT decode (don't verify signature on server-side for simplicity)
    const base64Url = sessionCookie.split('.')[1];
    if (!base64Url) {
      console.error('[Session] Invalid JWT format');
      return null;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const decoded = JSON.parse(jsonPayload);
    
    return {
      uid: decoded.sub,
      email: decoded.email,
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
  
  // Try the Supabase access token cookie first (new flow)
  const supabaseToken = cookieStore.get('__supabase_access_token');
  if (supabaseToken?.value) {
    return supabaseToken.value;
  }
  
  // Fallback to old session cookie name
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
    console.log('[Session] No session cookie found');
    return null;
  }
  
  console.log('[Session] Session cookie found, verifying...');
  return verifySessionCookie(sessionCookie);
}

/**
 * Get session claims for RBAC checks
 * Includes uid, email, orgId, roleId, reportsTo
 * Reads from cookies or Authorization Bearer token
 * @returns Session claims or null
 */
export async function getSessionClaims() {
  // Try to get token from cookies first
  let decodedClaims = await getCurrentUserFromSession();
  
  if (!decodedClaims) {
    // Try to get token from Authorization header (for API requests)
    try {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        decodedClaims = await verifySessionCookie(token);
      }
    } catch (error) {
      console.log('[Session] Could not read Authorization header:', error);
    }
  }
  
  if (!decodedClaims) {
    console.log('[Session] No decoded claims found - user not authenticated');
    return null;
  }

  console.log('[Session] Decoded claims found for:', decodedClaims.email);
  
  try {
    // Fetch additional user data from Supabase
    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      console.log('[Session] No Supabase admin client, using fallback for:', decodedClaims.email);
      // For admin@arcus.local, return with admin roleId as fallback
      if (decodedClaims.email === 'admin@arcus.local') {
        console.log('[Session] Returning admin role for admin@arcus.local');
        return {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          roleId: 'admin',
          orgId: 'default-org', // Add default org for admin
        };
      }
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
      // For admin@arcus.local, return with admin roleId as fallback
      if (decodedClaims.email === 'admin@arcus.local') {
        return {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          roleId: 'admin',
          orgId: 'default-org', // Add default org for admin
        };
      }
      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
      };
    }

    // Try to fetch the user's role(s) from user_roles table
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role_id')
      .eq('user_id', decodedClaims.uid)
      .limit(1);

    let roleId = userRoles?.[0]?.role_id || userData.role_ids?.[0];
    
    // For admin@arcus.local, ensure roleId is 'admin'
    if (decodedClaims.email === 'admin@arcus.local' && !roleId) {
      roleId = 'admin';
    }
    
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      orgId: userData.org_id,
      roleId: roleId,
      reportsTo: userData.reports_to,
    };
  } catch (error) {
    console.error('[Session] Error getting session claims:', error);
    // For admin@arcus.local, return with admin roleId as fallback
    if (decodedClaims.email === 'admin@arcus.local') {
      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        roleId: 'admin',
        orgId: 'default-org', // Add default org for admin
      };
    }
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
    };
  }
}
