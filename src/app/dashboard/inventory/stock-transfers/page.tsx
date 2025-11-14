

import { StockTransfersClient } from './client';
import { getProducts } from '../data';
import { getStores } from '../../store/manage/actions';

export default async function StockTransfersPage() {
    const [products, stores] = await Promise.all([
        getProducts(),
        getStores()
    ]);

    return (
        <StockTransfersClient products={products} stores={stores as any} />
    );
}


