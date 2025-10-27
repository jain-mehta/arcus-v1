
'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { Product, Store } from '@/lib/mock-data/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { transferStock } from '../actions';
import { useRouter } from 'next/navigation';

const lineItemSchema = z.object({
    productId: z.string().min(1, 'Please select a product.'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

const transferFormSchema = z.object({
    fromLocation: z.string().min(1, 'From location is required.'),
    toLocation: z.string().min(1, 'To location is required.'),
    lineItems: z.array(lineItemSchema).min(1, 'At least one product is required for transfer.'),
}).refine(data => data.fromLocation !== data.toLocation, {
    message: "From and To locations cannot be the same.",
    path: ["toLocation"],
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

interface StockTransfersClientProps {
    products: Product[];
    stores: Store[];
}

export function StockTransfersClient({ products: initialProducts, stores }: StockTransfersClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isSubmitting, startTransition] = useTransition();
    
    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferFormSchema),
        defaultValues: {
            fromLocation: 'Factory',
            toLocation: stores[0]?.id || '',
            lineItems: [{ productId: '', quantity: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lineItems"
    });

    const fromLocation = form.watch('fromLocation');

    const sourceProducts = useMemo(() => {
        if (fromLocation === 'Factory') {
            return products.filter(p => p.inventoryType === 'Factory');
        }
        return products.filter(p => p.inventoryType === 'Store' && p.storeId === fromLocation);
    }, [products, fromLocation]);

    const locationOptions = [
        { value: 'Factory', label: 'Factory' },
        ...stores.map(s => ({ value: s.id, label: `Store: ${s.name}`}))
    ];

    const onSubmit = (values: TransferFormValues) => {
        for (const item of values.lineItems) {
            const product = sourceProducts.find(p => p.id === item.productId);
            if (product && item.quantity > product.quantity) {
                toast({
                    variant: 'destructive',
                    title: 'Insufficient Stock',
                    description: `Cannot transfer ${item.quantity} units of ${product.name}. Only ${product.quantity} available.`,
                });
                return;
            }
        }

        startTransition(async () => {
            try {
                const result = await transferStock(values);
                if (result.success) {
                    toast({
                        title: 'Transfer Successful',
                        description: `Stock has been moved.`,
                    });
                    router.refresh();
                    form.reset({
                        fromLocation: 'Factory',
                        toLocation: stores[0]?.id || '',
                        lineItems: [{ productId: '', quantity: 1 }],
                    });
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Transfer Failed',
                    description: error.message || 'An unexpected error occurred.',
                });
            }
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-7 w-7" />
                    <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
                </div>
                <p className="text-muted-foreground">Move inventory between different locations (e.g., from factory to store).</p>
            </div>
            
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Stock Transfer</CardTitle>
                    <CardDescription>Select products and specify the transfer details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="fromLocation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Location</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {locationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="toLocation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To Location</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {locationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Products</h3>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start p-4 border rounded-md relative">
                                        <FormField
                                            control={form.control}
                                            name={`lineItems.${index}.productId`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1 w-full">
                                                    <FormLabel>Product</FormLabel>
                                                    {loadingProducts ? <Skeleton className="h-10" /> : (
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a product" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {sourceProducts.map(p => (
                                                                    <SelectItem key={p.id} value={p.id}>
                                                                        {p.name} (Stock: {p.quantity})
                                                                    </SelectItem>
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
                                            name={`lineItems.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem className="w-full md:w-32">
                                                    <FormLabel>Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Qty" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                            onClick={() => fields.length > 1 && remove(index)}
                                            disabled={fields.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ productId: '', quantity: 1 })}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Another Product
                                </Button>
                            </div>
                            
                            <Separator />

                            <Button type="submit" disabled={isSubmitting || loadingProducts} className="w-full">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Transfer Request'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}


