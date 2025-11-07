

import { ProductTable } from "@/components/feature/product-table";
import { getProducts } from '../data';
import { Warehouse } from 'lucide-react';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { addProduct, updateProduct, deleteProduct, simulateSale } from "../actions";

export default async function FactoryInventoryPage() {
    // Correctly build the user context to enforce RBAC
    const user = await getCurrentUser();
    let factoryProducts: import('@/lib/mock-data/types').Product[] = [];

    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id),
        ]);

        const userContext: UserContext = {
            user,
            permissions,
            subordinates,
            orgId: user.orgId || '',
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
                stores={[]}
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

    




\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n

// TODO: Replace with actual database queries
// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
