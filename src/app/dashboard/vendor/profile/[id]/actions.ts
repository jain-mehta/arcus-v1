
'use server';

import { MOCK_COMMUNICATION_LOGS, MOCK_USERS, MOCK_VENDORS } from '@/lib/mock-data/firestore';
import { getUser } from '@/lib/mock-data/rbac';
import type { CommunicationLog, Vendor, User } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../sales/actions';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

async function _getCurrentUserId(): Promise<string> {
    const user = await getCurrentUser();
    return user?.id || 'user-admin';
}

export async function getVendor(id: string): Promise<Vendor | null> {
    return MOCK_VENDORS.find(v => v.id === id) || null;
}

export async function getStoreManagers(): Promise<User[]> {
    // This is incorrectly named, but keeping it to avoid breaking other components for now.
    // It should fetch users with manager roles.
    return MOCK_USERS.filter(u => u.roleIds.includes('regional-head') || u.roleIds.includes('admin'));
}

export async function addCommunicationLog(log: Omit<CommunicationLog, 'id' | 'user' | 'date'>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const user = await getUser(await _getCurrentUserId());
  const newLog = {
    id: `log-${Date.now()}`,
    user: user?.name || 'System',
    date: new Date().toISOString(),
    ...log
  };
  MOCK_COMMUNICATION_LOGS.push(newLog);
  revalidatePath(`/dashboard/vendor/profile/${log.vendorId}`);
  return { success: true, newLog };
}

export async function deactivateVendor(id: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

   const index = MOCK_VENDORS.findIndex(v => v.id === id);
  if(index > -1) {
    MOCK_VENDORS[index].status = 'Inactive';
  }
  revalidatePath(`/dashboard/vendor/profile/${id}`);
  revalidatePath('/dashboard/vendor/list');
  return { success: true };
}

export async function deleteVendor(id: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const index = MOCK_VENDORS.findIndex(v => v.id === id);
  if (index > -1) {
    MOCK_VENDORS.splice(index, 1);
  }
  revalidatePath('/dashboard/vendor/list');
  revalidatePath('/dashboard/vendor/profile');
  redirect('/dashboard/vendor/list');
}

export async function updateVendor(id: string, data: Partial<Vendor>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const index = MOCK_VENDORS.findIndex(v => v.id === id);
  if(index > -1) {
      MOCK_VENDORS[index] = { ...MOCK_VENDORS[index], ...data };
  }
  revalidatePath(`/dashboard/vendor/profile/${id}`);
  revalidatePath('/dashboard/vendor/list');
  return { success: true };
}
