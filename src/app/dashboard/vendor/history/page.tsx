

import { getVendors } from '@/lib/firebase/firestore';
import { PurchaseHistoryClient } from './client';
import { getPurchaseHistoryForVendor } from '../actions';

export default async function PurchaseHistoryPage() {
    const vendors = await getVendors();
    const initialHistory = vendors.length > 0 ? await getPurchaseHistoryForVendor(vendors[0].id) : [];

    return (
        <PurchaseHistoryClient vendors={vendors} initialHistory={initialHistory} />
    );
}

    
