
import { GoodsInwardClient } from './client';
import { getProducts } from '../data';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { getUserPermissions } from '@/lib/auth';
import { getSubordinates } from '@/lib/rbac';
type UserContext = {
    user: any;
    permissions: string[];
    subordinates: any[];
    orgId: string;
};

export default async function GoodsInwardPage() {
    const user = await getCurrentUser();
    let products: any[] = [];

    if (user) {
        const [permissionsData, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id, user.orgId || ''),
        ]);
        const permissions: string[] = Array.isArray(permissionsData)
            ? permissionsData
            : Object.keys(permissionsData).map(String);
        const userContext: UserContext = { user, permissions, subordinates, orgId: user.orgId || '' };
        products = await getProducts(userContext);
    }

    return (
        <GoodsInwardClient products={products} />
    );
}
