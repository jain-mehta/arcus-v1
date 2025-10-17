
'use server';

import {
  MOCK_ORGANIZATION_ID,
  MOCK_PERMISSIONS,
  getPermissionTemplates as getPermissionTemplatesFromDb,
} from '@/lib/firebase/firestore';
import type { Role, Permission } from '@/lib/firebase/types';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all roles for a given organization.
 * Fetches from Firestore roles collection (defined in Roles & Hierarchy).
 */
export async function getAllRoles(): Promise<Role[]> {
  const { getSessionClaims } = await import('@/lib/session');
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims?.orgId) {
    console.warn('[Roles] No session or orgId, returning empty roles');
    return [];
  }

  const { getFirebaseAdmin } = await import('@/lib/firebase/firebase-admin');
  const { db } = getFirebaseAdmin();
  
  const rolesSnapshot = await db
    .collection('roles')
    .where('orgId', '==', sessionClaims.orgId)
    .get();

  const roles = rolesSnapshot.docs.map(doc => {
    const data = doc.data();
    // Serialize Firestore Timestamps to ISO strings for Client Components
    const serialized: any = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
    return serialized as Role;
  });

  return roles;
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
 * Creates a new role in Firestore.
 */
export async function createNewRole(roleData: Omit<Role, 'id' | 'orgId'>): Promise<{ success: boolean; newRole?: Role, message?: string }> {
  const { getSessionClaims } = await import('@/lib/session');
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims?.orgId) {
    return { success: false, message: 'No organization context found.' };
  }

  const { getFirebaseAdmin } = await import('@/lib/firebase/firebase-admin');
  const { db } = getFirebaseAdmin();
  
  const roleRef = db.collection('roles').doc();
  
  const newRole: Role = {
    id: roleRef.id,
    orgId: sessionClaims.orgId,
    ...roleData
  };
  
  await roleRef.set(newRole);
  
  revalidatePath('/dashboard/users/roles');
  return { success: true, newRole };
}

/**
 * Updates an existing role in Firestore.
 */
export async function updateRole(roleId: string, roleData: Partial<Omit<Role, 'id' | 'orgId'>>): Promise<{ success: boolean; updatedRole?: Role, message?: string }> {
  const { getSessionClaims } = await import('@/lib/session');
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims?.orgId) {
    return { success: false, message: 'No organization context found.' };
  }

  const { getFirebaseAdmin } = await import('@/lib/firebase/firebase-admin');
  const { db } = getFirebaseAdmin();
  
  const roleRef = db.collection('roles').doc(roleId);
  const roleDoc = await roleRef.get();
  
  if (!roleDoc.exists) {
    return { success: false, message: 'Role not found.' };
  }
  
  // Verify role belongs to the user's org
  const existingRole = roleDoc.data() as Role;
  if (existingRole.orgId !== sessionClaims.orgId) {
    return { success: false, message: 'Permission denied.' };
  }
  
  await roleRef.update(roleData);
  
  const updatedRole: Role = {
    ...existingRole,
    ...roleData,
    id: roleId,
  };
  
  revalidatePath('/dashboard/users/roles');
  return { success: true, updatedRole };
}
