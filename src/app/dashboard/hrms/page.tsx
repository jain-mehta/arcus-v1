
import { Suspense } from 'react';
import { getHrmsDashboardData } from './actions';
import { HrmsDashboardClient } from './hrms-dashboard-client';
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

function DashboardSkeleton() {
    return (
         <div className="space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </div>
    )
}


export default async function HrmsPage() {
    const response = await getHrmsDashboardData();
    const dashboardData = (response?.success && response?.data) ? response.data : { kpis: [], upcomingEvents: [] };

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <HrmsDashboardClient dashboardData={dashboardData} />
        </Suspense>
    )
}

