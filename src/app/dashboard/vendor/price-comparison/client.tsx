
'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter, Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPriceComparisonData } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface ComparisonData {
    vendorName: string;
    unitPrice: number;
    qualityScore: number;
}

interface PriceComparisonClientProps {
    materials: string[];
    initialComparisonData: ComparisonData[];
    initialMaterial: string;
}

export function PriceComparisonClient({ materials, initialComparisonData, initialMaterial }: PriceComparisonClientProps) {
    const { toast } = useToast();
    const [selectedMaterial, setSelectedMaterial] = useState<string>(initialMaterial);
    const [isFetching, startFetching] = useTransition();
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>(initialComparisonData);

    const handleMaterialChange = useCallback((material: string) => {
        setSelectedMaterial(material);
        if (!material) {
            setComparisonData([]);
            return;
        }
        startFetching(async () => {
            try {
                const data = await fetchPriceComparisonData(material);
                // FIX: Set the fetched data into the component's state.
                setComparisonData(data);
            } catch (e) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch comparison data.' });
            }
        });
    }, [toast]);


    const chartData = comparisonData.map(d => ({ name: d.vendorName, price: d.unitPrice }));

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Price Comparison</h1>
                    <p className="text-muted-foreground">Compare prices for materials across different vendors.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='max-w-xs space-y-2'>
                        <Label htmlFor='material-select'>Material</Label>
                        <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
                            <SelectTrigger id="material-select">
                                <SelectValue placeholder={materials.length > 0 ? "Select a material" : "No materials available"} />
                            </SelectTrigger>
                            <SelectContent>
                                {materials.length > 0 ? (
                                    materials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No materials found.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Comparison Results for: {selectedMaterial || '...'}</CardTitle>
                        <CardDescription>Select a material to see results.</CardDescription>
                    </div>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead className="text-right">Price (?)</TableHead>
                                <TableHead className="text-center">Quality Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetching ? (
                                Array.from({length:3}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className='h-8' /></TableCell></TableRow>)
                            ) : comparisonData.length > 0 ? comparisonData.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.vendorName}</TableCell>
                                    <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">{item.qualityScore.toFixed(1)} / 5</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No comparison data for the selected material.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Price Visualization</CardTitle>
                    <CardDescription>Visual comparison of prices for the selected material.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    {isFetching ? <Skeleton className='h-full w-full' /> :
                    chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
                                <YAxis unit="?" />
                                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}} formatter={(value: number) => `?${value.toFixed(2)}`} />
                                <Bar dataKey="price" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-muted-foreground">No data to visualize.</p>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}

