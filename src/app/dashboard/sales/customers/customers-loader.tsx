
import { getSalesCustomers } from '../actions';
import { CustomersClient } from './customers-client';


export async function CustomersLoader() {
    const response = await getSalesCustomers();
    const customers = (response?.success && Array.isArray(response.data)) ? response.data : [];

    return <CustomersClient initialCustomers={customers} />;
}

