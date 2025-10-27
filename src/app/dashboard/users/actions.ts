

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
 * MOCK IMPLEMENTATION: Returns mock user data.
 */
export async function getAllUsers(): Promise<User[]> {
  // In a real app, this would be a Firestore query.
  // We simulate a delay to show loading states.
  await new Promise(resolve => setTimeout(resolve, 500));
  return Promise.resolve(MOCK_USERS);
}

/**
 * Fetches all roles for a given organization.
 * Fetches from Supabase roles table.
 */
export async function getAllRoles(): Promise<Role[]> {
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims) {
    console.warn('[getAllRoles] No session, returning empty roles');
    return [];
  }

  // TODO: Implement Supabase query
  // For now returning empty to unblock build
  return [];
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
 */
export async function updateUser(userId: string, data: Partial<Omit<User, 'id' | 'name' | 'email' | 'orgId'>>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'users', 'viewAll');

  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'Authentication required.' };
  try { await assertUserPermission(currentUser.id, 'manage-users'); } catch (e: any) { return { success: false, message: 'Forbidden' }; }
  
  const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    const targetUser = MOCK_USERS[userIndex];
    MOCK_USERS[userIndex] = { ...targetUser, ...data };
    
    // Fetch role names from Firestore instead of MOCK_ROLES
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
          targetUser: targetUser.name, 
          roles: roleNames.join(', ') || 'None', 
          reportsTo: manager?.name || 'None',
          store: store?.name || 'None',
          customPermissions: data.customPermissions?.length ? `${data.customPermissions.length} custom permissions` : 'None',
      },
  ipAddress: (await headers()).get('x-forwarded-for') ?? 'Unknown',
    });

    revalidatePath('/dashboard/users');
    return { success: true, updatedUser: MOCK_USERS[userIndex] };
  }
  return { success: false, message: 'User not found.' };
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


export async function createNewUser(userData: Omit<User, 'id' | 'orgId'>): Promise<{ success: boolean; newUser?: User, message?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'Authentication required.' };
  try { await assertUserPermission(currentUser.id, 'manage-users'); } catch (e: any) { return { success: false, message: 'Forbidden' }; }
  // Server-side validation (basic)
  if (!userData.name || !userData.email) return { success: false, message: 'Name and email are required.' };

  const tempPassword = `Tmp!${Math.random().toString(36).slice(2,10)}${Date.now().toString().slice(-3)}`;

  const newUser: User = {
    id: `user-${Date.now()}`,
    orgId: MOCK_ORGANIZATION_ID,
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    roleIds: userData.roleIds || [],
    customPermissions: userData.customPermissions || [],
    reportsTo: userData.reportsTo || null,
    storeId: userData.storeId || null,
    status: userData.status || 'Active',
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    mustChangePassword: true,
  } as User;

  MOCK_USERS.push(newUser);

  // Optional: create a session for the new user (mock)
  try {
  const { createSession } = await import('@/lib/mock-sessions');
  await createSession(newUser.id, { userAgent: 'initial-invite' });
  } catch (e) {
    console.warn('Failed to create session for new user (mock):', e);
  }

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
  return { success: true, newUser: { ...newUser }, message: tempPassword };
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


