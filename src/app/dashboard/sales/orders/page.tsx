

import { getOrders, getSalesCustomers } from '../actions';
import { OrdersClient } from './client';

export const dynamic = 'force-dynamic';

export default async function SalesOrdersPage() {
    const { orders } = await getOrders();
    const { customers } = await getSalesCustomers();
    
    return <OrdersClient initialOrders={orders} customerList={customers} />
}
