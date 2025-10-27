
'use server';

import {
  MOCK_MATERIAL_MAPPINGS,
  getVendors,
  createPurchaseOrderInDb,
} from '@/lib/mock-data/firestore';
import { getCurrentUser as getCurrentUserFromDb } from '@/lib/mock-data/firestore';
import { assertUserPermission } from '@/lib/mock-data/rbac';
import type { MaterialMapping, PurchaseOrder } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getMaterialMappings(vendorId: string): Promise<MaterialMapping[]> {
  return MOCK_MATERIAL_MAPPINGS.filter((m) => m.vendorId === vendorId);
}

export async function createPurchaseOrder(data: any) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'supply', 'pos');

  const currentUser = await getCurrentUserFromDb();
  await assertUserPermission(currentUser?.id || '', 'manage-purchase-orders');

  // Try to persist to Firestore (server-side). If admin isn't available we fallback in the helper.
  const orgId = currentUser?.orgId || 'bobs-org';
  const result = await createPurchaseOrderInDb({ ...data, orgId }, { user: currentUser as any, permissions: [], subordinates: [], orgId });
  revalidatePath('/dashboard/vendor/purchase-orders');
  return result;
}


