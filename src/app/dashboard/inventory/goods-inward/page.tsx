

import { GoodsInwardClient } from './client';
import { getProducts } from '../data';
import { getUser, getSubordinates, getUserPermissions } from '@/lib/firebase/rbac';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { MOCK_ORGANIZATION_ID } from '@/lib/firebase/firestore';
import type { UserContext } from '@/lib/firebase/types';

export default async function GoodsInwardPage() {
    const user = await getCurrentUser();
    let products: import('@/lib/firebase/types').Product[] = [];
    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id),
        ]);
        const userContext: UserContext = { user, permissions, subordinates, orgId: user.orgId || MOCK_ORGANIZATION_ID };
        products = await getProducts(userContext);
    }
    
    return (
        <GoodsInwardClient products={products} />
    );
}

    
