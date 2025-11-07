

'use server';

import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';
import { startOfDay, subDays, startOfToday, endOfDay, isWithinInterval } from 'date-fns';

export type AdminDashboardFilter = 'last24hours' | 'last48hours' | 'last7days' | 'last30days' | 'last90days' | 'allTime';

export async function getAdminStoreDashboardData(duration: AdminDashboardFilter = 'allTime'): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('store', 'dashboard', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {

  
  const now = new Date();
  let startDate = new Date(0); // A long time ago

  if (duration === 'last24hours') {
      startDate = new Date(new Date().setHours(now.getHours() - 24));
  } else if (duration === 'last48hours') {
      startDate = new Date(new Date().setHours(now.getHours() - 48));
  } else if (duration === 'last7days') {
      startDate = new Date(new Date().setDate(now.getDate() - 7));
  } else if (duration === 'last30days') {
      startDate = new Date(new Date().setMonth(now.getMonth() - 1));
  } else if (duration === 'last90days') {
    startDate = new Date(new Date().setDate(now.getDate() - 90));
  }

  const salesInDuration = [].filter(o => 
      o.status === 'Delivered' && new Date(o.orderDate) >= startDate
  );

  const totalStores = [].length;
  const totalSales = salesInDuration.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalItemsSold = salesInDuration.reduce((sum, order) => sum + order.lineItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const salesByStoreMap = new Map<string, number>();
  salesInDuration.forEach(order => {
    const storeId = order.storeId || [][0].id;
    const currentSales = salesByStoreMap.get(storeId) || 0;
    salesByStoreMap.set(storeId, currentSales + order.totalAmount);
  });
  
  const salesByStore = [].map(store => ({
      id: store.id,
      name: store.name,
      sales: salesByStoreMap.get(store.id) || 0,
  })).sort((a,b) => b.sales - a.sales);

  const topPerformingStore = salesByStore[0]?.name || 'N/A';

  const productSalesMap = new Map<string, { 
      name: string; 
      brand: string;
      series: Product['series'];
      totalUnitsSold: number; 
      salesByStore: Record<string, number> 
  }>();
  
  salesInDuration.forEach(order => {
      order.lineItems.forEach(item => {
          // Use a consistent key, like the base SKU, to group products
          const baseSku = item.sku.split('-S')[0];
          let productEntry = productSalesMap.get(baseSku);
          
          if (!productEntry) {
              const productDetails = [].find(p => p.sku.startsWith(baseSku));
              // Clean the name by removing "- Store"
              const cleanedName = item.name.replace(/ - Store$/, '');

              productEntry = {
                  name: cleanedName,
                  brand: productDetails?.brand || 'Bobs',
                  series: productDetails?.series || 'Solo',
                  totalUnitsSold: 0,
                  salesByStore: {},
              };
          }
          
          productEntry.totalUnitsSold += item.quantity;
          if(order.storeId) {
            productEntry.salesByStore[order.storeId] = (productEntry.salesByStore[order.storeId] || 0) + item.quantity;
          }
          productSalesMap.set(baseSku, productEntry);
      });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)
    .slice(0, 5);


        const data = {
            totalStores,
            totalSales,
            totalItemsSold,
            salesByStore,
            topPerformingStore,
            topProducts,
            allStores: [],
        };

        await logUserAction(user, 'view', 'store_dashboard', undefined, { duration, totalSales });
        return createSuccessResponse(data, 'Store dashboard data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to load store dashboard: ${error.message}`);
    }
}


export async function getManagerStoreDashboardData(storeId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('store', 'dashboard', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {

    const store = [].find(s => s.id === storeId);
    if (!store) {
        throw new Error("Store not found");
    }

    // --- KPIs for today ---
    const todayStart = startOfToday();
    const todayEnd = endOfDay(new Date());

    const salesToday = [].filter(o => {
        const orderDate = new Date(o.orderDate);
        return (
            o.storeId === storeId &&
            o.status === 'Delivered' &&
            isWithinInterval(orderDate, { start: todayStart, end: todayEnd })
        );
    });

    const totalSales = salesToday.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItemsSold = salesToday.reduce((sum, order) => sum + order.lineItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    const productSalesMap = new Map<string, number>();
    salesToday.forEach(order => {
        order.lineItems.forEach(item => {
            productSalesMap.set(item.name, (productSalesMap.get(item.name) || 0) + item.quantity);
        });
    });

    const topProducts = Array.from(productSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, unitsSold]) => ({ name, unitsSold }));
    
    // --- Sales Trend for last 7 days ---
    const salesTrend = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), i);
        const dateStart = startOfDay(date);
        const dateEnd = endOfDay(date);
        
        const salesOnDate = [].filter(o => {
            const orderDate = new Date(o.orderDate);
            return (
                o.storeId === storeId &&
                o.status === 'Delivered' &&
                isWithinInterval(orderDate, { start: dateStart, end: dateEnd })
            )
        }).reduce((sum, order) => sum + order.totalAmount, 0);

        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: salesOnDate,
        };
    }).reverse();

    return {
        storeName: store.name,
        totalSales,
        totalItemsSold,
        topProducts,
        salesTrend,
    };
}


export async function getInitialStoreDashboardData(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('store', 'dashboard', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Check if user has admin permissions for store management
        const adminCheck = await checkActionPermission('store', 'manage', 'view');
        const isAdmin = !('error' in adminCheck);

        if (isAdmin) {
            const adminDashboardData = await getAdminStoreDashboardData('allTime');
            await logUserAction(user, 'view', 'admin_store_dashboard');
            return createSuccessResponse({
                isAdmin: true,
                adminDashboardData: 'success' in adminDashboardData ? adminDashboardData.data : null,
                managerDashboardData: null
            }, 'Admin store dashboard data retrieved successfully');
        } else {
            if (!user.storeId) {
                return createSuccessResponse({
                    isAdmin: false,
                    adminDashboardData: null,
                    managerDashboardData: { storeName: 'N/A', totalSales: 0, totalItemsSold: 0, topProducts: [], salesTrend: [] }
                }, 'Manager dashboard data retrieved (no store assigned)');
            }
            const managerDashboardData = await getManagerStoreDashboardData(user.storeId);
            await logUserAction(user, 'view', 'manager_store_dashboard', user.storeId);
            return createSuccessResponse({
                isAdmin: false,
                adminDashboardData: null,
                managerDashboardData
            }, 'Manager store dashboard data retrieved successfully');
        }
    } catch (error: any) {
        return createErrorResponse(`Failed to get initial store dashboard data: ${error.message}`);
    }
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
