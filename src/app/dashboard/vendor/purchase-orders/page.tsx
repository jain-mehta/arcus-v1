
import { getPurchaseOrders, getVendors } from '@/lib/mock-data/firestore';
import { PurchaseOrderClient } from './client';


export default async function PurchaseOrderPage() {
    const [{ purchaseOrders }, vendorList] = await Promise.all([
        getPurchaseOrders(), 
        getVendors()
    ]);
    
    return (
       <PurchaseOrderClient initialPurchaseOrders={purchaseOrders} vendors={vendorList} />
    );
}


