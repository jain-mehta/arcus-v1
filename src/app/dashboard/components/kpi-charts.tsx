
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  revenue: {
    label: 'Revenue (₹)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;


export function KpiCharts({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Performance</CardTitle>
        <CardDescription>Monthly revenue for the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
      {data && data.length > 0 ? (
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis yAxisId="left" unit="L" tickFormatter={(value) => `${(value / 100000).toFixed(0)}L`} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} yAxisId="left" />
          </BarChart>
        </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">No sales data available yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
