
import { getSalesCustomers } from '../actions';
import { CustomersClient } from './customers-client';

export default async function CustomersPage() {
    const { customers } = await getSalesCustomers();

    return <CustomersClient initialCustomers={customers} />;
}
