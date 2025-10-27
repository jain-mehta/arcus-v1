

'use server';

import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_STORES, getCurrentUser } from '@/lib/mock-data/firestore';
import { getUserPermissions } from '@/lib/mock-data/rbac';
import type { Product } from '@/lib/mock-data/types';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';
import { startOfDay, subDays, startOfToday, endOfDay, isWithinInterval } from 'date-fns';

export type AdminDashboardFilter = 'last24hours' | 'last48hours' | 'last7days' | 'last30days' | 'last90days' | 'allTime';

export async function getAdminStoreDashboardData(duration: AdminDashboardFilter = 'allTime') {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

  
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

  const salesInDuration = MOCK_ORDERS.filter(o => 
      o.status === 'Delivered' && new Date(o.orderDate) >= startDate
  );

  const totalStores = MOCK_STORES.length;
  const totalSales = salesInDuration.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalItemsSold = salesInDuration.reduce((sum, order) => sum + order.lineItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const salesByStoreMap = new Map<string, number>();
  salesInDuration.forEach(order => {
    const storeId = order.storeId || MOCK_STORES[0].id;
    const currentSales = salesByStoreMap.get(storeId) || 0;
    salesByStoreMap.set(storeId, currentSales + order.totalAmount);
  });
  
  const salesByStore = MOCK_STORES.map(store => ({
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
              const productDetails = MOCK_PRODUCTS.find(p => p.sku.startsWith(baseSku));
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


  return {
    totalStores,
    totalSales,
    totalItemsSold,
    salesByStore,
    topPerformingStore,
    topProducts,
    allStores: MOCK_STORES,
  };
}


export async function getManagerStoreDashboardData(storeId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

    const store = MOCK_STORES.find(s => s.id === storeId);
    if (!store) {
        throw new Error("Store not found");
    }

    // --- KPIs for today ---
    const todayStart = startOfToday();
    const todayEnd = endOfDay(new Date());

    const salesToday = MOCK_ORDERS.filter(o => {
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
        
        const salesOnDate = MOCK_ORDERS.filter(o => {
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


export async function getInitialStoreDashboardData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

    const user = await getCurrentUser();
    if (!user) {
        return null;
    }
    const permissions = await getUserPermissions(user.id);
    const isAdmin = permissions.includes('manage-stores');

    if (isAdmin) {
        const adminDashboardData = await getAdminStoreDashboardData('allTime');
        return { isAdmin: true, adminDashboardData, managerDashboardData: null };
    } else {
        if (!user.storeId) {
             return { isAdmin: false, adminDashboardData: null, managerDashboardData: { storeName: 'N/A', totalSales: 0, totalItemsSold: 0, topProducts: [], salesTrend: [] } };
        }
        const managerDashboardData = await getManagerStoreDashboardData(user.storeId);
        return { isAdmin: false, adminDashboardData: null, managerDashboardData };
    }
}


