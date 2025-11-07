
'use server';

import { revalidatePath } from 'next/cache';

// TODO: Replace with actual database queries

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
      orgId: role.organization_id || '' || '',
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


\n\n
// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
