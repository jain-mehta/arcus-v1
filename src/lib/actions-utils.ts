/**
 * Utility functions for server actions
 * Standardizes permission checking and user authentication across all dashboard actions
 */

import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';

export interface ActionUser {
  id: string;
  name: string;
  email: string;
  orgId?: string;
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentUserFromSession(): Promise<ActionUser | null> {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) return null;

  const { getSupabaseServerClient } = await import('@/lib/supabase/client');
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', sessionClaims.uid)
    .single();

  if (error || !userData) return null;

  return {
    id: userData.id,
    name: userData.full_name || userData.email.split('@')[0],
    email: userData.email,
    orgId: sessionClaims.orgId,
  };
}

/**
 * Standard authentication and permission check for actions
 */
export async function checkActionPermission(
  module: string,
  submodule?: string,
  action: string = 'view'
): Promise<{ user: ActionUser; sessionClaims: any } | { error: string }> {

  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) {
    return { error: 'Unauthorized: No session found' };
  }

  try {
    await assertPermission(sessionClaims, module, submodule, action);
  } catch (error: any) {
    return { error: `Permission denied: ${error.message}` };
  }

  const user = await getCurrentUserFromSession();
  if (!user) {
    return { error: 'Authentication required' };
  }

  return { user, sessionClaims };
}

/**
 * Standard response format for actions
 */
export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data?: T, message?: string): ActionResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: string): ActionResponse {
  return {
    success: false,
    error,
  };
}

/**
 * Audit logging utility
 */
export async function logUserAction(
  user: ActionUser,
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) {
  try {
    console.log('[Audit]', {
      userId: user.id,
      userName: user.name,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
    // TODO: Store in audit log table
  } catch (error) {
    console.error('[Audit] Failed to log action:', error);
  }
}