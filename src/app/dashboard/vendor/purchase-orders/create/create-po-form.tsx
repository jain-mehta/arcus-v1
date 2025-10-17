
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { createPurchaseOrder, getMaterialMappings } from './actions';
import { toast } from '@/hooks/use-toast';
import { useTransition, useState, useEffect } from 'react';
import type { Vendor, MaterialMapping } from '@/lib/firebase/types';

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <FormLabel>
        {children} <span className="text-destructive">*</span>
    </FormLabel>
);

const lineItemSchema = z.object({
  material: z.string().min(1, 'Material is required.'),
  sku: z.string().min(1, 'SKU is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative.'),
});

const poSchema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor.'),
  poNumber: z.string().min(1, 'PO Number is required.'),
  orderDate: z.string().min(1, 'Order date is required.'),
  deliveryDate: z.string().min(1, 'Expected delivery date is required.'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required.'),
  shippingAddress: z.string().min(1, 'Shipping address is required.'),
  notes: z.string().optional(),
  totalAmount: z.coerce.number(),
});

type POFormValues = z.infer<typeof poSchema>;

interface CreatePOFormProps {
    vendors: Vendor[];
}

export function CreatePOForm({ vendors }: CreatePOFormProps) {
  const [isPending, startTransition] = useTransition();
  const [vendorMaterials, setVendorMaterials] = useState<MaterialMapping[]>([]);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      poNumber: `PO-${Date.now()}`,
      orderDate: new Date().toISOString().split('T')[0],
      lineItems: [{ material: '', sku: '', quantity: 1, unitPrice: 0 }],
      shippingAddress: 'Bobs Bath Fittings Pvt Ltd, 123 Industrial Area, New Delhi, 110020',
      notes: '',
      totalAmount: 0,
    },
    mode: 'onChange',
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "lineItems"
  });

  const vendorId = form.watch('vendorId');
  
  useEffect(() => {
    async function fetchVendorMaterials() {
        if (vendorId) {
            const materials = await getMaterialMappings(vendorId);
            setVendorMaterials(materials);
        } else {
            setVendorMaterials([]);
        }
        form.setValue('lineItems', [{ material: '', sku: '', quantity: 1, unitPrice: 0 }]);
    }
    fetchVendorMaterials();
  }, [vendorId, form]);

  const lineItems = form.watch('lineItems');
  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.18; // Assuming 18% GST
  const total = subtotal + tax;
  
  useEffect(() => {
    form.setValue('totalAmount', total);
  }, [total, form]);

  function onSubmit(data: POFormValues) {
    startTransition(async () => {
      try {
        await createPurchaseOrder(data);
        toast({
          title: 'Purchase Order Created',
          description: `PO #${data.poNumber} has been successfully created and submitted for approval.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create purchase order. Please try again.',
        });
      }
    });
  }
  
  const handleMaterialChange = (index: number, materialId: string) => {
    const material = vendorMaterials.find(m => m.id === materialId);
    if (material) {
        update(index, {
            ...lineItems[index],
            material: material.material,
            sku: material.sku,
            unitPrice: material.unitPrice,
        });
    }
  };

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>PO Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                          control={form.control}
                          name="vendorId"
                          render={({ field }) => (
                              <FormItem>
                              <RequiredLabel>Vendor</RequiredLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a vendor" />
                                  </SelectTrigger>
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
                            <RequiredLabel>PO Number</RequiredLabel>
                            <FormControl>
                                <Input placeholder="Enter PO number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="orderDate"
                        render={({ field }) => (
                            <FormItem>
                            <RequiredLabel>Order Date</RequiredLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deliveryDate"
                        render={({ field }) => (
                            <FormItem>
                            <RequiredLabel>Expected Delivery Date</RequiredLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex flex-col md:flex-row gap-4 items-end p-4 border rounded-md">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.material`}
                                    render={() => (
                                        <FormItem className="flex-1 w-full">
                                        <RequiredLabel>Material</RequiredLabel>
                                        <Select 
                                            onValueChange={(value) => handleMaterialChange(index, value)}
                                            disabled={!vendorId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a material" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {vendorMaterials.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.material}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.sku`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1 w-full md:w-auto">
                                        <RequiredLabel>SKU</RequiredLabel>
                                        <FormControl>
                                            <Input placeholder="SKU" {...field} readOnly />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem className="w-full md:w-24">
                                        <RequiredLabel>Quantity</RequiredLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.unitPrice`}
                                    render={({ field }) => (
                                        <FormItem className="w-full md:w-32">
                                        <RequiredLabel>Unit Price (₹)</RequiredLabel>
                                        <FormControl>
                                            <Input type="number" {...field} readOnly/>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="w-full md:w-20 text-left md:text-right">
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="font-medium">₹{(form.watch(`lineItems.${index}.quantity`) * form.watch(`lineItems.${index}.unitPrice`)).toLocaleString('en-IN')}</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => append({ material: '', sku: '', quantity: 1, unitPrice: 0 })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Line Item
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col items-end gap-2">
                    <div className="w-full max-w-xs space-y-1">
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">GST (18%)</span>
                            <span>₹{tax.toLocaleString('en-IN')}</span>
                        </div>
                        <Separator />
                         <div className="flex justify-between font-semibold text-base">
                            <span>Total</span>
                            <span>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>Shipping & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="shippingAddress"
                        render={({ field }) => (
                            <FormItem>
                            <RequiredLabel>Shipping Address</RequiredLabel>
                            <FormControl>
                                <Textarea placeholder="Enter shipping address" {...field} />
                            </FormControl>
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
                                <Textarea placeholder="Add any notes for the vendor" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>


            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" disabled={isPending}>Save as Draft</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit PO for Approval
                </Button>
            </div>
        </form>
      </Form>
  )
}

    