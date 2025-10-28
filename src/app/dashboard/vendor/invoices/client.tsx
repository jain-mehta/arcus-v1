
'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Upload, Download, FileText, Calendar as CalendarIcon, Loader2, MessageSquareWarning, Search } from 'lucide-react';
import type { Vendor, Invoice, PurchaseOrder } from '@/lib/mock-data/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { uploadInvoice, updateInvoice, getPurchaseOrders } from './actions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const uploadFormSchema = z.object({
    vendorId: z.string().min(1, 'Please select a vendor.'),
    poNumber: z.string().min(1, 'Please select a Purchase Order.'),
    invoiceDate: z.date({ required_error: "An invoice date is required." }),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    file: z.instanceof(File).refine(file => file.size > 0, 'File is required.'),
});
type UploadFormValues = z.infer<typeof uploadFormSchema>;

const discrepancySchema = z.object({
    discrepancy: z.string().min(10, "Please provide a detailed discrepancy comment."),
});
type DiscrepancyFormValues = z.infer<typeof discrepancySchema>;

interface InvoiceClientProps {
    vendors: Vendor[];
    initialInvoices: Invoice[];
}

export function InvoiceClient({ vendors, initialInvoices }: InvoiceClientProps) {
    const { toast } = useToast();
    const [allInvoices, setAllInvoices] = useState<Invoice[]>(initialInvoices);
    const [loading, setLoading] = useState(false); // Initial loading is now handled by server
    
    const [filterVendor, setFilterVendor] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<DateRange | undefined>();
    const [poFilter, setPoFilter] = useState('');

    useEffect(() => {
        setAllInvoices(initialInvoices);
    }, [initialInvoices]);
    
    const filteredInvoices = useMemo(() => {
        return allInvoices.filter(invoice => {
            const vendorMatch = filterVendor === 'all' || invoice.vendorId === filterVendor;
            const poMatch = !poFilter || invoice.poNumber.toLowerCase().includes(poFilter.toLowerCase());
            const dateMatch = (!filterDate?.from || new Date(invoice.invoiceDate) >= filterDate.from) &&
                              (!filterDate?.to || new Date(invoice.invoiceDate) <= filterDate.to);
            return vendorMatch && poMatch && dateMatch;
        });
    }, [allInvoices, filterVendor, filterDate, poFilter]);


    const getVendorName = (vendorId: string) => {
        return vendors.find(v => v.id === vendorId)?.name || 'N/A';
    }

    const onInvoiceUploaded = (newInvoice: Invoice) => {
        setAllInvoices(prev => [newInvoice, ...prev].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()));
    };

    const onDiscrepancyLogged = (updatedInvoice: Invoice) => {
        setAllInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
                <p className="text-muted-foreground">Upload, track, and manage all vendor invoices.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Filter Invoices</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-sm font-medium">Vendor</label>
                        <Select value={filterVendor} onValueChange={setFilterVendor}>
                            <SelectTrigger>
                                <SelectValue placeholder={vendors.length > 0 ? "All Vendors" : "No vendors available"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Vendors</SelectItem>
                                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-sm font-medium">Filter by PO Number</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Enter PO number..."
                                className="pl-9"
                                value={poFilter}
                                onChange={(e) => setPoFilter(e.target.value)}
                            />
                        </div>
                    </div>
                     <div className="flex-1 min-w-[240px] space-y-1.5">
                        <label className="text-sm font-medium">Invoice Date Range</label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filterDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filterDate?.from ? (filterDate.to ? <>{format(filterDate.from, "LLL dd, y")} - {format(filterDate.to, "LLL dd, y")}</> : format(filterDate.from, "LLL dd, y")) : <span>Pick a date range</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={filterDate?.from} selected={filterDate} onSelect={setFilterDate} numberOfMonths={2}/></PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Invoice List</CardTitle>
                        <CardDescription>A list of all uploaded invoices matching the filters.</CardDescription>
                    </div>
                    <UploadInvoiceDialog vendors={vendors} onInvoiceUploaded={onInvoiceUploaded} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>PO #</TableHead>
                                <TableHead>Invoice Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Discrepancy</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>
                                ))
                            ) : filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                                <TableRow key={inv.id}>
                                    <TableCell>{getVendorName(inv.vendorId)}</TableCell>
                                    <TableCell>{inv.poNumber}</TableCell>
                                    <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                                    <TableCell>₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell><Badge variant={inv.status === 'Paid' ? 'default' : inv.status === 'Overdue' ? 'destructive' : 'secondary'}>{inv.status}</Badge></TableCell>
                                    <TableCell>{inv.discrepancy || 'None'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <DiscrepancyDialog invoice={inv} onDiscrepancyLogged={onDiscrepancyLogged} />
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" /> View</a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">No invoices found for the selected filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


function UploadInvoiceDialog({ vendors, onInvoiceUploaded }: { vendors: Vendor[], onInvoiceUploaded: (newInvoice: Invoice) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    
    const form = useForm<UploadFormValues>({
        resolver: zodResolver(uploadFormSchema),
        defaultValues: { vendorId: '', poNumber: '', amount: 0 },
    });

    const vendorId = form.watch('vendorId');

    useEffect(() => {
        if (!vendorId) {
            setPurchaseOrders([]);
            form.resetField('poNumber');
            return;
        };

        const fetchPOs = async () => {
            const poList = await getPurchaseOrders(vendorId);
            setPurchaseOrders(poList);
        };

        fetchPOs();
    }, [vendorId, form]);

    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    async function onSubmit(data: UploadFormValues) {
        setIsSubmitting(true);
        try {
            const fileBase64 = await toBase64(data.file);
            const invoiceData = {
                vendorId: data.vendorId,
                poNumber: data.poNumber,
                invoiceDate: data.invoiceDate.toISOString(),
                amount: data.amount,
            };
            const newInvoice = await uploadInvoice(invoiceData, fileBase64, data.file.name);
            onInvoiceUploaded(newInvoice);
            toast({ title: 'Success', description: 'Invoice uploaded successfully.' });
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to upload invoice:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload invoice.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Upload className="mr-2 h-4 w-4" /> Upload Invoice</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Vendor Invoice</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="vendorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vendor</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="poNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Purchase Order</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!vendorId || purchaseOrders.length === 0}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a PO" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {purchaseOrders.map(po => <SelectItem key={po.id} value={po.poNumber}>{po.poNumber} - ₹{po.totalAmount.toLocaleString('en-IN')}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="invoiceDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Invoice Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Invoice Amount (?)</FormLabel>
                                    <FormControl><Input type="number" placeholder="Enter amount" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="file"
                            render={({ field: { onChange, name, ref } }) => (
                                <FormItem>
                                    <FormLabel>Invoice File</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="application/pdf,image/*"
                                            name={name}
                                            ref={ref}
                                            onChange={(e) => onChange(e.target.files?.[0])}
                                            value={undefined} // Make this an uncontrolled component
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upload
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DiscrepancyDialog({ invoice, onDiscrepancyLogged }: { invoice: Invoice, onDiscrepancyLogged: (invoice: Invoice) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<DiscrepancyFormValues>({
        resolver: zodResolver(discrepancySchema),
        defaultValues: { discrepancy: invoice.discrepancy || '' },
    });

    async function onSubmit(data: DiscrepancyFormValues) {
        setIsSubmitting(true);
        try {
            await updateInvoice(invoice.id, { discrepancy: data.discrepancy, status: 'Disputed' });
            onDiscrepancyLogged({ ...invoice, discrepancy: data.discrepancy, status: 'Disputed' });
            toast({ title: 'Success', description: 'Discrepancy logged successfully.' });
            setOpen(false);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to log discrepancy.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><MessageSquareWarning className="mr-2 h-4 w-4" /> Log</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Discrepancy for Invoice</DialogTitle>
                    <CardDescription>PO Number: {invoice.poNumber}</CardDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="discrepancy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discrepancy Details</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the issue (e.g., price mismatch, quantity incorrect)..." {...field} rows={4}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Discrepancy
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


