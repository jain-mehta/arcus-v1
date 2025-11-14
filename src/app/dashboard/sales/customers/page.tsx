
import { getSalesCustomers } from '../actions';
import { CustomersClient } from './customers-client';

interface Customer {
    id: string;
    name: string;
    email?: string;
    [key: string]: any;
}

export default async function CustomersPage() {
    const response = await getSalesCustomers();
    const customers = (response?.success && Array.isArray(response.data)) ? response.data : [];

    return <CustomersClient initialCustomers={customers} />;
}

