

import { Package } from "lucide-react";
import { ProductTable } from "@/components/feature/product-table";
import { getProducts } from '../../inventory/data';
import { getCurrentUser } from '@/lib/firebase/firestore';
import { getUserPermissions, getSubordinates } from '@/lib/firebase/rbac';
import type { UserContext } from '@/lib/firebase/types';
import { MOCK_ORGANIZATION_ID, MOCK_STORES } from '@/lib/firebase/firestore';
import { addProduct, updateProduct, deleteProduct, simulateSale } from "../../inventory/actions";

export default async function StoreInventoryPage() {
    const user = await getCurrentUser();
    if (!user) {
        return <div>User not found</div>;
    }

    const [permissions, subordinates] = await Promise.all([
        getUserPermissions(user.id),
        getSubordinates(user.id),
    ]);

    const userContext: UserContext = {
        user,
        permissions,
        subordinates,
        orgId: user.orgId || MOCK_ORGANIZATION_ID,
    };
    
    // This will fetch only products relevant to the user's store
    const storeProducts = await getProducts(userContext);

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2">
                    <Package className="h-7 w-7" />
                    <h1 className="text-3xl font-bold tracking-tight">Store Inventory</h1>
                </div>
                <p className="text-muted-foreground">Manage the inventory for your assigned store.</p>
            </div>
            
            <ProductTable 
                products={storeProducts}
                stores={MOCK_STORES}
                inventoryType="Store" 
                showTypeColumn={false} 
                showSimulateSale={true}
                addProduct={addProduct}
                updateProduct={updateProduct}
                deleteProduct={deleteProduct}
                simulateSale={simulateSale}
            />
        </div>
    );
}

    
