
'use server';

import { getStores as getStoresFromDb, getStoreManagers as getStoreManagersFromDb, updateStore as updateStoreInDb } from '../../../manage/actions';
import type { Store } from '@/lib/types/domain';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getEditStorePageData(storeId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

    const [stores, managers] = await Promise.all([
        getStoresFromDb(),
        getStoreManagersFromDb()
    ]);
    const store = stores.find((s) => s.id === storeId) || null;
    return { store, managers };
}

export async function updateStore(id: string, data: Partial<Store>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

    return updateStoreInDb(id, data);
}
    
