import { getQuotations, getSalesCustomers } from '../actions';
import { QuotationsClient } from './client';

export default async function QuotationsListPage() {
    const [quotations, { customers: customerList }] = await Promise.all([
        getQuotations(), 
        getSalesCustomers()
    ]);
    
    return <QuotationsClient initialQuotations={quotations} allCustomers={customerList} />;
}
