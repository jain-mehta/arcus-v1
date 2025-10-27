
import { getAdminStoreDashboardData, type AdminDashboardFilter, getManagerStoreDashboardData, getInitialStoreDashboardData } from './actions';
import { AdminStoreDashboardClient } from './client';
import { ManagerStoreDashboardClient } from './manager-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className='flex items-center justify-between'>
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-48" />
            </div>
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
    );
}

export default async function StoreDashboardPage({ searchParams }: any) {
    
    const initialData = await getInitialStoreDashboardData();

    if (!initialData) {
        return (
             <div className="flex justify-center items-start pt-16 h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                        <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">Store Dashboard</CardTitle>
                    <CardDescription>Could not load dashboard data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <p className="text-muted-foreground">
                    There was an error fetching the required data for the dashboard. Please try again later.
                    </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { isAdmin } = initialData;
    
    if (isAdmin) {
        const filter = (searchParams?.filter as AdminDashboardFilter) || 'allTime';
        const adminDashboardData = await getAdminStoreDashboardData(filter);
        return (
            <Suspense fallback={<DashboardSkeleton />}>
                <AdminStoreDashboardClient 
                    dashboardData={adminDashboardData}
                    activeFilter={filter}
                />
            </Suspense>
        );
    }
    
    if (initialData.managerDashboardData) {
         return (
            <Suspense fallback={<DashboardSkeleton />}>
                <ManagerStoreDashboardClient 
                    dashboardData={initialData.managerDashboardData} 
                    storeName={initialData.managerDashboardData.storeName} 
                />
            </Suspense>
        );
    }

    // Fallback for non-admin user with no store assigned
    return (
        <div className="flex justify-center items-start pt-16 h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                        <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">Store Dashboard</CardTitle>
                    <CardDescription>No Store Assigned</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Your user account is not assigned to a store. Please contact an administrator.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

