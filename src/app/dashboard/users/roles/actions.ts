
'use server';

import {
  MOCK_ORGANIZATION_ID,
  MOCK_PERMISSIONS,
  getPermissionTemplates as getPermissionTemplatesFromDb,
} from '@/lib/mock-data/firestore';
import type { Role, Permission } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all roles for a given organization.
 * Fetches from Supabase roles table.
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    const { getSessionClaims } = await import('@/lib/session');
    const { assertPermission } = await import('@/lib/rbac');
    const sessionClaims = await getSessionClaims();
    
    if (!sessionClaims) {
      console.warn('[Roles] No session, returning empty roles');
      return [];
    }

    // Check permission
    try {
      await assertPermission(sessionClaims, 'settings', 'manageRoles');
    } catch {
      // Try fallback permission
      try {
        await assertPermission(sessionClaims, 'users', 'create');
      } catch {
        // Admin bypass
        if (sessionClaims.email !== 'admin@arcus.local') {
          console.warn('[Roles] Permission denied');
          return [];
        }
      }
    }

    // Use Supabase client directly
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      console.error('[Roles] Supabase client not available');
      return [];
    }

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[Roles] Error fetching roles:', error);
      return [];
    }
    
    // Transform to Role type
    const transformedRoles: Role[] = (roles || []).map((role: any) => ({
      id: role.id,
      orgId: role.organization_id || MOCK_ORGANIZATION_ID || '',
      name: role.name,
      permissions: role.permissions || {},
      reportsToRoleId: role.reports_to_role_id,
    }));

    console.log('[Roles] Fetched', transformedRoles.length, 'roles');
    return transformedRoles;
  } catch (error) {
    console.error('[Roles] Error:', error);
    return [];
  }
}

/**
 * Fetches all available permissions.
 * MOCK IMPLEMENTATION: Returns mock permission data.
 */
export async function getAllPermissions(): Promise<Permission[]> {
  return Promise.resolve(MOCK_PERMISSIONS);
}

/**
 * Fetches all permission templates.
 */
export async function getPermissionTemplates(): Promise<any[]> {
    return await getPermissionTemplatesFromDb();
}


/**
 * Creates a new role.
 */
export async function createNewRole(roleData: Omit<Role, 'id' | 'orgId'>): Promise<{ success: boolean; newRole?: Role, message?: string }> {
  const { getSessionClaims } = await import('@/lib/session');
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims) {
    return { success: false, message: 'No organization context found.' };
  }

  // TODO: Implement Supabase insert
  return { success: false, message: 'Feature coming soon' };
}

/**
 * Updates an existing role.
 */
export async function updateRole(roleId: string, roleData: Partial<Omit<Role, 'id' | 'orgId'>>): Promise<{ success: boolean; updatedRole?: Role, message?: string }> {
  const { getSessionClaims } = await import('@/lib/session');
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims) {
    return { success: false, message: 'No organization context found.' };
  }

  // TODO: Implement Supabase update
  return { success: false, message: 'Feature coming soon' };
}


