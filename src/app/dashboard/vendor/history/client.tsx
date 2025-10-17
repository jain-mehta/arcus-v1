
'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Download, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { getPurchaseHistoryForVendor, updatePurchaseHistory } from '../actions';
import type { PurchaseOrder, Vendor } from '@/lib/firebase/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'Delivered': case 'Closed': return 'default';
        case 'In Transit': case 'Approved': return 'secondary';
        case 'Canceled': return 'destructive';
        default: return 'outline';
    }
};

type EditablePurchaseOrder = PurchaseOrder & { isDirty?: boolean };

interface PurchaseHistoryClientProps {
    vendors: Vendor[];
    initialHistory: PurchaseOrder[];
}


export function PurchaseHistoryClient({ vendors, initialHistory }: PurchaseHistoryClientProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isFetching, setIsFetching] = useState(false);
    
    const [selectedVendor, setSelectedVendor] = useState<string>(vendors[0]?.id || '');
    const [purchaseHistory, setPurchaseHistory] = useState<EditablePurchaseOrder[]>(initialHistory);
    const [initialPurchaseHistory, setInitialPurchaseHistory] = useState<EditablePurchaseOrder[]>(initialHistory);
    const [loading, setLoading] = useState(true);

    const [date, setDate] = useState<DateRange | undefined>();
    const [materialFilter, setMaterialFilter] = useState('');
    
    useEffect(() => {
        if (vendors) {
            setLoading(false);
        }
    }, [vendors]);

    const fetchHistoryForVendor = useCallback(async (vendorId: string, applyFilters = false) => {
        if (!vendorId) {
            setPurchaseHistory([]);
            setInitialPurchaseHistory([]); // Clear initial state as well
            setIsFetching(false);
            return;
        }
        setIsFetching(true);
        try {
            const fromDate = applyFilters ? date?.from : undefined;
            const toDate = applyFilters ? date?.to : undefined;
            const history = await getPurchaseHistoryForVendor(vendorId, fromDate, toDate);
            setPurchaseHistory(history);
            setInitialPurchaseHistory(history); // Store initial state
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch purchase history.' });
        } finally {
            setIsFetching(false);
        }
    }, [date, toast]);
    
    useEffect(() => {
        if (selectedVendor) {
            fetchHistoryForVendor(selectedVendor, false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVendor]);

    const filteredHistory = useMemo(() => {
        if (!materialFilter) return purchaseHistory;
        return purchaseHistory.filter(po => 
            po.lineItems.some(item => item.material.toLowerCase().includes(materialFilter.toLowerCase()))
        );
    }, [purchaseHistory, materialFilter]);

    const handleFieldChange = (poId: string, field: keyof PurchaseOrder, value: any) => {
        setPurchaseHistory(prev =>
            prev.map(po => {
                if (po.id === poId) {
                    const updatedPo = { ...po, [field]: value };
                    const initialPo = initialPurchaseHistory.find(ipo => ipo.id === poId);
                    
                    // Correctly compare the initial state with the new state
                    const isNowDirty = JSON.stringify({ ...initialPo, isDirty: undefined }) !== JSON.stringify({ ...updatedPo, isDirty: undefined });

                    return { ...updatedPo, isDirty: isNowDirty };
                }
                return po;
            })
        );
    };

    const handleSaveChanges = () => {
        const updates = purchaseHistory
            .filter(po => po.isDirty)
            .map(po => ({
                poId: po.id,
                amountGiven: po.amountGiven,
                paymentStatus: po.paymentStatus,
            }));

        if (updates.length === 0) {
            toast({ title: 'No Changes', description: 'There are no changes to save.' });
            return;
        }

        startTransition(async () => {
            try {
                await updatePurchaseHistory(updates);
                toast({ title: 'Success', description: 'Purchase history has been updated.' });
                // Re-fetch or reset the dirty state after successful save
                const updatedCleanHistory = purchaseHistory.map(po => ({ ...po, isDirty: false }));
                setPurchaseHistory(updatedCleanHistory);
                setInitialPurchaseHistory(updatedCleanHistory);
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to save changes.' });
            }
        });
    };

    const dirtyChangesCount = purchaseHistory.filter(po => po.isDirty).length;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Purchase History Tracking</h1>
                <p className="text-muted-foreground">Review past purchase orders and transactions for each vendor.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter Options</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-sm font-medium">Select Vendor</label>
                        {loading ? <Skeleton className="h-10 mt-2" /> :
                        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                            <SelectTrigger>
                                <SelectValue placeholder={vendors.length > 0 ? "Select a vendor" : "No vendors available"} />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => (
                                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        }
                    </div>
                     <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-sm font-medium">Filter by Material</label>
                        <Input 
                            placeholder="e.g., Brass Ingots"
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-sm font-medium">Order Date Range</label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pick a date range</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-end h-full">
                         <Button onClick={() => fetchHistoryForVendor(selectedVendor, true)} disabled={isFetching || !selectedVendor}>
                            {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Purchase History for {vendors.find(v=>v.id === selectedVendor)?.name || '...'}</CardTitle>
                        <CardDescription>
                            Showing all purchase orders matching the filters.
                        </CardDescription>
                    </div>
                     <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Total Amount (₹)</TableHead>
                                <TableHead className="text-right">Amount Given (₹)</TableHead>
                                <TableHead>Order Status</TableHead>
                                <TableHead>Payment Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetching ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8}><Skeleton className="h-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredHistory.length > 0 ? (
                                filteredHistory.map((po) => (
                                    <TableRow key={po.id} className={cn(po.isDirty && 'bg-accent/50')}>
                                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                                        <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{po.lineItems.length}</TableCell>
                                        <TableCell className="text-right">{po.totalAmount.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-right">
                                            <Input
                                                type="number"
                                                defaultValue={po.amountGiven}
                                                onChange={(e) => handleFieldChange(po.id, 'amountGiven', Number(e.target.value))}
                                                className="w-32 ml-auto"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select defaultValue={po.paymentStatus} onValueChange={(value) => handleFieldChange(po.id, 'paymentStatus', value)}>
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Paid">Paid</SelectItem>
                                                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={`/dashboard/vendor/purchase-orders/${po.id}`} target="_blank">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View PO
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24">No purchase history found for the selected criteria.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button size="lg" onClick={handleSaveChanges} disabled={isPending || dirtyChangesCount === 0}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes {dirtyChangesCount > 0 && `(${dirtyChangesCount})`}
                </Button>
            </div>
        </div>
    );
}
    

    

    