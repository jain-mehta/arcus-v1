

import { ProductTable } from "@/components/feature/product-table";
import { Boxes, Trash2, AlertTriangle } from "lucide-react";
import { getProducts } from '../data';
import { deleteAllProducts, addProduct, updateProduct, deleteProduct, simulateSale } from "../actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { revalidatePath } from "next/cache";


async function DeleteAllProductsButton({ disabled }: { disabled: boolean }) {
    async function deleteAll() {
        'use server';
        const user = await getCurrentUser();
        if(!user) return;
        // The server action `deleteAllProducts` builds its own user context,
        // so we don't need to construct or pass one here.
        await deleteAllProducts();
        revalidatePath('/dashboard/inventory/product-master');
    }

    return (
        <form action={deleteAll}>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={disabled}>
                        <Trash2 /> Delete All
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" /> Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible. All products and their associated inventory data will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            type="submit"
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            Delete All Products
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
    )
}

export default async function ProductMasterPage() {
    const user = await getCurrentUser();
    let products: Product[] = [];

    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id),
        ]);

        const userContext: UserContext = {
            user,
            permissions,
            subordinates,
            orgId: user.orgId,
        };
        
        products = await getProducts(userContext);
    }
    

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Boxes className="h-7 w-7" />
                        <h1 className="text-3xl font-bold tracking-tight">Product Master</h1>
                    </div>
                    <p className="text-muted-foreground">Define, organize, and manage all products in your inventory.</p>
                </div>
                 <DeleteAllProductsButton disabled={products.length === 0} />
            </div>
            
            <ProductTable 
                products={products}
                stores={[]} 
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
