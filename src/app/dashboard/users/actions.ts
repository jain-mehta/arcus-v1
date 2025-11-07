

'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';
import { addRoleForUser } from '@/lib/casbinClient';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  roleIds: string[];
  orgId?: string;
  phone?: string;
  storeId?: string | null;
  reportsTo?: string | null;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  customPermissions?: string[];
  createdBy?: string;
  mustChangePassword?: boolean;
}

export interface Role {
  id: string;
  orgId?: string;
  name: string;
  permissions?: any;
  reportsToRoleId?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface Store {
  id: string;
  name: string;
  location?: string;
}

// Helper function to get real user from session
async function getCurrentUserFromSession(): Promise<User | null> {
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
    email: userData.email,
    name: userData.full_name || userData.email.split('@')[0],
    roleIds: [], // Will be populated separately if needed
    orgId: sessionClaims.orgId,
    phone: userData.phone || '',
    isActive: userData.is_active !== false,
    status: userData.is_active ? 'Active' : 'Inactive',
    createdAt: userData.created_at,
  };
}

// Audit logging function
async function createAuditLog(logData: {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string;
}) {
  try {
    console.log('[Audit]', logData.action, 'by', logData.userName, 'on', logData.entityType, logData.entityId);
    // TODO: Implement real audit logging to database
  } catch (error) {
    console.error('[Audit] Failed to log:', error);
  }
}

/**
 * Retrieves the current logged-in user's profile data.
 */
export async function getCurrentUserProfile() {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) {
    throw new Error('Unauthorized');
  }
  await assertPermission(sessionClaims, 'users', 'view');

  return await getCurrentUserFromSession();
}


/**
 * Fetches all users for a given organization.
 * UPDATED: Fetches directly from Supabase
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    // Get session for auth
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
      console.warn('[getAllUsers] No session, returning empty users');
      return [];
    }

    // Check permission
    try {
      await assertPermission(sessionClaims, 'users', 'view');
    } catch (permError) {
      console.error('[getAllUsers] Permission denied:', permError);
      return [];
    }

    // Import Supabase client dynamically to avoid edge runtime issues
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      console.error('[getAllUsers] Supabase client not available');
      return [];
    }

    // Fetch all user roles (no organization_id column in user_roles table)
    const { data: userRolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role_id');

    if (rolesError) {
      console.error('[getAllUsers] Error fetching user roles:', rolesError);
      return [];
    }

    // Get unique user IDs 
    const userIds = [...new Set(userRolesData?.map(ur => ur.user_id) || [])];

    if (userIds.length === 0) {
      console.log('[getAllUsers] No users found in organization');
      return [];
    }

    // Fetch users from database
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[getAllUsers] Error fetching users:', usersError);
      return [];
    }

    // Group roles by user
    const rolesByUser = (userRolesData || []).reduce((acc: any, ur: any) => {
      if (!acc[ur.user_id]) acc[ur.user_id] = [];
      acc[ur.user_id].push(ur.role_id);
      return acc;
    }, {});

    // Transform to User type
    const users: User[] = (usersData || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.full_name || user.email.split('@')[0],
      roleIds: rolesByUser[user.id] || [],
      orgId: sessionClaims.orgId,
      phone: user.phone || '',
      storeId: user.store_id || null,
      reportsTo: user.reports_to || null,
      isActive: user.is_active !== undefined ? user.is_active : true,
      status: user.is_active ? 'Active' : 'Inactive',
      createdAt: user.created_at || new Date().toISOString(),
    }));

    return users;
  } catch (error) {
    console.error('[getAllUsers] Error fetching users:', error);
    return [];
  }
}

/**
 * Fetches all roles for a given organization.
 * Fetches from Supabase roles table.
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      console.warn('[getAllRoles] No session, returning empty roles');
      return [];
    }

    // Check permission to view roles
    try {
      await assertPermission(sessionClaims, 'settings', 'manageRoles');
    } catch {
      // Try fallback permission
      try {
        await assertPermission(sessionClaims, 'users', 'create');
      } catch {
        // Admin bypass
        if (sessionClaims.email !== 'admin@arcus.local') {
          console.warn('[getAllRoles] Permission denied');
          return [];
        }
      }
    }

    // Use Supabase client directly (server-side, no auth header needed)
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      console.error('[getAllRoles] Supabase client not available');
      return [];
    }

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[getAllRoles] Error fetching roles:', error);
      return [];
    }

    // Transform to Role type
    const transformedRoles: Role[] = (roles || []).map((role: any) => ({
      id: role.id,
      orgId: role.organization_id || sessionClaims.orgId || '',
      name: role.name,
      permissions: role.permissions || {},
      reportsToRoleId: role.reports_to_role_id,
    }));

    console.log('[getAllRoles] Fetched', transformedRoles.length, 'roles');
    return transformedRoles;
  } catch (error) {
    console.error('[getAllRoles] Error:', error);
    return [];
  }
}

/**
 * Fetches all available permissions from the system.
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) return [];

    await assertPermission(sessionClaims, 'settings', 'manageRoles');

    // For now, return a basic set of permissions
    // TODO: Implement dynamic permission system
    return [
      { id: 'users:view', name: 'View Users', description: 'Can view user lists' },
      { id: 'users:create', name: 'Create Users', description: 'Can create new users' },
      { id: 'users:edit', name: 'Edit Users', description: 'Can edit user details' },
      { id: 'users:delete', name: 'Delete Users', description: 'Can delete users' },
      { id: 'roles:manage', name: 'Manage Roles', description: 'Can manage user roles' },
      { id: 'sales:view', name: 'View Sales', description: 'Can view sales data' },
      { id: 'inventory:manage', name: 'Manage Inventory', description: 'Can manage inventory' },
      { id: 'reports:view', name: 'View Reports', description: 'Can view reports' },
    ];
  } catch (error) {
    console.error('[getAllPermissions] Error:', error);
    return [];
  }
}

export async function getAllStores(): Promise<Store[]> {
  try {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) return [];

    // Import Supabase client
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error('[getAllStores] Supabase client not available');
      return [];
    }

    // Fetch stores from database
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[getAllStores] Error fetching stores:', error);
      return [];
    }

    console.log('[getAllStores] Fetched', stores?.length || 0, 'stores from Supabase');

    return (stores || []).map((store: any) => ({
      id: store.id,
      name: store.name,
      location: store.location || store.address || '',
    }));
  } catch (error) {
    console.error('[getAllStores] Error:', error);
    return [];
  }
}

/**
 * Updates a user's assigned roles and other details.
 * UPDATED: Calls API endpoint instead of MOCK data
 */
export async function updateUser(userId: string, data: Partial<User>) {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) {
    throw new Error('Unauthorized');
  }
  await assertPermission(sessionClaims, 'users', 'edit');

  const currentUser = await getCurrentUserFromSession();
  if (!currentUser) return { success: false, message: 'Authentication required.' };

  try {
    // Get session cookie to forward to API route
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session') || cookieStore.get('__supabase_access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward session cookie for authentication
    if (sessionCookie) {
      headers['Cookie'] = `${sessionCookie.name}=${sessionCookie.value}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/users`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        userId,
        fullName: data.name,
        phone: data.phone,
        storeId: data.storeId,
        reportsTo: data.reportsTo,
        isActive: data.status === 'Active',
        roleIds: data.roleIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.error || 'Failed to update user'
      };
    }

    // Fetch role names for audit log
    const allRoles = await getAllRoles();
    const roleNames = (data.roleIds || []).map(roleId => allRoles.find(r => r.id === roleId)?.name || roleId);

    // Get manager info if needed
    let manager = null;
    if (data.reportsTo) {
      const { getSupabaseServerClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data: managerData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', data.reportsTo)
          .single();
        manager = managerData ? { name: managerData.full_name } : null;
      }
    }

    // Get store info if needed
    let store = null;
    if (data.storeId) {
      const allStores = await getAllStores();
      store = allStores.find(s => s.id === data.storeId) || null;
    }

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'update_user_roles',
      entityType: 'user',
      entityId: userId,
      details: {
        targetUser: data.name || 'User',
        roles: roleNames.join(', ') || 'None',
        reportsTo: manager?.name || 'None',
        store: store?.name || 'None',
        customPermissions: data.customPermissions?.length ? `${data.customPermissions.length} custom permissions` : 'None',
      },
      ipAddress: 'localhost',
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error: any) {
    console.error('[updateUser] Error:', error);
    return { success: false, message: error.message || 'Failed to update user' };
  }
}


/**
 * Updates the currently logged-in user's profile information.
 */
export async function updateCurrentUserProfile(data: { phone: string; address?: string }): Promise<{ success: boolean, message?: string }> {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return { success: false, message: 'Database connection failed.' };
    }

    const { error } = await supabase
      .from('users')
      .update({
        phone: data.phone,
        address: data.address || null,
      })
      .eq('id', sessionClaims.uid);

    if (error) {
      console.error('[updateCurrentUserProfile] Error:', error);
      return { success: false, message: 'Failed to update profile.' };
    }

    revalidatePath('/dashboard/settings/profile');
    return { success: true };
  } catch (error) {
    console.error('[updateCurrentUserProfile] Error:', error);
    return { success: false, message: 'Failed to update profile.' };
  }
}


/**
 * Creates a new user via API endpoint
 * UPDATED: Calls /api/admin/users instead of using MOCK data
 */
export async function createNewUser(
  userData: Omit<User, 'id' | 'orgId'> & { password?: string }
): Promise<{ success: boolean; newUser?: User; message?: string }> {
  const currentUser = await getCurrentUserFromSession();
  if (!currentUser) return { success: false, message: 'Authentication required.' };

  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) return { success: false, message: 'Authentication required.' };

  await assertPermission(sessionClaims, 'users', 'create');

  // Basic validation
  if (!userData.name || !userData.email) {
    return { success: false, message: 'Name and email are required.' };
  }

  // Ensure roleIds is not empty - get available roles if needed
  let finalRoleIds = userData.roleIds;
  if (!finalRoleIds || finalRoleIds.length === 0) {
    try {
      const roles = await getAllRoles();
      if (roles.length > 0) {
        // Use the last role (typically Employee) as default
        finalRoleIds = [roles[roles.length - 1].id];
        console.log('[CREATE_USER] Using default role:', roles[roles.length - 1].name);
      } else {
        return { success: false, message: 'No roles available. Please create roles first.' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to get available roles.' };
    }
  }

  // Generate secure password if not provided
  const { generateSecurePassword } = await import('@/lib/password-generator');
  const password = userData.password || generateSecurePassword(16);

  try {
    // Get session cookie to forward to API route
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session') || cookieStore.get('__supabase_access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward session cookie for authentication
    if (sessionCookie) {
      headers['Cookie'] = `${sessionCookie.name}=${sessionCookie.value}`;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/users`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userData.email,
          password,
          fullName: userData.name,
          phone: userData.phone || '',
          roleIds: finalRoleIds,
          storeId: userData.storeId || null,
          reportsTo: userData.reportsTo || null,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.error || 'Failed to create user',
      };
    }

    const data = await response.json();

    const newUser: User = {
      id: data.user.id,
      orgId: data.user.orgId || sessionClaims.orgId || '',
      name: data.user.fullName,
      email: data.user.email,
      phone: data.user.phone || '',
      roleIds: data.user.roles?.map((r: any) => r.id) || [],
      customPermissions: [],
      reportsTo: data.user.reportsTo || null,
      storeId: data.user.storeId || null,
      status: data.user.isActive ? 'Active' : 'Inactive',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      mustChangePassword: true,
    } as User;

    // ✅ Casbin RBAC integration
    try {
      const orgId = newUser.orgId;
      const userId = newUser.id;

      if (Array.isArray(newUser.roleIds) && newUser.roleIds.length > 0) {
        for (const roleId of newUser.roleIds) {
          const added = await addRoleForUser({
            userId,
            role: roleId,
            organizationId: orgId|| '',
          });
          console.log(
            `[Casbin] Role '${roleId}' ${added ? 'assigned' : 'skipped'} to user ${userId} in org ${orgId}`
          );
        }
      } else {
        console.log('[Casbin] No roles found for new user; skipping role assignment.');
      }
    } catch (casbinError) {
      console.warn('[Casbin] Failed to assign roles for new user:', casbinError);
    }

    // ✅ Audit log
    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'create_user',
      entityType: 'user',
      entityId: newUser.id,
      details: {
        name: newUser.name,
        email: newUser.email,
        roles: (newUser.roleIds || []).join(', '),
      },
      ipAddress: 'localhost',
    });

    revalidatePath('/dashboard/users');
    return { success: true, newUser, message: password };
  } catch (error: any) {
    console.error('[createNewUser] Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create user',
    };
  }
}


export async function deactivateUser(userId: string): Promise<{ success: boolean, message?: string }> {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) return { success: false, message: 'Authentication required.' };

  try {
    await assertPermission(sessionClaims, 'users', 'edit');
  } catch (e: any) {
    return { success: false, message: 'Forbidden' };
  }

  const currentUser = await getCurrentUserFromSession();
  if (!currentUser) return { success: false, message: 'Authentication required.' };

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    // Get user to deactivate
    const { data: userToDeactivate, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userToDeactivate) {
      return { success: false, message: 'User not found.' };
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (updateError) {
      console.error('[deactivateUser] Error:', updateError);
      return { success: false, message: 'Failed to deactivate user.' };
    }

    // TODO: Implement data reassignment logic for leads, opportunities, etc.
    console.log(`User ${userToDeactivate.full_name} deactivated successfully`);

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'deactivate_user',
      entityType: 'user',
      entityId: userId,
      details: { targetUser: userToDeactivate.full_name },
      ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('[deactivateUser] Error:', error);
    return { success: false, message: 'Failed to deactivate user.' };
  }
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<{ success: boolean, message?: string }> {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) return { success: false, message: 'Authentication required.' };

  try {
    await assertPermission(sessionClaims, 'users', 'edit');
  } catch (e: any) {
    return { success: false, message: 'Forbidden' };
  }

  const currentUser = await getCurrentUserFromSession();
  if (!currentUser) return { success: false, message: 'Authentication required.' };

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (fetchError || !targetUser) {
      return { success: false, message: 'User not found.' };
    }

    // TODO: Implement password change via Supabase Admin API
    console.log(`Password change requested for user ${userId}`);

    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'change_user_password',
      entityType: 'user',
      entityId: userId,
      details: { targetUser: targetUser.full_name },
      ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
    });

    return { success: true };
  } catch (error) {
    console.error('[changeUserPassword] Error:', error);
    return { success: false, message: 'Failed to change password.' };
  }
}

/**
 * Delete user (admin action)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean, message?: string }> {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) return { success: false, message: 'Authentication required.' };

  try {
    await assertPermission(sessionClaims, 'users', 'delete');
  } catch (e: any) {
    return { success: false, message: 'Forbidden: You do not have permission to delete users.' };
  }

  const currentUser = await getCurrentUserFromSession();
  if (!currentUser) return { success: false, message: 'Authentication required.' };

  // Prevent deleting yourself
  if (userId === currentUser.id) {
    return { success: false, message: 'Cannot delete your own account.' };
  }

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database connection failed.' };

    // Get user to delete
    const { data: userToDelete, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userToDelete) {
      return { success: false, message: 'User not found.' };
    }

    // Mark user as deleted instead of actually deleting
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[deleteUser] Error:', updateError);
      return { success: false, message: 'Failed to delete user.' };
    }

    // Log the deletion
    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'delete_user',
      entityType: 'user',
      entityId: userId,
      details: {
        operation: 'DELETE',
        targetUserName: userToDelete.full_name,
        targetUserEmail: userToDelete.email,
      },
      ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
    });

    revalidatePath('/dashboard/users');
    return { success: true, message: `User ${userToDelete.full_name} deleted successfully.` };
  } catch (error) {
    console.error('[deleteUser] Error:', error);
    return { success: false, message: 'Failed to delete user.' };
  }
}


