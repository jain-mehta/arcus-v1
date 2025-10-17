
'use client';

import { Suspense } from 'react';
import { KeyMetrics } from './components/key-metrics';
import { CriticalAlerts } from './components/critical-alerts';
import { KpiCharts } from './components/kpi-charts';
import { KpiSuggestions } from './components/kpi-suggestions';
import { PendingVendorPayments } from './components/pending-vendor-payments';
import { SalesOverview } from './components/sales-overview';
import { Skeleton } from '@/components/ui/skeleton';
import type { getDashboardData } from './actions';

interface DashboardClientProps {
  data: Awaited<ReturnType<typeof getDashboardData>>;
}

export function DashboardClient({ data }: DashboardClientProps) {
  // Prepare data for charts from the fetched dashboard data
  const salesTrendData = data.salesOverview?.revenueFigures.map(d => ({ name: d.name, sales: d.revenue })) || [];
  const revenueFiguresData = data.salesOverview?.revenueFigures || [];
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Suspense fallback={<Skeleton className="h-28" />}>
            <KeyMetrics data={data.keyMetrics} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-96" />}>
            <SalesOverview 
              data={data.salesOverview} 
              salesTrendData={salesTrendData} 
              revenueFiguresData={revenueFiguresData} 
            />
          </Suspense>
          {revenueFiguresData && revenueFiguresData.length > 0 && <KpiCharts data={revenueFiguresData} />}
          <Suspense fallback={<Skeleton className="h-96" />}>
            <PendingVendorPayments payments={data.pendingPayments} />
          </Suspense>
          <CriticalAlerts alerts={data.criticalAlerts} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
          <KpiSuggestions />
        </div>
      </div>
    </div>
  );
}
