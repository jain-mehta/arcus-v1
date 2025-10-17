
'use server';

import { MOCK_STORES, MOCK_USERS, MOCK_ORDERS, getCurrentUser } from '@/lib/firebase/firestore';
import { assertUserPermission } from '@/lib/firebase/rbac';
import { getProducts as getProductsFromDb } from '../../inventory/data';
import type { Store, User, Product } from '@/lib/firebase/types';
import { revalidatePath } from 'next/cache';

export async function getStores(): Promise<Store[]> {
  // In a real app, this would fetch from Firestore
  return Promise.resolve(MOCK_STORES);
}

export async function addStore(data: Omit<Store, 'id'>): Promise<{ success: boolean; newStoreId?: string, message?: string }> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthenticated');
    await assertUserPermission(user.id, 'manage-stores');

    const newStore: Store = {
        id: `store-${Date.now()}`,
        ...data,
    };
    MOCK_STORES.push(newStore);
    revalidatePath('/dashboard/store/manage');
    return { success: true, newStoreId: newStore.id };
}

export async function updateStore(id: string, data: Partial<Omit<Store, 'id'>>): Promise<{ success: boolean; message?: string }> {
    // Handle the master format separately as it's not in the main MOCK_STORES array
    if (id === 'master-format') {
        console.log("Updating Master Format (simulated):", data);
        // In a real app, you would update the master format document in a separate collection.
        return { success: true };
    }

    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthenticated');
    await assertUserPermission(user.id, 'manage-stores');

    const index = MOCK_STORES.findIndex(s => s.id === id);
    if (index === -1) {
        return { success: false, message: 'Store not found.' };
    }
    MOCK_STORES[index] = { ...MOCK_STORES[index], ...data };
    revalidatePath('/dashboard/store/manage');
    revalidatePath(`/dashboard/store/profile/${id}`);
    revalidatePath('/dashboard/store/invoice-format');
    return { success: true };
}

export async function deleteStore(id: string): Promise<{ success: boolean; message?: string }> {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthenticated');
    await assertUserPermission(user.id, 'manage-stores');

    const index = MOCK_STORES.findIndex(s => s.id === id);
    if (index === -1) {
        return { success: false, message: 'Store not found.' };
    }
    MOCK_STORES.splice(index, 1);
    revalidatePath('/dashboard/store/manage');
    return { success: true };
}

export async function getStoreManagers(): Promise<User[]> {
    // In a real app, this would be a Firestore query for users with a specific role.
    return MOCK_USERS.filter(u => u.roleIds.includes('shop-owner'));
}

export async function getStoreDetails(storeId: string): Promise<{ store: Store | null, inventory: Product[], kpis: any, topProducts: any[] }> {
    const store = MOCK_STORES.find(s => s.id === storeId) || null;
    if (!store) {
        return { store: null, inventory: [], kpis: {}, topProducts: [] };
    }

    const allProducts = await getProductsFromDb();
    const storeInventory = allProducts.filter(p => p.inventoryType === 'Store' && p.storeId === storeId);
    
    // Simulate store-specific orders. In a real app, orders would have a storeId.
    const storeOrders = MOCK_ORDERS.filter(o => o.storeId === storeId);
    
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

    