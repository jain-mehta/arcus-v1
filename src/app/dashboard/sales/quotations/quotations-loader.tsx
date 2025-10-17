
import { getQuotations, getSalesCustomers } from '../actions';
import { QuotationsClient } from './client';

export async function QuotationsLoader() {
    const [quotations, { customers: customerList }] = await Promise.all([
        getQuotations(), 
        getSalesCustomers()
    ]);
    
    return <QuotationsClient initialQuotations={quotations} allCustomers={customerList} />;
}
