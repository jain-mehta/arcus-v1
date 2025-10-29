

'use server';

import { DollarSign, ShoppingCart, Users, Wallet } from 'lucide-react';
import { getOrders, getSalesCustomers } from '../actions';
import { MOCK_ORDERS } from '@/lib/mock-data/firestore';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';

export async function getSalesDashboardData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

  const [{ orders }, { customers }] = await Promise.all([
    getOrders(),
    getSalesCustomers(),
  ]);
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const totalSalesCount = customers.length;
  const averageOrderValue =
    orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalProductsSold = orders.reduce(
    (acc, order) =>
      acc + order.lineItems.reduce((itemAcc, item) => itemAcc + item.quantity, 0),
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

  const recentSales = orders.slice(0, 5).map((order) => ({
    name: customerMap.get(order.customerId) || 'Unknown Customer',
    email: `Order: ${order.orderNumber}`,
    amount: `₹${order.totalAmount.toLocaleString('en-IN')}`,
  }));

  const salesChartData = MOCK_ORDERS.reduce((acc, order) => {
    const month = new Date(order.orderDate).toLocaleString('default', { month: 'short' });
    const unitsSold = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const existing = acc.find(item => item.month === month);
    if (existing) {
        existing.revenue += order.totalAmount;
        existing.unitsSold += unitsSold;
    } else {
        acc.push({ month, revenue: order.totalAmount, unitsSold });
    }
    return acc;
  }, [] as { month: string, revenue: number, unitsSold: number }[]);


  return {
    kpis,
    recentSales,
    salesChartData,
  };
}


