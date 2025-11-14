

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

  const salesInDuration: any[] = [];
  const totalStores = 0;
  const totalSales = 0;
  const totalItemsSold = 0;

  const salesByStoreMap = new Map<string, number>();
  
  const salesByStore: any[] = [];
  const topPerformingStore = 'N/A';

  const productSalesMap = new Map<string, any>();

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

    const store = null; // Store lookup would go here
    if (!store) {
        // Return stub data for now
        return createSuccessResponse({
            todayKPIs: {
                totalSales: 0,
                totalItemsSold: 0,
                topProduct: 'N/A',
            },
            weekComparisonKPIs: {
                lastWeekSales: 0,
                thisWeekSales: 0,
                percentageChange: 0,
            }
        });
    }

    // --- KPIs for today ---
    const todayStart = startOfToday();
    const todayEnd = endOfDay(new Date());

    const salesToday: any[] = [];
    const totalSales = 0;
    const totalItemsSold = 0;

    const productSalesMap = new Map<string, number>();

    const topProducts = Array.from(productSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, unitsSold]) => ({ name, unitsSold }));
    
    // --- Sales Trend for last 7 days ---
    const salesTrend = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), i);
        
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: 0,
        };
    }).reverse();

    return createSuccessResponse({
        storeName: 'Store',
        totalSales: 0,
        totalItemsSold: 0,
        topProducts: [],
        salesTrend,
    });
    } catch (error: any) {
        return createErrorResponse(`Failed to get manager store dashboard data: ${error.message}`);
    }
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
            const storeId = (user as any).storeId || (user as any).orgId;
            if (!storeId) {
                return createSuccessResponse({
                    isAdmin: false,
                    adminDashboardData: null,
                    managerDashboardData: { storeName: 'N/A', totalSales: 0, totalItemsSold: 0, topProducts: [], salesTrend: [] }
                }, 'Manager dashboard data retrieved (no store assigned)');
            }
            const managerDashboardData = await getManagerStoreDashboardData(storeId);
            await logUserAction(user, 'view', 'manager_store_dashboard', storeId);
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
