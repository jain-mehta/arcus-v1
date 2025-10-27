
'use server';

import {
  MOCK_STORES,
  MOCK_USERS,
  MOCK_ORDERS,
  getCurrentUser,
  getProducts as getProductsFromDb,
} from '@/lib/mock-data/firestore';
import type { Store, User, Product, Order } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getStore(id: string): Promise<Store | null> {
    return MOCK_STORES.find(s => s.id === id) || null;
}

export async function getStoreManagers(): Promise<User[]> {
    // In a real app, this would be a Firestore query for users with a specific role.
    return MOCK_USERS.filter(u => u.roleIds.includes('shop-owner'));
}


export async function getStoreDetails(storeId: string): Promise<{ 
    store: Store | null, 
    inventory: Product[], 
    kpis: any, 
    topProducts: any[],
    recentSales: Order[],
    manager: User | null,
}> {
    const store = MOCK_STORES.find(s => s.id === storeId) || null;
    if (!store) {
        return { store: null, inventory: [], kpis: {}, topProducts: [], recentSales: [], manager: null };
    }
    
    const manager = store.managerId ? MOCK_USERS.find(u => u.id === store.managerId) || null : null;

    const allProducts = await getProductsFromDb();
    const storeInventory = allProducts.filter(p => p.inventoryType === 'Store' && p.storeId === storeId);
    
    // Simulate store-specific orders. In a real app, orders would have a storeId.
    const storeOrders = MOCK_ORDERS.filter(o => o.storeId === storeId);
    
    const totalSales = storeOrders.reduce((acc, order) => acc + order.totalAmount, 0);
    
    const productSales: Record<string, { units: number, name: string, brand?: string, series?: string }> = {};
    storeOrders.forEach(order => {
        order.lineItems.forEach(item => {
            if (!productSales[item.productId]) {
                const productDetails = allProducts.find(p => p.id === item.productId);
                productSales[item.productId] = {
                    units: 0,
                    name: item.name,
                    brand: productDetails?.brand,
                    series: productDetails?.series,
                };
            }
            productSales[item.productId].units += item.quantity;
        });
    });

    const topSellingProducts = Object.values(productSales)
      .sort((a,b) => b.units - a.units)
      .slice(0, 5)
      .map(p => ({ name: p.name, unitsSold: p.units, brand: p.brand, series: p.series }));

    const topProduct = topSellingProducts[0];
    const topSellingProduct = topProduct
      ? `${topProduct.brand || ''} ${topProduct.series || ''} ${topProduct.name.replace(' - Store', '')}`.trim()
      : 'N/A';

    const kpis = {
        totalSales,
        totalStockUnits: storeInventory.reduce((acc, p) => acc + p.quantity, 0),
        totalStockValue: storeInventory.reduce((acc, p) => acc + (p.quantity * p.price), 0),
        topSellingProduct: topSellingProduct,
    };
    
    const recentSales = storeOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 5);

    return { store, inventory: storeInventory, kpis, topProducts: topSellingProducts, recentSales, manager };
}

export async function updateStore(id: string, data: Partial<Store>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

  const index = MOCK_STORES.findIndex(s => s.id === id);
  if(index > -1) {
      MOCK_STORES[index] = { ...MOCK_STORES[index], ...data };
  }
  revalidatePath(`/dashboard/store/profile/${id}`);
  revalidatePath('/dashboard/store/list');
  return { success: true };
}

    