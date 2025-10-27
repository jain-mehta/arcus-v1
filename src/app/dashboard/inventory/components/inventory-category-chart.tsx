
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ChartData {
    category: string;
    Factory: number;
    Store: number;
}

export function InventoryCategoryChart({ data }: { data: ChartData[] }) {
  const chartData = data.map(c => ({
    name: c.category,
    'Factory': c.Factory,
    'Store': c.Store
  }));

  return (
     <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}} />
            <Legend />
            <Bar dataKey="Factory" stackId="a" fill="hsl(var(--primary))" name="Factory" />
            <Bar dataKey="Store" stackId="a" fill="hsl(var(--secondary))" name="Store" radius={[4, 4, 0, 0]}/>
        </BarChart>
    </ResponsiveContainer>
  );
}

