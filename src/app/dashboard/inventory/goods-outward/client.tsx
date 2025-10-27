
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { PackageOpen, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/mock-data/types';
import { useToast } from '@/hooks/use-toast';
import { dispatchStock } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';

const dispatchFormSchema = z.object({
    productId: z.string().min(1, 'Please select a product.'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
    reason: z.string().min(3, 'A reason for dispatch is required.'),
});

type DispatchFormValues = z.infer<typeof dispatchFormSchema>;

interface GoodsOutwardClientProps {
    products: Product[];
}

export function GoodsOutwardClient({ products: initialProducts }: GoodsOutwardClientProps) {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isSubmitting, startTransition] = useTransition();
    
    const form = useForm<DispatchFormValues>({
        resolver: zodResolver(dispatchFormSchema),
        defaultValues: {
            productId: '',
            quantity: 1,
            reason: '',
        },
    });

    const onSubmit = (values: DispatchFormValues) => {
        const product = products.find(p => p.id === values.productId);
        if (product && values.quantity > product.quantity) {
            form.setError("quantity", { type: "manual", message: `Cannot dispatch more than available stock (${product.quantity}).` });
            return;
        }

        startTransition(async () => {
            const result = await dispatchStock(values.productId, values.quantity);
            if(result.success) {
                toast({ title: 'Success', description: `${values.quantity} units dispatched successfully.` });
                // Optimistically update the product quantity in the local state
                setProducts(prev => prev.map(p => p.id === values.productId ? { ...p, quantity: p.quantity - values.quantity } : p));
                form.reset();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message || 'Failed to dispatch stock.' });
            }
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2">
                    <PackageOpen className="h-7 w-7" />
                    <h1 className="text-3xl font-bold tracking-tight">Goods Outward</h1>
                </div>
                <p className="text-muted-foreground">Record stock being dispatched from inventory (e.g., for production, shipping).</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Dispatch Note</CardTitle>
                    <CardDescription>Select a product and enter the quantity to be removed from inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="productId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product</FormLabel>
                                        {loadingProducts ? <Skeleton className="h-10" /> : (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product to dispatch" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name} (SKU: {p.sku}) - Stock: {p.quantity}
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
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity Dispatched</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Enter quantity" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason for Dispatch</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="e.g., Issued for production batch #PB-123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting || loadingProducts} className="w-full">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Dispatch Stock'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}


