

import {
  Activity,
  CircleDollarSign,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import React, { Suspense } from 'react';
import { VendorPerformanceChart } from './components/vendor-performance-chart';
import { getVendorDashboardData } from '../actions';

export default async function VendorDashboardPage() {
  const data = await getVendorDashboardData();

  return (
    <div className="flex flex-col gap-8">
        <Suspense fallback={<KpiCardsSkeleton />}>
          <KpiCards kpis={data.kpis} />
        </Suspense>
        <div className="grid gap-4 md:gap-8">
             <Suspense fallback={<UpcomingPaymentsSkeleton />}>
              <UpcomingPaymentsCard upcomingPayments={data.upcomingPayments} />
            </Suspense>
        </div>
        <VendorPerformanceChart data={data.vendorPerformanceData} />
    </div>
  );
}

function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-1/2 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function KpiCards({ kpis }: { kpis: { activeVendors: number, outstandingBalance: number, ytdSpend: number }}) {
  const { activeVendors, outstandingBalance, ytdSpend } = kpis;

  const kpiData = [
    { title: "Total Active Vendors", value: activeVendors.toString(), icon: Users, change: "in your system" },
    { title: "Total Spend (YTD)", value: `₹${(ytdSpend / 10000000).toFixed(2)} Cr`, icon: CircleDollarSign, change: "for the current year" },
    { title: "Outstanding Balance", value: `₹${(outstandingBalance / 100000).toFixed(2)} Lac`, icon: Activity, change: "across all vendors" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      {kpiData.map(kpi => {
        const KpiIcon = kpi.icon;
        return (
            <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {kpi.title}
                </CardTitle>
                <KpiIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">
                    {kpi.change}
                </p>
                </CardContent>
            </Card>
        )
      })}
    </div>
  );
}


function UpcomingPaymentsSkeleton() {
    return (
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Upcoming Vendor Payments</CardTitle>
                <CardDescription>
                    A list of vendor payments due within the next 30 days.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead className="hidden sm:table-cell">PO #</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Due Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 3 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function UpcomingPaymentsCard({ upcomingPayments }: { upcomingPayments: any[] }) {

  return (
    <Card className="xl:col-span-2">
         <CardHeader>
            <CardTitle>Upcoming Vendor Payments</CardTitle>
            <CardDescription>
                A list of vendor payments due within the next 30 days.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="hidden sm:table-cell">PO #</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Due Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {upcomingPayments.length > 0 ? upcomingPayments.map(payment => (
                    <TableRow key={payment.id}>
                        <TableCell>
                        <div className="font-medium">{payment.vendorName}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{payment.poNumber}</TableCell>
                        <TableCell className="text-right">₹{payment.totalAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">{new Date(payment.deliveryDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No upcoming payments in the next 30 days.
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
