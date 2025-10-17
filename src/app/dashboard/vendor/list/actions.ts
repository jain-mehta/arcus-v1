
'use server';

import { 
    getVendors as getVendorsFromDb,
    approveVendor as approveVendorInDb,
    rejectVendor as rejectVendorInDb,
    deleteVendor as deleteVendorInDb,
} from '@/lib/firebase/firestore';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getVendors() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    return getVendorsFromDb();
}

export async function approveVendor(id: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const result = await approveVendorInDb(id);
  if (result.success) {
    revalidatePath('/dashboard/vendor/list');
    revalidatePath(`/dashboard/vendor/profile/${id}`);
  }
  return result;
}

export async function rejectVendor(id: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const result = await rejectVendorInDb(id);
   if (result.success) {
    revalidatePath('/dashboard/vendor/list');
    revalidatePath(`/dashboard/vendor/profile/${id}`);
  }
  return result;
}

export async function deleteVendor(id: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const result = await deleteVendorInDb(id);
  if (result.success) {
    revalidatePath('/dashboard/vendor/list');
  }
  return result;
}
