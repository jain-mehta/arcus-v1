'use server';

import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';
import { getSupabaseServerClient } from '@/lib/supabase/client';

// Database types for Supabase tables
interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  store_id?: string;
  order_date: string;
  status: string;
  total_amount: number;
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
  brand?: string;
  series?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  city?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getStoreReportData(storeIds?: string[], dateRange?: { from?: Date, to?: Date }): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('store', 'reports', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();

        // Get stores from database
        let storesQuery = supabase
            .from('stores')
            .select('*')
            .eq('organization_id', user.organization_id);

        if (storeIds && storeIds.length > 0) {
            storesQuery = storesQuery.in('id', storeIds);
        }

        const { data: stores } = await storesQuery;
        const storesToProcess = stores || [];
        const relevantStoreIds = new Set(storesToProcess.map(s => s.id));

        // Get orders from database with date filtering
        let ordersQuery = supabase
            .from('orders')
            .select('*')
            .eq('organization_id', user.organization_id)
            .eq('status', 'Delivered');

        if (dateRange?.from) {
            ordersQuery = ordersQuery.gte('order_date', dateRange.from.toISOString());
        }

        if (dateRange?.to) {
            ordersQuery = ordersQuery.lte('order_date', dateRange.to.toISOString());
        }

        if (storeIds && storeIds.length > 0) {
            ordersQuery = ordersQuery.in('store_id', storeIds);
        }

        const { data: orders } = await ordersQuery;
        const allSales = orders || [];

        // Get products from database
        const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', user.organization_id);

        const allProducts = products || [];

        // Get all stores for filter dropdown
        const { data: allStores } = await supabase
            .from('stores')
            .select('*')
            .eq('organization_id', user.organization_id);

        // --- Chart Data: Sales by Store ---
        const salesByStoreMap = new Map<string, number>();
        allSales.forEach(order => {
            const storeId = order.store_id;
            if (storeId) {
                const currentSales = salesByStoreMap.get(storeId) || 0;
                salesByStoreMap.set(storeId, currentSales + order.total_amount);
            }
        });

        const salesByStoreChartData = storesToProcess.map(store => ({
            name: store.city || store.name, // Using city for shorter labels, fallback to name
            sales: salesByStoreMap.get(store.id) || 0,
        }));

        // Get order line items for product analysis
        const orderIds = allSales.map(order => order.id);
        let lineItemsData = [];

        if (orderIds.length > 0) {
            const { data: lineItems } = await supabase
                .from('order_line_items')
                .select('*')
                .in('order_id', orderIds);

            lineItemsData = lineItems || [];
        }

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

        // Group line items by order to get store context
        const orderStoreMap = new Map<string, string>();
        allSales.forEach(order => {
            if (order.store_id) {
                orderStoreMap.set(order.id, order.store_id);
            }
        });

        lineItemsData.forEach(item => {
            const storeId = orderStoreMap.get(item.order_id);
            if (!storeId) return;

            let productEntry = productSalesMap.get(item.product_id);
            if (!productEntry) {
                const productDetails = allProducts.find(p => p.id === item.product_id);
                productEntry = {
                    productName: item.product_name || productDetails?.name || 'Unknown Product',
                    sku: item.sku || productDetails?.sku || 'N/A',
                    brand: productDetails?.brand || 'Unknown',
                    series: productDetails?.series || 'Other',
                    totalUnitsSold: 0,
                    salesByStore: {},
                };
            }
            productEntry.totalUnitsSold += item.quantity;
            productEntry.salesByStore[storeId] = (productEntry.salesByStore[storeId] || 0) + item.quantity;

            productSalesMap.set(item.product_id, productEntry);
        });

        const topSellingProductsTableData = Array.from(productSalesMap.values())
            .sort((a,b) => b.totalUnitsSold - a.totalUnitsSold)
            .slice(0, 10);

        await logUserAction(user.id, 'store-reports-viewed', {
            storeIds,
            dateRange,
            recordCount: allSales.length
        });

        return createSuccessResponse({
            salesByStoreChartData,
            topSellingProductsTableData,
            stores: allStores || [], // Return all stores for the filter
            selectedStores: storesToProcess, // Return the stores being displayed
        });

    } catch (error) {
        console.error('Store reports error:', error);
        return createErrorResponse('Failed to load store reports');
    }
}