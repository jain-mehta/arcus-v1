
'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SalesOverviewProps {
    data: {
        totalRevenue: number;
        monthlyChange: string;
        topProducts: { name: string; sold: number; progress: number; storeName: string; }[];
        revenueFigures: { name: string; revenue: number; }[];
    },
    salesTrendData: { name: string, sales: number }[];
    revenueFiguresData: { name: string, revenue: number }[];
}

export function SalesOverview({ data, salesTrendData, revenueFiguresData }: SalesOverviewProps) {
  const { totalRevenue, monthlyChange, topProducts, revenueFigures } = data;

  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4">Sales Overview</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
            <CardTitle>Sales Trends</CardTitle>
            <div className="text-sm text-muted-foreground">
                <span className="text-2xl font-bold text-foreground">?{totalRevenue.toLocaleString('en-IN')}</span>
                <div className="text-xs">{monthlyChange} from last month</div>
            </div>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                {salesTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <Line
                            type="monotone"
                            strokeWidth={2}
                            dataKey="sales"
                            activeDot={{
                            r: 6,
                            style: { fill: "var(--theme-primary)" },
                            }}
                            stroke="hsl(var(--primary))"
                        />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <Tooltip />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-muted-foreground">No trend data</p>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Top-Selling Products</CardTitle>
             <div className="text-sm text-muted-foreground pt-1.5">
                <span className="text-2xl font-bold text-foreground">{topProducts[0]?.name || '--'}</span>
                <div className="text-xs">Top performer this month</div>
            </div>
            </CardHeader>
            <CardContent>
            {topProducts.length > 0 ? (
                <div className="space-y-4">
                    {topProducts.map((product, index) => (
                    <div key={product.name + index}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{product.name}</span>
                            <span>{product.sold} units</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>from {product.storeName}</span>
                        </div>
                        <Progress value={product.progress} />
                    </div>
                    ))}
                </div>
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No product data</p>
                 </div>
            )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Revenue Figures</CardTitle>
            <div className="text-sm text-muted-foreground pt-1.5">
                <span className="text-2xl font-bold text-foreground">?{totalRevenue.toLocaleString('en-IN')}</span>
                <div className="text-xs">Total revenue this period</div>
            </div>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                {revenueFiguresData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueFiguresData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis hide={true} />
                        <Tooltip cursor={{fill: 'hsl(var(--muted))'}} formatter={(value: number) => `?${new Intl.NumberFormat('en-IN').format(value)}`} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-muted-foreground">No revenue data</p>
                )}
            </CardContent>
        </Card>
        </div>
    </div>
  );
}

