
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SalesChartProps {
    data: {
        month: string;
        revenue: number;
        unitsSold: number;
    }[];
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" unit="L" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 100000}L`} />
                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}} />
                <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar yAxisId="right" dataKey="unitsSold" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Units Sold" />
            </BarChart>
        </ResponsiveContainer>
    );
}
