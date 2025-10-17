
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface HeadcountChartProps {
    data: { name: string; count: number }[];
}

export function HeadcountChart({ data }: HeadcountChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}} />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Employees" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

interface LeaveChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function LeaveChart({ data }: LeaveChartProps) {
    if (data.length === 0) {
        return <p className="text-muted-foreground">No leave data to display.</p>
    }
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))'}} />
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}
