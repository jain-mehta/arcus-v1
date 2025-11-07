
'use server';

import { getProducts as getProductsFromDb } from '../../inventory/data';
import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getStores(): Promise<Store[]> {
  // In a real app, this would fetch from Firestore
  return Promise.resolve([]);
}

export async function addStore(data: Omit<Store, 'id'>): Promise<ActionResponse<{ newStoreId: string }>> {
    const authCheck = await checkActionPermission('store', 'manage', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {

    const newStore: Store = {
        id: `store-${Date.now()}`,
        ...data,
    };
        [].push(newStore);
        await logUserAction(user, 'create', 'store', newStore.id, data);
        revalidatePath('/dashboard/store/manage');
        return createSuccessResponse({ newStoreId: newStore.id }, 'Store created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create store: ${error.message}`);
    }
}

export async function updateStore(id: string, data: Partial<Omit<Store, 'id'>>): Promise<ActionResponse> {
    // Handle the master format separately as it's not in the main [] array
    if (id === 'master-format') {
        console.log("Updating Master Format (simulated):", data);
        // In a real app, you would update the master format document in a separate collection.
        return createSuccessResponse(null, 'Master format updated successfully');
    }

    const authCheck = await checkActionPermission('store', 'manage', 'edit');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {

        const index = [].findIndex(s => s.id === id);
        if (index === -1) {
            return createErrorResponse('Store not found');
        }
        [][index] = { ...[][index], ...data };
        await logUserAction(user, 'update', 'store', id, data);
        revalidatePath('/dashboard/store/manage');
        revalidatePath(`/dashboard/store/profile/${id}`);
        revalidatePath('/dashboard/store/invoice-format');
        return createSuccessResponse(null, 'Store updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update store: ${error.message}`);
    }
}

export async function deleteStore(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('store', 'manage', 'delete');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const index = [].findIndex(s => s.id === id);
        if (index === -1) {
            return createErrorResponse('Store not found');
        }
        [].splice(index, 1);
        await logUserAction(user, 'delete', 'store', id);
        revalidatePath('/dashboard/store/manage');
        return createSuccessResponse(null, 'Store deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete store: ${error.message}`);
    }
}

export async function getStoreManagers(): Promise<User[]> {
    // In a real app, this would be a Firestore query for users with a specific role.
    return [].filter(u => u.roleIds.includes('shop-owner'));
}

export async function getStoreDetails(storeId: string): Promise<{ store: Store | null, inventory: Product[], kpis: any, topProducts: any[] }> {
    const store = [].find(s => s.id === storeId) || null;
    if (!store) {
        return { store: null, inventory: [], kpis: {}, topProducts: [] };
    }

    const allProducts = await getProductsFromDb();
    const storeInventory = allProducts.filter(p => p.inventoryType === 'Store' && p.storeId === storeId);
    
    // Simulate store-specific orders. In a real app, orders would have a storeId.
    const storeOrders = [].filter(o => o.storeId === storeId);
    
    const totalSales = storeOrders.reduce((acc, order) => acc + order.totalAmount, 0);
    
    const productSales: Record<string, number> = {};
    storeOrders.forEach(order => {
        order.lineItems.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
    });

    const topSellingProducts = Object.entries(productSales)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, unitsSold]) => ({ name, unitsSold }));

    const topSellingProduct = topSellingProducts[0] ? `${topSellingProducts[0].name} (${topSellingProducts[0].unitsSold} units)` : 'N/A';

    const kpis = {
        totalSales,
        totalStockUnits: storeInventory.reduce((acc, p) => acc + p.quantity, 0),
        totalStockValue: storeInventory.reduce((acc, p) => acc + (p.quantity * p.price), 0),
        topSellingProduct: topSellingProduct,
    };

    return { store, inventory: storeInventory, kpis, topProducts: topSellingProducts };
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
