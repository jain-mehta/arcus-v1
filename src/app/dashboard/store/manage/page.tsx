import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { getStores, getStoreManagers } from "./actions";
import { StoreList } from "./store-list";
import { StoreDialog } from "./store-dialog";
import { getCurrentUser } from "@/lib/firebase/firestore";
import { getUserPermissions } from "@/lib/firebase/rbac";
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