

'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, LineChart, Line } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Target, TrendingUp, HandCoins, CheckCircle, History, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Opportunity, SalesSnapshot } from '@/lib/mock-data/types';
import { Button } from '@/components/ui/button';
import { useMemo, useState, useTransition } from 'react';
import { generateMonthlySnapshot } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomReportGenerator } from './custom-report-generator';

const iconMap: { [key: string]: React.ElementType } = {
    HandCoins,
    CheckCircle,
    Target,
    TrendingUp,
};


interface SalesReportData {
    kpiData: {
        title: string;
        value: string;
        icon: string;
    }[];
    funnelData: {
        name: string;
        value: number;
        color: string;
    }[];
    topOpportunities: (Opportunity & { customerName: string })[];
    sourceData: {
        name: string;
        value: number;
    }[];
}

interface SalesReportsClientProps {
    reportData: SalesReportData;
    snapshots: SalesSnapshot[];
}


// --- Component ---
export function SalesReportsClient({ reportData, snapshots: initialSnapshots }: SalesReportsClientProps) {
  const { kpiData, funnelData, topOpportunities, sourceData } = reportData;
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [isGenerating, startGeneration] = useTransition();
  const [selectedKpi, setSelectedKpi] = useState<keyof Omit<SalesSnapshot, 'id' | 'period' | 'createdAt'>>('winRate');

  const handleGenerateSnapshot = () => {
    startGeneration(async () => {
        try {
            const result = await generateMonthlySnapshot();
            if (result.success && result.newSnapshot) {
                setSnapshots((prev: SalesSnapshot[]) => {
                    const existing = prev.find((s) => s.id === result.newSnapshot!.id);
                    if (existing) return prev;

                    const newSnapshots: SalesSnapshot[] = [...prev, result.newSnapshot!];
                    newSnapshots.sort((a, b) => a.period.localeCompare(b.period));
                    return newSnapshots;
                });
                toast({ title: 'Snapshot Generated', description: `Historical data for ${result.newSnapshot.period} has been saved.`});
            } else {
                 toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate snapshot.' });
        }
    });
  }

  const historicalChartData = useMemo(() => {
    return snapshots.map(s => ({
        name: new Date(s.period + '-02').toLocaleString('default', { month: 'short' }),
        value: s[selectedKpi]
    }));
  }, [snapshots, selectedKpi]);

  const kpiOptions = [
    { value: 'winRate', label: 'Win Rate (%)' },
    { value: 'pipelineValue', label: 'Pipeline Value (?)' },
    { value: 'avgDealSize', label: 'Average Deal Size (?)' },
    { value: 'salesCycleDays', label: 'Sales Cycle (Days)' },
  ];

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Reports & KPIs</h1>
            <p className="text-muted-foreground">Analyze your sales performance and pipeline health.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => {
                const Icon = iconMap[kpi.icon];
                return (
                <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    </CardContent>
                </Card>
            )})}
        </div>

        <Card>
            <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                 <div>
                    <CardTitle className="flex items-center gap-2"><History /> Historical KPI Trends</CardTitle>
                    <CardDescription>Analyze how key metrics have changed over time.</CardDescription>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                     <Select value={selectedKpi} onValueChange={(val) => setSelectedKpi(val as any)}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {kpiOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Button onClick={handleGenerateSnapshot} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate This Month's Snapshot
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalChartData} margin={{ left: -20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => selectedKpi === 'winRate' ? `${value}%` : value.toLocaleString('en-IN') }/>
                        <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))'}} formatter={(value: number) => value.toLocaleString('en-IN')} />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">Snapshots are generated for the current month. Generate a new snapshot each month to track trends.</p>
            </CardFooter>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card>
                <CardHeader>
                    <CardTitle>Revenue by Lead Source</CardTitle>
                    <CardDescription>Which channels are bringing in the most revenue.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sourceData} layout="vertical" margin={{ right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={(value) => `?${value / 100000}L`} />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} formatter={(value: number) => `?${value.toLocaleString('en-IN')}`} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Sales Funnel</CardTitle>
                    <CardDescription>Opportunity distribution across pipeline stages.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                            />
                            <Pie
                                data={funnelData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                label={({ name, value }) => `${name} (${value})`}
                            >
                                 {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <Card>
             <CardHeader>
                <CardTitle>Top Open Opportunities</CardTitle>
                <CardDescription>The highest-value deals currently in your pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Opportunity Title</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Expected Close Date</TableHead>
                            <TableHead className="text-right">Value (?)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topOpportunities.length > 0 ? topOpportunities.map(opp => (
                            <TableRow key={opp.id}>
                                <TableCell className="font-medium">{opp.title}</TableCell>
                                <TableCell>{opp.customerName}</TableCell>
                                <TableCell><Badge variant="secondary">{opp.stage}</Badge></TableCell>
                                <TableCell>{opp.closeDate}</TableCell>
                                <TableCell className="text-right font-semibold">{opp.value.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No open opportunities found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

    

