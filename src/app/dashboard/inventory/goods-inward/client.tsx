
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
import { Truck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addStock } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';

const grnFormSchema = z.object({
    productId: z.string().min(1, 'Please select a product.'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
    notes: z.string().optional(),
});

type GrnFormValues = z.infer<typeof grnFormSchema>;

interface GoodsInwardClientProps {
    products: Product[];
}

export function GoodsInwardClient({ products: initialProducts }: GoodsInwardClientProps) {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loadingProducts, setLoadingProducts] = useState(false); // No initial loading
    const [isSubmitting, startTransition] = useTransition();

    const form = useForm<GrnFormValues>({
        resolver: zodResolver(grnFormSchema),
        defaultValues: {
            productId: '',
            quantity: 1,
            notes: '',
        },
    });

    const onSubmit = (values: GrnFormValues) => {
        startTransition(async () => {
            const result = await addStock(values.productId, values.quantity);
            if (result.success) {
                toast({ title: 'Success', description: 'Stock added successfully.' });
                // Optimistically update the product quantity in the local state
                setProducts(prev => prev.map(p => p.id === values.productId ? { ...p, stock_quantity: (p.stock_quantity || 0) + values.quantity, quantity: (p.quantity || 0) + values.quantity } : p));
                form.reset();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: (result as any).message || 'Failed to add stock.' });
            }
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2">
                    <Truck className="h-7 w-7" />
                    <h1 className="text-3xl font-bold tracking-tight">Goods Inward (GRN)</h1>
                </div>
                <p className="text-muted-foreground">Record incoming stock from vendors or production.</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Goods Receipt Note</CardTitle>
                    <CardDescription>Select a product and enter the quantity being added to inventory.</CardDescription>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value} key={JSON.stringify(products)}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product to add stock" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name} (SKU: {p.sku}) - Stock: {p.stock_quantity || p.quantity || 0}
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
                                        <FormLabel>Quantity Received</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Enter quantity" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting || loadingProducts} className="w-full">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Stock to Inventory'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}



// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
