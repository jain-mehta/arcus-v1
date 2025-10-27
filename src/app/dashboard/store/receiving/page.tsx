

import { getStoreShipments } from './actions';
import { ProductReceivingClient } from './client';
import { getCurrentUser } from '@/lib/mock-data/firestore';
import { getStores } from '../manage/actions';
import { getUserPermissions } from '@/lib/mock-data/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';


export default async function ProductReceivingPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>User not found.</div>;
  }
  
  const permissions = await getUserPermissions(user.id);
  const isAdmin = permissions.includes('manage-stores');

  // If user is not an admin and doesn't have a storeId, they can't access this page.
  if (!isAdmin && !user.storeId) {
    return (
        <div className="flex justify-center items-start pt-16 h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    <Box className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">Product Receiving</CardTitle>
                <CardDescription>No Store Assigned</CardDescription>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">
                    This page is only available to users assigned to a specific store. An administrator must assign your user to a store to enable access.
                </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  // Fetch all stores for the admin dropdown, or just the user's store
  const allStores = await getStores();
  const storeIdForShipments = isAdmin ? (allStores[0]?.id || '') : user.storeId;
  
  const shipments = storeIdForShipments ? await getStoreShipments(storeIdForShipments) : [];
  
  return (
    <ProductReceivingClient 
        initialShipments={shipments} 
        isAdmin={isAdmin}
        allStores={allStores}
        userStoreId={user.storeId || ''}
    />
  );
}


