
import { GoodsOutwardClient } from './client';
import { getProducts } from '../data';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { getUserPermissions } from '@/lib/auth';
import { getSubordinates } from '@/lib/rbac';

interface UserContext {
    user: any;
    permissions: any;
    subordinates: any[];
    orgId: string;
}

export default async function GoodsOutwardPage() {
    const user = await getCurrentUser();
    let products: any[] = [];

    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id, user.orgId || ''),
        ]);
        const userContext: UserContext = { user, permissions: permissions || {}, subordinates: subordinates || [], orgId: user.orgId || '' };
        products = await getProducts(userContext);
    }

    return (
        <GoodsOutwardClient products={products} />
    );
}
