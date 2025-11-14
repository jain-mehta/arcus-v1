
import { getQuotations, getSalesCustomers } from '../actions';
import { QuotationsClient } from './client';

export async function QuotationsLoader() {
    const [quotationsResult, customersResult] = await Promise.all([
        getQuotations(), 
        getSalesCustomers()
    ]);
    
    const quotationsData = quotationsResult.success ? quotationsResult.data || [] : [];
    const customerList = customersResult.success ? customersResult.data || [] : [];
    
    // Map quotations to ensure customerId is set
    const quotations = quotationsData.map(q => ({
        ...q,
        customerId: q.customerId || q.customer_id
    }));
    
    return <QuotationsClient initialQuotations={quotations} allCustomers={customerList} />;
}

