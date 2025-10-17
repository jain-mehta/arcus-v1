

'use server';

import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_STORES } from '@/lib/firebase/firestore';
import type { Order, Product, Store } from '@/lib/firebase/types';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getStoreReportData(storeIds?: string[], dateRange?: { from?: Date, to?: Date }) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'viewPastBills');

  // In a real app, these would be efficient database queries.
  // Here, we simulate the aggregation from mock data.
  
  const storesToProcess = storeIds && storeIds.length > 0
    ? MOCK_STORES.filter(s => storeIds.includes(s.id))
    : MOCK_STORES;

  const relevantStoreIds = new Set(storesToProcess.map(s => s.id));

  // Filter orders by date range first
  const dateFilteredOrders = MOCK_ORDERS.filter(order => {
    const orderDate = new Date(order.orderDate);
    const fromMatch = !dateRange?.from || orderDate >= dateRange.from;
    const toMatch = !dateRange?.to || orderDate <= dateRange.to;
    return fromMatch && toMatch;
  });

  // Then filter by store
  const allSales = dateFilteredOrders.filter(o => o.status === 'Delivered' && (storeIds && storeIds.length > 0 ? o.storeId && relevantStoreIds.has(o.storeId) : true));
  const allProducts = MOCK_PRODUCTS;
  const allStores = MOCK_STORES; // Keep all stores for the filter dropdown

  // --- Chart Data: Sales by Store ---
  const salesByStoreMap = new Map<string, number>();
  allSales.forEach(order => {
    const storeId = order.storeId;
    if (storeId) {
        const currentSales = salesByStoreMap.get(storeId) || 0;
        salesByStoreMap.set(storeId, currentSales + order.totalAmount);
    }
  });
  
  const salesByStoreChartData = storesToProcess.map(store => ({
      name: store.city, // Using city for shorter labels
      sales: salesByStoreMap.get(store.id) || 0,
  }));


  // --- Table Data: Top Products by Store ---
  type ProductSales = {
      productName: string;
      sku: string;
      brand: Product['brand'];
      series: Product['series'];
      totalUnitsSold: number;
      salesByStore: Record<string, number>; // storeId -> unitsSold
  };

  const productSalesMap = new Map<string, ProductSales>();

  allSales.forEach(order => {
      const storeId = order.storeId;
      if (!storeId) return;

      order.lineItems.forEach(item => {
          let productEntry = productSalesMap.get(item.productId);
          if (!productEntry) {
              const productDetails = allProducts.find(p => p.id === item.productId);
              productEntry = {
                  productName: item.name,
                  sku: item.sku,
                  brand: productDetails?.brand || 'Bobs',
                  series: productDetails?.series || 'Other',
                  totalUnitsSold: 0,
                  salesByStore: {},
              };
          }
          productEntry.totalUnitsSold += item.quantity;
          productEntry.salesByStore[storeId] = (productEntry.salesByStore[storeId] || 0) + item.quantity;
          
          productSalesMap.set(item.productId, productEntry);
      });
  });

  const topSellingProductsTableData = Array.from(productSalesMap.values())
    .sort((a,b) => b.totalUnitsSold - a.totalUnitsSold)
    .slice(0, 10);


  return {
    salesByStoreChartData,
    topSellingProductsTableData,
    stores: allStores, // Return all stores for the filter
    selectedStores: storesToProcess, // Return the stores being displayed
  };
}
