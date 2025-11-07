import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { getStores, getStoreManagers } from "./actions";
import { StoreList } from "./store-list";
import { StoreDialog } from "./store-dialog";
import { redirect } from "next/navigation";


export default async function ManageStoresPage() {
    const user = await getCurrentUser();
    if (!user) {
      redirect('/login'); // Or to an error page
    }
    const permissions = await getUserPermissions(user.id);
    if (!permissions.includes('manage-stores')) {
      redirect('/dashboard/store');
    }

    const [stores, storeManagers] = await Promise.all([
        getStores(),
        getStoreManagers()
    ]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Stores</h1>
                    <p className="text-muted-foreground">Add, edit, and manage all your retail store locations.</p>
                </div>
                <StoreDialog mode="add" storeManagers={storeManagers} />
            </div>
            
            <StoreList initialStores={stores} storeManagers={storeManagers} />
            
        </div>
    )
}

\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n
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
