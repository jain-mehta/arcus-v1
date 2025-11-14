

import { getStoreShipments } from './actions';
import { ProductReceivingClient } from './client';
import { getStores } from '../manage/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { getUserPermissions } from '@/lib/auth';


export default async function ProductReceivingPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>User not found.</div>;
  }
  
  const permissions = await getUserPermissions(user.id);
  const isAdmin = permissions.includes('manage-stores');

  // If user is not an admin and doesn't have a storeId, they can't access this page.
  if (!isAdmin && !(user as any).storeId) {
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
  const storeIdForShipments = isAdmin ? ((allStores as any)[0]?.id || '') : (user as any).storeId;
  
  const shipmentsResult = storeIdForShipments ? await getStoreShipments(storeIdForShipments) : { success: true, data: [] };
  const shipments = shipmentsResult.success ? shipmentsResult.data || [] : [];
  
  return (
    <ProductReceivingClient 
        initialShipments={shipments as any}
        isAdmin={isAdmin}
        allStores={allStores as any}
        userStoreId={(user as any).storeId || ''}
    />
  );
}


import { getSupabaseServerClient } from '@/lib/supabase/client';
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
