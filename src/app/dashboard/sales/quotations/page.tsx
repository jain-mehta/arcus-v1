import { getQuotations, getSalesCustomers } from '../actions';
import { QuotationsClient } from './client';

export default async function QuotationsListPage() {
    const [quotationsResp, customersResp] = await Promise.all([
        getQuotations(), 
        getSalesCustomers()
    ]);
    
    const quotations = (quotationsResp?.success && Array.isArray(quotationsResp.data)) ? quotationsResp.data : [];
    const customerList = (customersResp?.success && Array.isArray(customersResp.data)) ? customersResp.data : [];
    
    return <QuotationsClient initialQuotations={quotations as any} allCustomers={customerList as any} />;
}

