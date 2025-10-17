
'use server';

import { getVendor as getVendorFromDb, getStoreManagers as getStoreManagersFromDb, updateVendor as updateVendorInDb } from '../actions';
import type { Vendor } from '@/lib/firebase/types';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getVendor(storeId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    return getVendorFromDb(storeId);
}

export async function updateVendor(id: string, data: Partial<Vendor>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    return updateVendorInDb(id, data);
}

export async function getStoreManagers() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    return getStoreManagersFromDb();
}
