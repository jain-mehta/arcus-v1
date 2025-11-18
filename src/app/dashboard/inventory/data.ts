'use server';

import { getSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUserFromSession } from '@/lib/session';
import { getSessionClaims } from '@/lib/session';
import type { UserContext } from '@/lib/types';

// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  org_id?: string;
  role_id?: string;
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
  org_id?: string;
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
  org_id?: string;
  quantity?: number;
  reorderLevel?: number;
  inventoryType?: 'Factory' | 'Store';
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
  org_id?: string;
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
  org_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  org_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get current user from session
 */
async function getCurrentUser(): Promise<User | null> {
  try {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) return null;

    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionClaims.uid)
      .single();

    if (error || !user) {
      console.warn('[getCurrentUser] User not found:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
async function getUser(userId: string): Promise<User | null> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.warn('[getUser] User not found:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('[getUser] Error:', error);
    return null;
  }
}

/**
 * Get user permissions
 */
async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const user = await getUser(userId);
    if (!user) return [];

    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    // Get role and its permissions
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('permissions')
      .eq('id', user.role_id)
      .single();

    if (roleError || !role) {
      console.warn('[getUserPermissions] Role not found:', roleError);
      return [];
    }

    // permissions could be an array or a string (JSON)
    const permissions = Array.isArray(role.permissions) 
      ? role.permissions 
      : (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : []);
    
    return permissions || [];
  } catch (error) {
    console.error('[getUserPermissions] Error:', error);
    return [];
  }
}

/**
 * Get subordinates of a user
 */
async function getSubordinates(userId: string): Promise<User[]> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    const { data: subordinates, error } = await supabase
      .from('users')
      .select('*')
      .eq('manager_id', userId);

    if (error || !subordinates) {
      console.warn('[getSubordinates] Subordinates not found:', error);
      return [];
    }

    return subordinates || [];
  } catch (error) {
    console.error('[getSubordinates] Error:', error);
    return [];
  }
}

/**
 * Get products from database
 */
async function getProductsFromDb(userContext: UserContext): Promise<Product[]> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    // Admin sees all products, others see only their org's products
    let query = supabase.from('products').select('*');

    if (!userContext.user.role_id?.includes('admin')) {
      query = query.eq('org_id', userContext.orgId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.warn('[getProductsFromDb] Products not found:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('[getProductsFromDb] Error:', error);
    return [];
  }
}

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
        orgId: user.org_id || 'default-org',
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
    const permissions = userContext?.permissions;
    const permissionsArray = Array.isArray(permissions) ? permissions : [];
    
    if (!userContext || (!permissionsArray.includes('view-all-inventory') && !permissionsArray.includes('view-store-inventory'))) {
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
    const totalStockValue = products.reduce((acc, p) => acc + ((p.price ?? 0) * (p.quantity ?? 0)), 0);
    
    const lowStockItems = products.filter(p => (typeof p.reorderLevel === 'number') && ((p.quantity ?? 0) <= p.reorderLevel));
    const lowStockItemsCount = lowStockItems.length;

    const inventoryByCategory = products.reduce((acc, p) => {
        let categoryEntry = acc.find(entry => entry.category === p.category);
        if (!categoryEntry) {
            categoryEntry = { category: p.category ?? 'Uncategorized', Factory: 0, Store: 0 };
            acc.push(categoryEntry);
        }
        const invType: 'Factory' | 'Store' = p.inventoryType ?? 'Store';
        categoryEntry[invType] += (p.quantity ?? 0);
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




// Database types for Supabase tables
