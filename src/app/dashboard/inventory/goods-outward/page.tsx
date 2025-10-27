

import { GoodsOutwardClient } from './client';
import { getProducts } from '../data';
import { getUser, getSubordinates, getUserPermissions } from '@/lib/mock-data/rbac';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { MOCK_ORGANIZATION_ID } from '@/lib/mock-data/firestore';
import type { UserContext, Product } from '@/lib/mock-data/types';

export default async function GoodsOutwardPage() {
    const user = await getCurrentUser();
    let products: Product[] = [];
    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id),
        ]);
        const userContext: UserContext = { user, permissions, subordinates, orgId: user.orgId || MOCK_ORGANIZATION_ID };
        products = await getProducts(userContext);
    }
    
    return (
        <GoodsOutwardClient products={products} />
    );
}

    


