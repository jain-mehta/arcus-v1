
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Star, Save, Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Vendor, VendorRatingCriteria, VendorRatingHistory } from '@/lib/mock-data/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateAndUpdateVendorScores, getVendorRatingCriteria, getVendorRatingHistory, getVendors } from './actions';
import { cn } from '@/lib/utils';


type EditableRatingCriteria = VendorRatingCriteria & { isDirty?: boolean };

interface RatingClientProps {
    vendors: Vendor[];
    initialCriteria: VendorRatingCriteria[];
    initialHistory: VendorRatingHistory[];
}

export function RatingClient({ vendors: initialVendors, initialCriteria, initialHistory }: RatingClientProps) {
    const { toast } = useToast();
    const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
    const [selectedVendor, setSelectedVendor] = useState<string>(initialVendors[0]?.id || '');
    const [loading, setLoading] = useState(false);
    const [isSaving, startSaving] = useTransition();
    const [criteriaData, setCriteriaData] = useState<EditableRatingCriteria[]>(initialCriteria);
    const [initialCriteriaData, setInitialCriteriaData] = useState<EditableRatingCriteria[]>(initialCriteria);
    const [historicalData, setHistoricalData] = useState<VendorRatingHistory[]>(initialHistory);

    useEffect(() => {
        // This effect runs only when the selected vendor changes, not on initial load
        if (selectedVendor && selectedVendor !== initialVendors[0]?.id) {
            const fetchRatingData = async () => {
                setLoading(true);
                try {
                    const [criteria, history] = await Promise.all([
                        getVendorRatingCriteria(selectedVendor),
                        getVendorRatingHistory(selectedVendor),
                    ]);
                    setCriteriaData(criteria);
                    setInitialCriteriaData(criteria);
                    setHistoricalData(history);
                } catch (error) {
                    console.error("Failed to fetch rating data", error);
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to load rating data.' });
                } finally {
                    setLoading(false);
                }
            }
            fetchRatingData();
        } else if (!selectedVendor) {
            setCriteriaData([]);
            setInitialCriteriaData([]);
            setHistoricalData([]);
        }
    }, [selectedVendor, initialVendors, toast]);

    const handleFieldChange = (criteriaId: string, field: 'manualScore' | 'comments', value: any) => {
        setCriteriaData(prev =>
            prev.map(c => {
                if (c.id === criteriaId) {
                    const updatedItem = { ...c, [field]: value };
                    const initialItem = initialCriteriaData.find(item => item.id === criteriaId);
                    
                    const manualScoreChanged = initialItem?.manualScore !== updatedItem.manualScore;
                    const commentsChanged = initialItem?.comments !== updatedItem.comments;

                    return { ...updatedItem, isDirty: manualScoreChanged || commentsChanged };
                }
                return c;
            })
        );
    };

    const handleSaveChanges = () => {
        const dirtyCriteria = criteriaData.filter(c => c.isDirty).map(({isDirty, ...rest}) => ({...rest}));
        if (dirtyCriteria.length === 0) {
            toast({ title: 'No changes to save.' });
            return;
        }

        startSaving(async () => {
            try {
                await calculateAndUpdateVendorScores(selectedVendor, dirtyCriteria);
                
                const [newCriteria, newHistory, allVendors] = await Promise.all([
                    getVendorRatingCriteria(selectedVendor),
                    getVendorRatingHistory(selectedVendor),
                    getVendors()
                ]);

                setCriteriaData(newCriteria);
                setInitialCriteriaData(newCriteria);
                setHistoricalData(newHistory);
                setVendors(allVendors);

                toast({ title: 'Success', description: 'Vendor ratings have been updated.' });

            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to save ratings.' });
            }
        });
    };

    const vendor = vendors.find(v => v.id === selectedVendor);
    const hasDirtyChanges = useMemo(() => criteriaData.some(c => c.isDirty), [criteriaData]);
    
    const chartData = useMemo(() => historicalData.map(h => ({
        name: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: h.score,
    })), [historicalData]);


    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Rating & Performance</h1>
                    <p className="text-muted-foreground">Monitor, rate, and analyze vendor performance over time.</p>
                </div>
                <Button onClick={handleSaveChanges} disabled={isSaving || !hasDirtyChanges}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                     Save Ratings
                </Button>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Select Vendor</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className='max-w-sm'>
                        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                            <SelectTrigger>
                                <SelectValue placeholder={vendors.length > 0 ? "Select a vendor" : "No vendors available"} />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Overall Performance Score</CardTitle>
                        <CardDescription>{vendor ? vendor.name : '...'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center gap-2">
                        <span className="text-5xl font-bold">{vendor ? vendor.qualityScore.toFixed(1) : '--'}</span>
                        <Star className="h-8 w-8 text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>On-Time Delivery</CardTitle>
                         <CardDescription>Last 90 days</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                         <span className="text-5xl font-bold">{vendor ? `${vendor.onTimeDelivery}%` : '--%'}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quality Score</CardTitle>
                         <CardDescription>Based on recent inspections</CardDescription>
                    </CardHeader>
                     <CardContent className="flex items-center justify-center">
                         <span className="text-5xl font-bold">{vendor ? `${vendor.qualityScore.toFixed(1)}/5` : '--/5'}</span>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historical Performance Trend</CardTitle>
                    <CardDescription>Overall score for the selected vendor over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    {loading ? <Skeleton className="w-full h-full" /> : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis domain={[4, 5]} />
                                <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))'}} formatter={(value) => (value as number).toFixed(1)} />
                                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-muted-foreground">No historical data to display.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Rating Criteria</CardTitle>
                    <CardDescription>Breakdown of the overall score. Manual scores override automated scores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Criteria</TableHead>
                                <TableHead className="text-center">Weight (%)</TableHead>
                                <TableHead className="text-center">Auto Score (/5)</TableHead>
                                <TableHead className="text-center">Manual Score (/5)</TableHead>
                                <TableHead>Comments</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                            ) : criteriaData.length > 0 ? (
                                criteriaData.map((item) => (
                                    <TableRow key={item.id} className={cn(item.isDirty && 'bg-accent/50')}>
                                        <TableCell className="font-medium">{item.criteria}</TableCell>
                                        <TableCell className="text-center">{item.weight}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{item.autoScore.toFixed(1)}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                key={`${item.id}-manual`}
                                                defaultValue={item.manualScore?.toFixed(1)}
                                                onChange={e => handleFieldChange(item.id, 'manualScore', parseFloat(e.target.value))}
                                                className="w-24 mx-auto"
                                                max={5}
                                                min={0}
                                                step={0.1}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                key={`${item.id}-comments`}
                                                defaultValue={item.comments}
                                                onChange={e => handleFieldChange(item.id, 'comments', e.target.value)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No rating criteria found for this vendor.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}


