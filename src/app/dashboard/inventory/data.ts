import { getSupabaseServerClient } from '@/lib/supabase/client';\n

'use server';

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



\n\n
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
