
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, CreditCard, ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Product, Customer } from '@/lib/firebase/types';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { createOrder } from '../../sales/actions';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';

const lineItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number(),
});

const billSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Bill must have at least one item.'),
  totalAmount: z.coerce.number(),
  discountPercentage: z.coerce.number().min(0, "Discount can't be negative.").max(100, "Discount can't be over 100%.").optional(),
});

type BillFormValues = z.infer<typeof billSchema>;

function ProductSearch({ products, onProductSelect }: { products: Product[], onProductSelect: (productId: string) => void }) {
    const [open, setOpen] = useState(false)
   
    const handleSelect = (productId: string) => {
        if (productId) {
            onProductSelect(productId);
        }
        setOpen(false);
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto"
          >
            Search for a product...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search product..." />
            <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                {products.map((product) => (
                    <CommandItem
                        key={product.id}
                        value={product.id}
                        onSelect={(currentValue) => {
                            handleSelect(currentValue);
                        }}
                        disabled={product.quantity === 0}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        "opacity-0"
                        )}
                    />
                    <div className="flex justify-between w-full">
                        <span>{product.name}</span>
                        <span className='text-muted-foreground'>Stock: {product.quantity}</span>
                    </div>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
}

export function BillingClient({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      customerId: '',
      customerName: '',
      customerAddress: '',
      customerEmail: '',
      customerPhone: '',
      lineItems: [],
      totalAmount: 0,
      discountPercentage: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const lineItems = form.watch('lineItems');
  const discountPercentage = form.watch('discountPercentage') || 0;

  const {subtotal, discountAmount, total} = useMemo(() => {
    const sub = lineItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const discAmount = (sub * discountPercentage) / 100;
    const subAfterDiscount = sub - discAmount;
    const tax = subAfterDiscount * 0.18;
    const finalTotal = subAfterDiscount + tax;
    return { subtotal: sub, discountAmount: discAmount, total: finalTotal };
  }, [lineItems, discountPercentage]);
  
  const taxAmount = total - (subtotal - discountAmount);


  useEffect(() => {
    form.setValue('totalAmount', total);
  }, [total, form]);

  const handleAddProduct = (productId: string) => {
    const existingItemIndex = fields.findIndex(
      (item) => item.productId === productId
    );
    const product = products.find((p) => p.id === productId);

    if (!product) return;

    if (existingItemIndex > -1) {
      const currentItem = fields[existingItemIndex];
      if (currentItem.quantity < product.quantity) {
        update(existingItemIndex, {
          ...currentItem,
          quantity: currentItem.quantity + 1,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Out of Stock',
          description: `Cannot add more of ${product.name}.`,
        });
      }
    } else {
      if (product.quantity > 0) {
        append({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.price,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Out of Stock',
          description: `${product.name} is currently out of stock.`,
        });
      }
    }
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const product = products.find(p => p.id === fields[index].productId);
    if (product && newQuantity > product.quantity) {
        toast({ variant: 'destructive', title: 'Stock limit reached' });
        update(index, { ...fields[index], quantity: product.quantity });
    } else if (newQuantity < 1) {
        remove(index);
    } else {
        update(index, { ...fields[index], quantity: newQuantity });
    }
  };
  
  const handleFinalizeBill = async (data: BillFormValues) => {
    setIsSubmitting(true);
    try {
        const orderPayload: any = {
            lineItems: data.lineItems,
            totalAmount: data.totalAmount,
            discountPercentage: data.discountPercentage,
        };

        if (data.customerId && data.customerId !== 'walk-in') {
            orderPayload.customerId = data.customerId;
        } else {
            // This is a walk-in with details
            orderPayload.customerId = 'walk-in-customer';
            orderPayload.customerDetails = {
                name: data.customerName,
                address: data.customerAddress,
                email: data.customerEmail,
                phone: data.customerPhone,
            };
        }

        const result = await createOrder(orderPayload);

        if (result.success && result.orderId) {
            toast({
                title: 'Bill Finalized',
                description: `Order ${result.orderId} created. Redirecting to print preview...`,
            });
            router.push(`/dashboard/sales/orders/${result.orderId}`);
        } else {
            throw new Error(result.message || "Failed to create order.");
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
        });
        setIsSubmitting(false);
    }
  };
  
  const selectedCustomerId = form.watch('customerId');

  useEffect(() => {
    if (selectedCustomerId && selectedCustomerId !== 'walk-in') {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
            form.setValue('customerName', customer.name);
            form.setValue('customerEmail', customer.email);
            form.setValue('customerPhone', customer.phone);
            form.setValue('customerAddress', customer.address || '');
        }
    } else {
         form.setValue('customerName', '');
         form.setValue('customerEmail', '');
         form.setValue('customerPhone', '');
         form.setValue('customerAddress', '');
    }
  }, [selectedCustomerId, customers, form]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Product Selection</CardTitle>
          <CardDescription>Add products to the bill by searching.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex gap-4">
                <ProductSearch onProductSelect={handleAddProduct} products={products} />
            </div>

             <div className="mt-6 border rounded-lg max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead className="w-[50%]">Product</TableHead>
                            <TableHead className="w-24">Price</TableHead>
                            <TableHead className="w-32">Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                     <TableBody>
                        {fields.length > 0 ? (
                            fields.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>₹{item.unitPrice.toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                                            className="w-20 text-center"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    No products added to the bill yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
        </CardContent>
      </Card>

       <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFinalizeBill)}>
            <div className="sticky top-20 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Registered Customer</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a customer (optional)" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="walk-in">Walk-in / New Customer</SelectItem>
                                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                         <Separator />
                        <p className="text-sm text-muted-foreground">Or, enter details for a new customer:</p>
                        <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Name / Company</FormLabel><FormControl><Input {...field} disabled={!!selectedCustomerId && selectedCustomerId !== 'walk-in'} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="customerAddress" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} disabled={!!selectedCustomerId && selectedCustomerId !== 'walk-in'} /></FormControl></FormItem>)} />
                         <FormField control={form.control} name="customerEmail" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled={!!selectedCustomerId && selectedCustomerId !== 'walk-in'} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} disabled={!!selectedCustomerId && selectedCustomerId !== 'walk-in'} /></FormControl></FormItem>)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard /> Bill Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="discountPercentage"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Discount (%)</Label>
                                    <Input type="number" placeholder="0" {...field} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between text-destructive"><span className="text-muted-foreground">Discount</span><span>- ₹{discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" size="lg" disabled={fields.length === 0 || isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                            Finalize Bill
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </form>
       </Form>
    </div>
  );
}
