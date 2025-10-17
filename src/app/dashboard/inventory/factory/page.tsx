

import { ProductTable } from "@/components/feature/product-table";
import { getProducts } from '../data';
import { Warehouse } from 'lucide-react';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { getUserPermissions, getSubordinates } from '@/lib/firebase/rbac';
import { MOCK_ORGANIZATION_ID, MOCK_STORES } from '@/lib/firebase/firestore';
import type { UserContext } from '@/lib/firebase/types';
import { addProduct, updateProduct, deleteProduct, simulateSale } from "../actions";

export default async function FactoryInventoryPage() {
    // Correctly build the user context to enforce RBAC
    const user = await getCurrentUser();
    let factoryProducts: import('@/lib/firebase/types').Product[] = [];

    if (user) {
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
        
        // Fetch only factory products by passing the user context
        const allProducts = await getProducts(userContext);
        factoryProducts = allProducts.filter(p => p.inventoryType === 'Factory');
    }


    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2">
                    <Warehouse className="h-7 w-7" />
                    <h1 className="text-3xl font-bold tracking-tight">Factory Inventory</h1>
                </div>
                <p className="text-muted-foreground">A real-time overview of raw materials and work-in-progress stock.</p>
            </div>
            
            <ProductTable 
                products={factoryProducts} 
                stores={MOCK_STORES}
                inventoryType="Factory" 
                showTypeColumn={false} 
                showSimulateSale={false}
                addProduct={addProduct}
                updateProduct={updateProduct}
                deleteProduct={deleteProduct}
                simulateSale={simulateSale}
             />
        </div>
    );
}

    


