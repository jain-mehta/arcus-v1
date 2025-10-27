
import { getVendors, getInvoices } from '@/lib/mock-data/firestore';
import { InvoiceClient } from './client';

export default async function InvoiceManagementPage() {
    const [vendors, allInvoices] = await Promise.all([
        getVendors(),
        getInvoices()
    ]);
    
    return (
       <InvoiceClient vendors={vendors} initialInvoices={allInvoices} />
    );
}

    


