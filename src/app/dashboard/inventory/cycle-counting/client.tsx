
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ListChecks, PlusCircle, FileWarning, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/firebase/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import React, { useState, useMemo } from "react";
import * as z from 'zod';
import { Label } from "@/components/ui/label";

const initialPastCounts: { id: string; date: string; status: string; discrepancies: number; location: string; }[] = [];

const discrepancyLineItemSchema = z.object({
  productId: z.string().min(1, 'Please select a product.'),
  countedQuantity: z.coerce.number().int().min(0, 'Counted quantity cannot be negative.'),
});

const discrepancyFormSchema = z.object({
  discrepancies: z.array(discrepancyLineItemSchema).min(1, "At least one discrepancy is required."),
  reason: z.string().optional(),
});
type DiscrepancyFormValues = z.infer<typeof discrepancyFormSchema>;


const startCountFormSchema = z.object({
  location: z.string().min(1, 'Please select a location to audit.'),
  notes: z.string().optional(),
});
type StartCountFormValues = z.infer<typeof startCountFormSchema>;

interface CycleCountingClientProps {
    products: Product[];
}

export function CycleCountingClient({ products: initialProducts }: CycleCountingClientProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [pastCounts, setPastCounts] = useState(initialPastCounts);
  const [locationFilter, setLocationFilter] = useState<'Factory' | 'Store'>('Factory');

  const handleNewCountStarted = (newCount: any) => {
    setPastCounts(prev => [newCount, ...prev]);
  };
  
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.inventoryType === locationFilter);
  }, [products, locationFilter]);

  return (
    <div className="space-y-8">
        <div>
            <div className="flex items-center gap-2">
                <ListChecks className="h-7 w-7" />
                <h1 className="text-3xl font-bold tracking-tight">Cycle Counting & Auditing</h1>
            </div>
            <p className="text-muted-foreground">Schedule physical counts, log discrepancies, and reconcile your stock.</p>
        </div>

        <Card>
            <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Schedule a New Count</CardTitle>
                    <CardDescription>Initiate a new physical inventory count for a specific location.</CardDescription>
                </div>
                 <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <LogDiscrepancyDialog products={filteredProducts} location={locationFilter} />
                    <StartNewCountDialog onCountStarted={handleNewCountStarted} />
                </div>
            </CardHeader>
            <CardContent>
                 <div className="max-w-xs space-y-2">
                    <Label htmlFor="location-filter">Inventory Location</Label>
                    <Select value={locationFilter} onValueChange={(value) => setLocationFilter(value as 'Factory' | 'Store')}>
                        <SelectTrigger id="location-filter">
                            <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Factory">Factory</SelectItem>
                            <SelectItem value="Store">Store</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select a location before logging a discrepancy.</p>
                </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Cycle Count History</CardTitle>
                <CardDescription>Review past and ongoing inventory audits.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Count ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Discrepancies</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pastCounts.length > 0 ? (
                            pastCounts.map(count => (
                            <TableRow key={count.id}>
                                <TableCell className="font-medium">{count.id}</TableCell>
                                <TableCell>{count.date}</TableCell>
                                <TableCell>{count.location}</TableCell>
                                <TableCell>
                                    <Badge variant={count.status === 'Completed' ? 'default' : 'secondary'}>{count.status}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {count.discrepancies !== 0 ? (
                                        <Badge variant={count.discrepancies > 0 ? "destructive" : "outline"} className="gap-1.5 pl-1.5">
                                            <FileWarning className="h-3.5 w-3.5" />
                                            {count.discrepancies} items
                                        </Badge>
                                     ) : (
                                        <Badge variant="outline">None</Badge>
                                     )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">View Details</Button>
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No cycle count history found.
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


function LogDiscrepancyDialog({ products = [], location }: { products: Product[], location: 'Factory' | 'Store' }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<DiscrepancyFormValues>({
        resolver: zodResolver(discrepancyFormSchema),
        defaultValues: { discrepancies: [{ productId: '', countedQuantity: 0 }], reason: '' },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "discrepancies"
    });

    const onSubmit = (values: DiscrepancyFormValues) => {
        setIsSubmitting(true);
        console.log("Logging discrepancies:", values);
        setTimeout(() => {
             toast({
                title: 'Discrepancy Logged (Simulated)',
                description: `${values.discrepancies.length} item(s) have been recorded for ${location}.`,
            });
            setIsSubmitting(false);
            setOpen(false);
            form.reset({ discrepancies: [{ productId: '', countedQuantity: 0 }], reason: '' });
        }, 1000);
    };
    
    const loading = products.length === 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Log Discrepancy</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Log Inventory Discrepancies</DialogTitle>
                    <DialogDescription>
                        Record mismatches between the physical count and the system count for items in the <strong className='text-foreground'>{location}</strong> inventory.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
                             {fields.map((field, index) => {
                                return (
                                <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start p-4 border rounded-md relative">
                                    <FormField
                                        control={form.control}
                                        name={`discrepancies.${index}.productId`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1 w-full">
                                                <FormLabel>Product</FormLabel>
                                                {loading ? <Skeleton className="h-10" /> : (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a product" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {products.map(p => (
                                                                <SelectItem key={p.id} value={p.id}>{p.name} (Series: {p.series}, SKU: {p.sku}) - System: {p.quantity}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`discrepancies.${index}.countedQuantity`}
                                        render={({ field }) => (
                                            <FormItem className="w-full md:w-48">
                                                <FormLabel>Physically Counted</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button" variant="ghost" size="icon"
                                        className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                        onClick={() => fields.length > 1 && remove(index)}
                                        disabled={fields.length <= 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                             )})}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ productId: '', countedQuantity: 0 })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Another Product
                        </Button>
                         <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Discrepancy (Optional)</FormLabel>
                                    <FormControl><Textarea placeholder="e.g., Damaged items found, data entry error" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting || loading}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Log
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const locations = ['Factory Warehouse A', 'Factory Warehouse B', 'Store - Downtown', 'Store - Mall Outlet'];

function StartNewCountDialog({ onCountStarted }: { onCountStarted: (count: any) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<StartCountFormValues>({
        resolver: zodResolver(startCountFormSchema),
        defaultValues: { location: '', notes: '' },
    });

    const onSubmit = (values: StartCountFormValues) => {
        setIsSubmitting(true);
        // Simulate API call to create a new count
        setTimeout(() => {
            const newCount = {
                id: `CC-${String(Math.floor(Math.random() * 900) + 100)}`,
                date: new Date().toISOString().split('T')[0],
                status: 'In Progress',
                discrepancies: -1, // -1 can signify not yet counted
                location: values.location,
            };
            onCountStarted(newCount);
            toast({
                title: 'New Count Started (Simulated)',
                description: `Inventory count for ${values.location} has begun.`,
            });
            setIsSubmitting(false);
            setOpen(false);
            form.reset();
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Start New Count
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Start a New Cycle Count</DialogTitle>
                    <DialogDescription>
                        Choose a location to begin a physical inventory audit.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Inventory Location</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a location to audit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {locations.map(loc => (
                                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Auditing high-value items only." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm & Start
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    
