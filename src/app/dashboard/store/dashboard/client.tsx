
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Package, Store, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useRouter } from 'next/navigation';
import type { Store as TStore } from '@/lib/firebase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { getAdminStoreDashboardData, AdminDashboardFilter } from './actions';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DashboardData = Awaited<ReturnType<typeof getAdminStoreDashboardData>>;

interface AdminStoreDashboardClientProps {
    dashboardData: DashboardData;
    activeFilter: AdminDashboardFilter;
}


export function AdminStoreDashboardClient({ dashboardData, activeFilter }: AdminStoreDashboardClientProps) {
  const { totalStores, totalSales, totalItemsSold, salesByStore, topPerformingStore, topProducts, allStores } = dashboardData;
  const router = useRouter();
  
  const kpis = [
    { title: 'Total Stores', value: totalStores, icon: Store },
    { title: 'Total Sales', value: `₹${totalSales.toLocaleString('en-IN')}`, icon: DollarSign },
    { title: 'Total Items Sold', value: totalItemsSold.toLocaleString(), icon: Package },
    { title: 'Top Performing Store', value: topPerformingStore, icon: TrendingUp },
  ];

  const storeMap = new Map(allStores.map(s => [s.id, s.name]));
  
  const filterOptions: {label: string, value: AdminDashboardFilter}[] = [
    { label: 'Last 24 hours', value: 'last24hours' },
    { label: 'Last 48 hours', value: 'last48hours' },
    { label: 'Last 7 Days', value: 'last7days' },
    { label: 'Last 30 Days', value: 'last30days' },
    { label: 'Last 90 Days', value: 'last90days' },
    { label: 'All Time', value: 'allTime' },
  ];

  const handleFilterChange = (filter: AdminDashboardFilter) => {
    router.push(`/dashboard/store/dashboard?filter=${filter}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin - Stores Dashboard</h1>
            <p className="text-muted-foreground">
            An aggregated overview of performance across all stores.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Select value={activeFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                    {filterOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
            const KpiIcon = kpi.icon;
            return (
                <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <KpiIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {kpi.value}
                        </div>
                    </CardContent>
                </Card>
            )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Store</CardTitle>
            <CardDescription>Comparison of total sales revenue for each store.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByStore}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}} />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <Tabs defaultValue="overall">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
               <TabsList className="grid w-full grid-cols-3 mt-2">
                  <TabsTrigger value="overall">Overall</TabsTrigger>
                  {allStores.slice(0,2).map(store => (
                     <TabsTrigger key={store.id} value={store.id}>{store.name.split(' ')[0]}</TabsTrigger>
                  ))}
              </TabsList>
            </CardHeader>
            
            <TabsContent value="overall">
              <CardHeader className="pt-0">
                  <CardDescription>Top products sold across all stores.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand & Series</TableHead>
                      <TableHead className="text-right">Total Units Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map(item => (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                           <TableCell>
                                <Badge variant="outline">{item.brand}</Badge>
                                <Badge variant="secondary" className="ml-2">{item.series}</Badge>
                            </TableCell>
                          <TableCell className="text-right font-bold">{item.totalUnitsSold}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>
            
            {allStores.map(store => (
              <TabsContent key={store.id} value={store.id}>
                 <CardHeader className="pt-0">
                    <CardDescription>Top products sold at {store.name}.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Brand & Series</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts
                          .filter(p => p.salesByStore[store.id] > 0)
                          .sort((a, b) => b.salesByStore[store.id] - a.salesByStore[store.id])
                          .map(item => (
                            <TableRow key={`${store.id}-${item.name}`}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                               <TableCell>
                                    <Badge variant="outline">{item.brand}</Badge>
                                    <Badge variant="secondary" className="ml-2">{item.series}</Badge>
                                </TableCell>
                              <TableCell className="text-right font-bold">{item.salesByStore[store.id]}</TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </CardContent>
              </TabsContent>
            ))}

          </Tabs>
        </Card>
      </div>
    </div>
  );
}
