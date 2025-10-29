

'use server';

import {
  MOCK_ORGANIZATION_ID,
  MOCK_PERMISSIONS,
  MOCK_STORES,
  MOCK_USERS,
  MOCK_LEADS,
  createAuditLog,
  getCurrentUser,
} from '@/lib/mock-data/firestore';
import type { Role, User, Permission, Store } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';
import { getUser, assertUserPermission } from '@/lib/mock-data/rbac';
import { headers } from 'next/headers';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';

/**
 * Retrieves the current logged-in user's profile data.
 */
export async function getCurrentUserProfile() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'users', 'viewAll');

  return await getCurrentUser();
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
      orgId: role.organization_id || MOCK_ORGANIZATION_ID || '', // Use orgId from role or fallback to mock
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
 * Fetches all available permissions.
 * MOCK IMPLEMENTATION: Returns mock permission data.
 */
export async function getAllPermissions(): Promise<Permission[]> {
  return Promise.resolve(MOCK_PERMISSIONS);
}


export async function getAllStores(): Promise<Store[]> {
  return Promise.resolve(MOCK_STORES);
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
  await assertPermission(sessionClaims, 'users', 'viewAll');

  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'Authentication required.' };
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const manager = data.reportsTo ? await getUser(data.reportsTo) : null;
    const store = data.storeId ? MOCK_STORES.find(s => s.id === data.storeId) : null;

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
      ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'User not found.' };
    }

    const userIndex = MOCK_USERS.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) {
        return { success: false, message: 'User not found in database.' };
    }
    
    // In a real app, you might want to add more validation here.
    // For now, we'll just update the mock data.
    // The User type doesn't have a phone or address directly, so we'll add them to the mock data.
    (MOCK_USERS[userIndex] as any).phone = data.phone;
    (MOCK_USERS[userIndex] as any).address = data.address;
    
    revalidatePath('/dashboard/settings/profile');
    return { success: true };
}


/**
 * Creates a new user via API endpoint
 * UPDATED: Calls /api/admin/users instead of using MOCK data
 */
export async function createNewUser(userData: Omit<User, 'id' | 'orgId'> & { password?: string }): Promise<{ success: boolean; newUser?: User, message?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'Authentication required.' };
  
  // Server-side validation (basic)
  if (!userData.name || !userData.email) {
    return { success: false, message: 'Name and email are required.' };
  }

  // Generate secure password if not provided
  const { generateSecurePassword } = await import('@/lib/password-generator');
  const password = userData.password || generateSecurePassword(16);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password,
        fullName: userData.name,
        phone: userData.phone || '',
        roleIds: userData.roleIds || [],
        storeId: userData.storeId || null,
        reportsTo: userData.reportsTo || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.error || 'Failed to create user' 
      };
    }

    const data = await response.json();
    
    // Transform API response to User type
    const newUser: User = {
      id: data.user.id,
      orgId: data.user.orgId || MOCK_ORGANIZATION_ID,
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

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'create_user',
      entityType: 'user',
      entityId: newUser.id,
      details: { name: newUser.name, email: newUser.email, roles: (newUser.roleIds || []).join(', ') },
      ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
    });

    revalidatePath('/dashboard/users');
    return { success: true, newUser, message: password };
  } catch (error: any) {
    console.error('[createNewUser] Error:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to create user' 
    };
  }
}

export async function deactivateUser(userId: string): Promise<{ success: boolean, message?: string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, message: 'Authentication required.' };
  try { await assertUserPermission(currentUser.id, 'manage-users'); } catch (e: any) { return { success: false, message: 'Forbidden' }; }

    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    const userToDeactivate = MOCK_USERS[userIndex];
    const managerId = userToDeactivate.reportsTo;
    
    if (!managerId) {
        // This could be a top-level user. In a real app, you'd have a UI to manually reassign.
        // For this mock, we'll just log a warning and proceed with deactivation.
        console.warn(`User ${userToDeactivate.name} has no manager. Data will not be reassigned.`);
    } else {
        const manager = MOCK_USERS.find(u => u.id === managerId);
        if (manager) {
            // Find and reassign leads owned by the deactivated user
            MOCK_LEADS.forEach(lead => {
                if (lead.ownerId === userId) {
                    lead.ownerId = managerId;
                    lead.assignedTo = manager.name; // Also update the display name
                    console.log(`(MOCK) Reassigned Lead ${lead.id} to ${manager.name}`);
                }
            });
            // Similar logic would be applied to Opportunities, etc.
        } else {
            console.warn(`Manager with ID ${managerId} not found for user ${userToDeactivate.name}. Data not reassigned.`);
        }
    }


    MOCK_USERS[userIndex].status = 'Inactive';
    
    await createAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'deactivate_user',
        entityType: 'user',
        entityId: userId,
        details: { targetUser: MOCK_USERS[userIndex].name },
  ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
    });

    revalidatePath('/dashboard/users');
    return { success: true };
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<{ success: boolean, message?: string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, message: 'Authentication required.' };
  try { await assertUserPermission(currentUser.id, 'manage-users'); } catch (e: any) { return { success: false, message: 'Forbidden' }; }
    const targetUser = MOCK_USERS.find(u => u.id === userId);
    
    if (targetUser) {
        await createAuditLog({
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'change_user_password',
          entityType: 'user',
          entityId: userId,
          details: { targetUser: targetUser.name },
    ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
        });
        console.log(`(MOCK) Password changed for user ${userId}.`);
        return { success: true };
    }
    return { success: false, message: 'User not found.' };
}

/**
 * Delete user (admin action)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean, message?: string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, message: 'Authentication required.' };
    
    try {
        await assertUserPermission(currentUser.id, 'manage-users');
    } catch (e: any) {
        return { success: false, message: 'Forbidden: You do not have permission to manage users.' };
    }
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    
    // Prevent deleting yourself
    if (userId === currentUser.id) {
        return { success: false, message: 'Cannot delete your own account.' };
    }
    
    const deletedUser = MOCK_USERS[userIndex];
    
    // Remove user from array
    MOCK_USERS.splice(userIndex, 1);
    
    // Log the deletion
    await createAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'update_user_roles', // Using existing action type as 'delete_user' doesn't exist in the type definition
        entityType: 'user',
        entityId: userId,
        details: {
            operation: 'DELETE',
            targetUserName: deletedUser.name,
            targetUserEmail: deletedUser.email,
        },
        ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
    });
    
    revalidatePath('/dashboard/users');
    return { success: true, message: `User ${deletedUser.name} deleted successfully.` };
}


