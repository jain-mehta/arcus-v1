

'use server';

import { DollarSign, ShoppingCart, Users, Wallet } from 'lucide-react';
import { getOrders, getSalesCustomers } from '../actions';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getSalesDashboardData(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('sales', 'dashboard', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {

  const [ordersResp, customersResp] = await Promise.all([
    getOrders(),
    getSalesCustomers(),
  ]);
  
  const orders = (ordersResp?.success && Array.isArray(ordersResp.data)) ? ordersResp.data : [];
  const customers = (customersResp?.success && Array.isArray(customersResp.data)) ? customersResp.data : [];
  
  const customerMap = new Map(customers.map((c: any) => [c.id, c.name]));

  const totalRevenue = orders.reduce((acc: any, order: any) => acc + (order.totalAmount || 0), 0);
  const totalSalesCount = customers.length;
  const averageOrderValue =
    orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalProductsSold = orders.reduce(
    (acc: any, order: any) =>
      acc + (order.lineItems || []).reduce((itemAcc: any, item: any) => itemAcc + (item.quantity || 0), 0),
    0
  );

  const kpis = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      change: 'from all orders',
    },
    {
      title: 'Total Customers',
      value: `+${totalSalesCount}`,
      icon: Users,
      change: 'in your database',
    },
    {
      title: 'Average Order Value',
      value: `₹${averageOrderValue.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      })}`,
      icon: Wallet,
      change: 'across all orders',
    },
    {
      title: 'Total Products Sold',
      value: totalProductsSold.toLocaleString('en-IN'),
      icon: ShoppingCart,
      change: 'across all orders',
    },
  ];

  const recentSales = orders.slice(0, 5).map((order: any) => ({
    name: customerMap.get(order.customerId) || 'Unknown Customer',
    email: `Order: ${order.orderNumber}`,
    amount: `₹${(order.totalAmount || 0).toLocaleString('en-IN')}`,
  }));

  const salesChartData = orders.reduce((acc: any[], order: any) => {
    const month = new Date(order.orderDate || new Date()).toLocaleString('default', { month: 'short' });
    const unitsSold = (order.lineItems || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const existing = acc.find(item => item.month === month);
    if (existing) {
        existing.revenue += (order.totalAmount || 0);
        existing.unitsSold += unitsSold;
    } else {
        acc.push({ month, revenue: (order.totalAmount || 0), unitsSold });
    }
    return acc;
  }, [] as { month: string, revenue: number, unitsSold: number }[]);


        const dashboardData = {
            kpis,
            recentSales,
            salesChartData,
        };

        await logUserAction(user, 'view', 'sales_dashboard');
        return createSuccessResponse(dashboardData, 'Sales dashboard data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get sales dashboard data: ${error.message}`);
    }
}
