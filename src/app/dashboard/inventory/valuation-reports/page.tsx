

'use client';

import React, { useState, useTransition, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Printer } from 'lucide-react';
import { generateValuationReport, type ReportData } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

export default function ValuationReportsPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, startTransition] = useTransition();
    const [filters, setFilters] = useState({
        location: 'all' as 'all' | 'Factory' | 'Store',
        method: 'current-value' as 'current-value',
    });
    const printRef = useRef(null);

    const handleGenerateReport = () => {
        startTransition(async () => {
            const data = await generateValuationReport(filters);
            setReportData(data);
        });
    }
    
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inventory Valuation Reports</h1>
                <p className="text-muted-foreground">Generate and view reports on the financial value of your inventory.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>Select the location and valuation method for your report.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid w-full max-w-xs items-center gap-1.5">
                        <Label>Location</Label>
                        <Select
                            value={filters.location}
                            onValueChange={(val) => setFilters(prev => ({...prev, location: val as any}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                <SelectItem value="Factory">Factory Only</SelectItem>
                                <SelectItem value="Store">Stores Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid w-full max-w-xs items-center gap-1.5">
                        <Label>Valuation Method</Label>
                        <Select
                            value={filters.method}
                            onValueChange={(val) => setFilters(prev => ({...prev, method: val as any}))}
                        >
                             <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="current-value">Current Value (Price * Quantity)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleGenerateReport} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Report
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Report Preview</CardTitle>
                            <CardDescription>
                                {reportData ? `Report generated on ${new Date(reportData.generatedAt).toLocaleString()}` : 'Generate a report to see a preview.'}
                            </CardDescription>
                        </div>
                        {reportData && (
                            <Button onClick={handlePrint} variant="outline">
                                <Printer className="mr-2 h-4 w-4" /> Print Report
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-96" /> :
                     reportData ? (
                        <div ref={printRef} className="printable-report">
                            <h2 className="text-xl font-bold mb-2">Inventory Valuation Report</h2>
                            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                                <p><strong>Location:</strong> {reportData.filters.location}</p>
                                <p><strong>Method:</strong> {reportData.filters.method}</p>
                                <p><strong>Generated At:</strong> {new Date(reportData.generatedAt).toLocaleString()}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Value</CardTitle></CardHeader>
                                    <CardContent><p className="text-2xl font-bold">₹{reportData.summary.totalValue.toLocaleString('en-IN')}</p></CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Quantity</CardTitle></CardHeader>
                                    <CardContent><p className="text-2xl font-bold">{reportData.summary.totalQuantity.toLocaleString('en-IN')}</p></CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total SKUs</CardTitle></CardHeader>
                                    <CardContent><p className="text-2xl font-bold">{reportData.summary.totalSKUs.toLocaleString('en-IN')}</p></CardContent>
                                </Card>
                            </div>
                            
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Unit Price (?)</TableHead>
                                        <TableHead className="text-right">Total Value (?)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.products.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.sku}</TableCell>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell className="text-right">{p.quantity}</TableCell>
                                            <TableCell className="text-right">{p.price.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-right font-semibold">{(p.price * p.quantity).toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                     ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <p>No report generated yet.</p>
                        </div>
                     )}
                </CardContent>
            </Card>

             <style jsx global>{`
                @media print {
                    body > *:not(.printable-report) {
                        display: none !important;
                    }
                    .printable-report {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

