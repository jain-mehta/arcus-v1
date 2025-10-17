
import { getSalesCustomers } from '../actions';
import { CustomersClient } from './customers-client';


export async function CustomersLoader() {
    const { customers } = await getSalesCustomers();

    return <CustomersClient initialCustomers={customers} />;
}
