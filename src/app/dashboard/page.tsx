
import { Suspense } from 'react';
import { getDashboardData } from './actions';
import { DashboardClient } from './dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-1/2" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Skeleton className="h-28" />
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-full min-h-[500px]" />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardClient data={data} />
    </Suspense>
  );
}
