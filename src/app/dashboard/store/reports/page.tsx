
'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStoreReportData } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState, useTransition, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileBarChart, Check, ChevronsUpDown, X, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import type { Store } from '@/lib/mock-data/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ReportData {
    salesByStoreChartData: { name: string; sales: number }[];
    topSellingProductsTableData: {
        productName: string;
        sku: string;
        brand: string;
        series: string;
        totalUnitsSold: number;
        salesByStore: Record<string, number>;
    }[];
    stores: Store[];
    selectedStores: Store[];
}

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
}

function MultiSelect({ options, selected, onChange, className, placeholder = "Select..." }: MultiSelectProps) {
    const [open, setOpen] = useState(false);

    const handleSelectAll = () => {
        onChange(options.map(option => option.value));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    const handleToggle = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleUnselect = (e: React.MouseEvent, value: string) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(selected.filter((item) => item !== value));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto min-h-10", className)}
                >
                    <div className="flex gap-1 flex-wrap items-center">
                        {selected.length > 0 ? (
                            options
                                .filter((option) => selected.includes(option.value))
                                .slice(0, 3)
                                .map((option) => (
                                    <Badge
                                        variant="secondary"
                                        key={option.value}
                                        className="mr-1"
                                        onClick={(e) => handleUnselect(e, option.value)}
                                    >
                                        {option.label}
                                        <span className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </span>
                                    </Badge>
                                ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        {selected.length > 3 && (
                            <Badge variant="outline">+{selected.length - 3} more</Badge>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <div className='flex items-center justify-between p-1'>
                                <Button variant="link" size="sm" onClick={handleSelectAll} className="w-full justify-start">Select All</Button>
                                <Button variant="link" size="sm" onClick={handleClearAll} className="w-full justify-end text-destructive">Clear All</Button>
                            </div>
                            <Separator />
                            <ScrollArea className="h-48">
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleToggle(option.value)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </ScrollArea>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function StoreReportsPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFiltering, startFiltering] = useTransition();
    const [allStores, setAllStores] = useState<Store[]>([]);
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const fetchReportData = useCallback(async (storeIds?: string[], date?: DateRange) => {
        setLoading(true);
        try {
            const data = await getStoreReportData(storeIds, date ? { from: date.from, to: date.to } : undefined);
            if (reportData === null) {
                setAllStores(data.stores);
                setSelectedStoreIds(data.stores.map(s => s.id));
            }
            setReportData(data);
        } catch (error) {
            console.error("Failed to fetch report data", error);
        } finally {
            setLoading(false);
        }
    }, [reportData]);

    useEffect(() => {
        fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilter = useCallback(() => {
        startFiltering(() => {
            fetchReportData(selectedStoreIds, dateRange);
        });
    }, [fetchReportData, selectedStoreIds, dateRange]);

    const handleClearFilters = useCallback(() => {
        startFiltering(() => {
            setSelectedStoreIds(allStores.map(s => s.id));
            setDateRange(undefined);
            fetchReportData();
        });
    }, [fetchReportData, allStores]);

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><FileBarChart /> Store Reports & Comparison</h1>
                <p className="text-muted-foreground">Compare sales and product performance across all store locations.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Select stores and a date range to generate reports.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-end gap-4">
                    <div className="w-full max-w-xs">
                        <Label>Stores</Label>
                        <MultiSelect
                            options={allStores.map(s => ({ value: s.id, label: s.name }))}
                            selected={selectedStoreIds}
                            onChange={setSelectedStoreIds}
                            placeholder="Select stores to compare..."
                        />
                    </div>
                     <div className="w-full max-w-xs">
                        <Label>Date Range</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
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
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleFilter} disabled={isFiltering || loading}>
                        {isFiltering || loading ? <Loader2 className="animate-spin" /> : "Apply Filter"}
                    </Button>
                     <Button onClick={handleClearFilters} disabled={isFiltering || loading} variant="ghost">
                        Clear
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Total Sales Revenue by Store</CardTitle>
                    <CardDescription>A comparison of the total revenue generated by each selected store.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    {loading || !reportData ? (
                        <Skeleton className="w-full h-full" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.salesByStoreChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `?${(value / 1000).toLocaleString()}k`} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                                    formatter={(value: number) => `?${value.toLocaleString()}`}
                                />
                                <Bar dataKey="sales" fill="hsl(var(--primary))" name="Total Revenue" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Top Selling Products by Store</CardTitle>
                    <CardDescription>Units sold for top products across the selected store locations.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading || !reportData ? (
                        <div className="space-y-2">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-8 w-full" />
                           <Skeleton className="h-8 w-full" />
                           <Skeleton className="h-8 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/3">Product</TableHead>
                                    <TableHead>Brand & Series</TableHead>
                                    <TableHead className="text-center font-semibold">Overall</TableHead>
                                    {reportData.selectedStores.map(store => (
                                        <TableHead key={store.id} className="text-center">{store.city}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.topSellingProductsTableData.length > 0 ? (
                                    reportData.topSellingProductsTableData.map(product => (
                                    <TableRow key={product.sku}>
                                        <TableCell className="font-medium">{product.productName}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Badge variant="outline" className="mb-1 w-fit">{product.brand}</Badge>
                                                <Badge variant="secondary" className="w-fit">{product.series}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold">{product.totalUnitsSold}</TableCell>
                                        {reportData.selectedStores.map(store => (
                                            <TableCell key={store.id} className="text-center">
                                                {product.salesByStore[store.id] || 0}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3 + reportData.selectedStores.length} className="h-24 text-center">
                                            No product sales data for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}


