

'use server';

import { getProducts as getProductsFromDb, getCurrentUser } from '@/lib/firebase/firestore';
import type { Product, UserContext, User } from '@/lib/firebase/types';
import { getUser, getUserPermissions, getSubordinates } from '@/lib/firebase/rbac';

async function getCurrentUserId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user ? user.id : null;
}

async function buildUserContext(userId: string | null): Promise<UserContext | null> {
    if (!userId) {
        return null;
    }
    const [user, permissions, subordinates] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
        getSubordinates(userId)
    ]);

    if (!user) {
        // Instead of throwing an error, we return null to be handled gracefully by the caller.
        console.warn("buildUserContext: User not found, returning null context.");
        return null;
    }

    return {
        user,
        permissions,
        subordinates,
        orgId: user.orgId,
    };
}


/**
 * Fetches products from the database based on the user's context and permissions.
 * This is a server-only function and should not be imported into client components.
 */
export async function getProducts(userContext?: UserContext | null): Promise<Product[]> {
    if (!userContext) {
        const userId = await getCurrentUserId();
        userContext = await buildUserContext(userId);
    }
    
    if (!userContext) {
        // If there's still no user context, return no products. This is the critical fix.
        return [];
    }
    
    // The actual filtering logic is now handled in the firestore mock layer,
    // but we pass the context to prepare for a real database.
    return getProductsFromDb(userContext);
}


export async function getInventoryDashboardData() {
    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    // If there's no user or they don't have permission, return empty/default data.
    if (!userContext || (!userContext.permissions.includes('view-all-inventory') && !userContext.permissions.includes('view-store-inventory'))) {
        return {
            totalProducts: 0,
            totalStockValue: 0,
            lowStockItemsCount: 0,
            inventoryByCategory: [],
            recentStockAlerts: [],
        };
    }
    
    const products = await getProducts(userContext);

    const totalProducts = products.length;
    const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    
    const lowStockItems = products.filter(p => p.reorderLevel && p.quantity <= p.reorderLevel);
    const lowStockItemsCount = lowStockItems.length;

    const inventoryByCategory = products.reduce((acc, p) => {
        let categoryEntry = acc.find(entry => entry.category === p.category);
        if (!categoryEntry) {
            categoryEntry = { category: p.category, Factory: 0, Store: 0 };
            acc.push(categoryEntry);
        }
        categoryEntry[p.inventoryType] += p.quantity;
        return acc;
    }, [] as { category: string; Factory: number; Store: number }[]);

    const recentStockAlerts = lowStockItems.slice(0, 5);

    return {
        totalProducts,
        totalStockValue,
        lowStockItemsCount,
        inventoryByCategory,
        recentStockAlerts,
    };
}

