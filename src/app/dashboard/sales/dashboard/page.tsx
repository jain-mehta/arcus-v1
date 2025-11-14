

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
import { DollarSign, ShoppingCart, Users, Wallet } from 'lucide-react';
import { SalesChart } from '../components/sales-chart';
import { getSalesDashboardData } from './actions';


export default async function SalesDashboardPage() {
  const response = await getSalesDashboardData();
  const { kpis, recentSales, salesChartData } = (response?.success && response.data) ? response.data : { kpis: [], recentSales: [], salesChartData: [] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your sales performance, trends, and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi: any) => {
          const KpiIcon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <KpiIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>Monthly revenue and units sold for the last 6 months. (Using mock data)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <SalesChart data={salesChartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>A list of your most recent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentSales.map((sale: any, index: number) => (
                    <TableRow key={index}>
                        <TableCell>
                        <div className="font-medium">{sale.name}</div>
                        <div className="text-sm text-muted-foreground">{sale.email}</div>
                        </TableCell>
                        <TableCell className="text-right">{sale.amount}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="flex items-center justify-center h-24">
                    <p className="text-sm text-muted-foreground">No sales orders found yet.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

