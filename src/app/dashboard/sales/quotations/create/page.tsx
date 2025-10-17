

import { getProducts } from '@/app/dashboard/inventory/data';
import { getSalesCustomers } from '@/app/dashboard/sales/actions';
import { CreateQuotationClient } from './client';

export const dynamic = 'force-dynamic';

export default async function CreateQuotationPage() {
    const [products, { customers }] = await Promise.all([
        getProducts(),
        getSalesCustomers()
    ]);

    return <CreateQuotationClient products={products} customers={customers} />;
}

    