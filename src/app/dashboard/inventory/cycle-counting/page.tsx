

import { getProducts } from '../data';
import { CycleCountingClient } from './client';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

function PageSkeleton() {
    return (
        <div className="space-y-8">
            <div className='space-y-2'>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
        </div>
    );
}

export default async function CycleCountingPage() {
    const products = await getProducts();

    return (
        <Suspense fallback={<PageSkeleton />}>
            <CycleCountingClient products={products} />
        </Suspense>
    );
}

