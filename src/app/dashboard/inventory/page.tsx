
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
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Boxes, FileBarChart } from 'lucide-react';
import { InventoryCategoryChart } from './components/inventory-category-chart';
import { getInventoryDashboardData } from './data';

export default async function InventoryDashboardPage() {
  const dashboardData = await getInventoryDashboardData();

  const {
    totalProducts,
    totalStockValue,
    lowStockItemsCount,
    inventoryByCategory,
    recentStockAlerts,
  } = dashboardData;

  const kpiData = [
    { title: 'Total Products (SKUs)', value: totalProducts, icon: Boxes },
    { title: 'Total Inventory Value', value: `₹${totalStockValue.toLocaleString('en-IN')}`, icon: FileBarChart },
    { title: 'Low Stock Items', value: lowStockItemsCount, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your current inventory status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiData.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <KpiIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Stock distribution across product categories.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <InventoryCategoryChart data={inventoryByCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Alerts</CardTitle>
            <CardDescription>Items that have recently fallen below their reorder level.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead className='text-center'>Current Stock</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStockAlerts.length > 0 ? (
                  recentStockAlerts.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{item.sku}</TableCell>
                       <TableCell className='text-center'>
                          <Badge variant={item.quantity > (item.reorderLevel || 0) ? "outline" : "destructive"}>{item.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.reorderLevel}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No current stock alerts.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
