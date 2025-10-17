
'use server';

import { getProducts as getProductsFromDb } from '../data';
import type { Product, UserContext } from '@/lib/firebase/types';
import { getUser, getSubordinates, getUserPermissions } from '@/lib/firebase/rbac';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { MOCK_ORGANIZATION_ID } from '@/lib/firebase/firestore';

/**
 * Fetches all products to be used for generating QR codes.
 * This is currently a pass-through to the main getProducts action.
 * In a real application, this could be extended to only fetch products
 * that have been updated recently or meet certain criteria.
 */
export async function getProductsForBarcode(): Promise<Product[]> {
    const user = await getCurrentUser();
    if (!user) return [];
    
    const [permissions, subordinates] = await Promise.all([
        getUserPermissions(user.id),
        getSubordinates(user.id),
    ]);
    const userContext: UserContext = { user, permissions, subordinates, orgId: user.orgId || MOCK_ORGANIZATION_ID };
    
    return getProductsFromDb(userContext);
}

    
