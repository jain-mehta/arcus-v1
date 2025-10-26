/**
 * Permission Middleware
 * Validate JWT and check permissions for API routes
 * 
 * Usage in route handlers:
 *   import { checkAuth, checkPermission } from '@/lib/auth-middleware';
 *   
 *   export async function POST(req: NextRequest) {
 *     const user = await checkAuth(req);
 *     if (!user) return unauthorized();
 *     
 *     const allowed = await checkPermission(user.id, 'edit', 'lead');
 *     if (!allowed) return forbidden();
 *     
 *     // ... process request
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSession } from './session';
import { evaluatePolicy } from './policyAdapter';

export interface AuthUser {
  uid: string;
  email?: string;
  tenant_id?: string;
  role?: string;
}

/**
 * Authenticate request and get user from Firebase session
 */
export async function checkAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    const decodedClaims = await getCurrentUserFromSession();

    if (!decodedClaims) {
      return null;
    }

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      tenant_id: decodedClaims.tenant_id,
      role: decodedClaims.role,
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Check if user has permission for action
 */
export async function checkPermission(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  tenantId?: string
): Promise<boolean> {
  try {
    const allowed = await evaluatePolicy({
      principal: userId,
      action,
      resource: resourceId ? `${resource}:${resourceId}` : resource,
      tenant_id: tenantId,
    });

    return allowed;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Middleware helper: return 401 Unauthorized
 */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Middleware helper: return 403 Forbidden
 */
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Middleware helper: return 400 Bad Request
 */
export function badRequest(message = 'Bad Request', details?: any) {
  return NextResponse.json(
    { error: message, details },
    { status: 400 }
  );
}

/**
 * Middleware helper: return 500 Server Error
 */
export function serverError(message = 'Server Error', details?: any) {
  return NextResponse.json(
    { error: message, details },
    { status: 500 }
  );
}

/**
 * Require auth middleware
 * Attach to API route to require authentication
 */
export async function requireAuth(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require permission middleware
 * Attach to API route to require specific permission
 */
export async function requirePermission(
  req: NextRequest,
  action: string,
  resource: string
) {
  const user = await checkAuth(req);
  if (!user) {
    throw new Error('Unauthorized');
  }

  const allowed = await checkPermission(user.uid, action, resource, undefined, user.tenant_id);
  if (!allowed) {
    throw new Error('Forbidden');
  }

  return user;
}

export default {
  checkAuth,
  checkPermission,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
  requireAuth,
  requirePermission,
};
