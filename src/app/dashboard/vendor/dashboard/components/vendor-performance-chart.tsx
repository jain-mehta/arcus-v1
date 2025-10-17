
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface VendorPerformanceData {
    name: string;
    onTimeDelivery: number;
    qualityScore: number;
}

export function VendorPerformanceChart({ data }: { data: VendorPerformanceData[] }) {
  return (
    <Card>
      <CardHeader>
          <CardTitle>Vendor Performance Overview</CardTitle>
          <CardDescription>Comparison of on-time delivery and quality scores for active vendors.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                  <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  dy={10}
                  />
                  <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  />
                  <Tooltip 
                      cursor={{fill: 'hsl(var(--muted))'}} 
                      contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                  />
                  <Bar dataKey="onTimeDelivery" fill="hsl(var(--primary))" name="On-Time Delivery (%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qualityScore" fill="hsl(var(--secondary))" name="Quality Score (/5)" radius={[4, 4, 0, 0]} />
              </BarChart>
          </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

    