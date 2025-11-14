

import { getOrders, getSalesCustomers } from '../actions';
import { OrdersClient } from './client';

export const dynamic = 'force-dynamic';

export default async function SalesOrdersPage() {
    const [ordersResp, customersResp] = await Promise.all([getOrders(), getSalesCustomers()]);
    const orders = (ordersResp?.success && Array.isArray(ordersResp.data)) ? ordersResp.data : [];
    const customers = (customersResp?.success && Array.isArray(customersResp.data)) ? customersResp.data : [];
    
    return <OrdersClient initialOrders={orders as any} customerList={customers as any} />
}

