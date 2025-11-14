

import { getProductsForBarcode } from './actions';
import { QrCodeGeneratorClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

function PageSkeleton() {
    return (
        <div className="space-y-8">
            <div className='space-y-2'>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-96" />
        </div>
    )
}

export default async function QrCodeGeneratorPage() {
    const response = await getProductsForBarcode();
    const products = (response?.success && Array.isArray(response.data)) ? response.data : [];
    
    return (
        <Suspense fallback={<PageSkeleton />}>
            <QrCodeGeneratorClient products={products} />
        </Suspense>
    );
}

