

import { ProductTable } from "@/components/feature/product-table";
import { Boxes, Trash2, AlertTriangle } from "lucide-react";
import { getProducts } from '../data';
import { deleteAllProducts, addProduct, updateProduct, deleteProduct, simulateSale } from "../actions";
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { getUserPermissions } from '@/lib/auth';
import { getSubordinates } from '@/lib/rbac';
import type { UserContext } from '@/lib/types';

type User = { id: string; orgId?: string; [key: string]: any };
type Product = {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    description?: string;
    stock?: number;
    [key: string]: any;
};
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
            getSubordinates(user.id, user.orgId || ''),
        ]);

        const userContext: UserContext = {
            user,
            permissions: permissions || {},
            subordinates: subordinates || [],
            orgId: user.orgId || '',
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
