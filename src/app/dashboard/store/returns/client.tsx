

'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight, Search, Loader2, Printer } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { findOrderForReturn, processReturn } from './actions';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useReactToPrint } from 'react-to-print';
import { PrintableCreditNote } from '../components/printable-credit-note';
import { Label } from '@/components/ui/label';

const returnItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  originalQuantity: z.number(),
  returnQuantity: z.coerce.number().int().min(0),
  reason: z.enum(['defective', 'wrong_item', 'customer_unhappy', 'other']),
  action: z.enum(['return_to_inventory', 'mark_as_damaged']),
  unitPrice: z.coerce.number(),
});

const returnFormSchema = z.object({
  items: z.array(returnItemSchema)
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

interface ReturnsClientProps {
    isAdmin: boolean;
    allStores: Store[];
    userStoreId?: string;
}

export function ReturnsClient({ isAdmin, allStores, userStoreId }: ReturnsClientProps) {
    const { toast } = useToast();
    const [billNumber, setBillNumber] = useState('');
    const [foundOrder, setFoundOrder] = useState<any | null>(null);
    const [isSearching, startSearch] = useTransition();
    const [isProcessing, startProcessing] = useTransition();
    
    const [selectedStoreId, setSelectedStoreId] = useState<string>(userStoreId || (allStores[0] as any)?.id || '');

    const [processedReturnData, setProcessedReturnData] = useState<{order: any, returnedItems: any[]} | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onAfterPrint: () => setProcessedReturnData(null),
    });

    const form = useForm<ReturnFormValues>({
      resolver: zodResolver(returnFormSchema),
      defaultValues: { items: [] },
    });

    const { fields, replace } = useFieldArray({
      control: form.control,
      name: "items",
    });

    const resetState = useCallback(() => {
        setFoundOrder(null);
        setBillNumber('');
        replace([]);
    }, [replace]);

    const handleFindBill = () => {
        if (!selectedStoreId) {
            toast({ variant: 'destructive', title: "No Store Selected", description: "Please select a store to search for the bill." });
            return;
        }
        setProcessedReturnData(null);
        startSearch(async () => {
            const order = await findOrderForReturn(billNumber, selectedStoreId);
            if (order) {
                setFoundOrder(order);
                const itemsForForm = (order.lineItems || []).map((item: any) => ({
                    ...item,
                    originalQuantity: item.quantity,
                    returnQuantity: 0,
                    reason: 'defective' as const,
                    action: 'return_to_inventory' as const,
                }));
                replace(itemsForForm); // Using replace to reset the form array
                toast({ title: "Order Found", description: `Loaded items for order #${billNumber}` });
            } else {
                setFoundOrder(null);
                replace([]);
                toast({ variant: 'destructive', title: "Order Not Found", description: `No order found with bill number #${billNumber} for this store.` });
            }
        });
    };

    const handleProcessReturn = (data: ReturnFormValues) => {
        if (!foundOrder) return;
        
        const itemsToProcess = data.items
            .filter(item => item.returnQuantity > 0 && item.returnQuantity <= item.originalQuantity)
            .map(item => ({
                productId: item.productId,
                name: item.name,
                sku: item.sku,
                quantity: item.returnQuantity,
                action: item.action,
                unitPrice: item.unitPrice
            }));

        if (itemsToProcess.length === 0) {
            toast({ variant: 'destructive', title: "No items selected", description: "Please enter a quantity for at least one item to return." });
            return;
        }

        startProcessing(async () => {
            const result = await processReturn(foundOrder.id, itemsToProcess.map(i => ({productId: i.productId, quantity: i.quantity, action: i.action})));
            
            if (result.success) {
                setProcessedReturnData({ order: foundOrder, returnedItems: itemsToProcess });
                toast({ title: "Return Processed", description: "Inventory adjustments recorded. You can now print the credit note." });
                resetState();
            } else {
                 toast({ variant: 'destructive', title: "Error", description: result.message || "Failed to process the return." });
            }
        });
    }

    const store = processedReturnData ? allStores.find(s => s.id === processedReturnData.order.storeId) : null;

  return (
     <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ArrowLeftRight /> Returns &amp; Damaged Goods</h1>
        <p className="text-muted-foreground">Process customer returns and manage damaged inventory.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Customer Return</CardTitle>
          <CardDescription>Enter the original bill number to begin a return.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-end gap-4">
           {isAdmin && (
               <div className="flex-1 min-w-[200px] space-y-2">
                   <Label>Store</Label>
                   <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                       <SelectTrigger><SelectValue placeholder="Select a store" /></SelectTrigger>
                       <SelectContent>
                           {allStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                       </SelectContent>
                   </Select>
               </div>
           )}
           <div className="flex-1 min-w-[200px] space-y-2">
                <Label>Original Bill Number</Label>
                <Input 
                    placeholder="Enter bill number..." 
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                />
           </div>
           <Button onClick={handleFindBill} disabled={isSearching || !billNumber}>
               {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Find Bill
            </Button>
        </CardContent>
      </Card>
      
      {foundOrder ? (
         <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleProcessReturn)}>
                    <CardHeader>
                        <CardTitle>Return Items from Bill #{foundOrder.orderNumber}</CardTitle>
                        <CardDescription>Select items to return and specify the reason. Only items with a return quantity greater than 0 will be processed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Return Quantity</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {fields.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}<br /><span className="text-xs text-muted-foreground">Originally purchased: {item.originalQuantity}</span></TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.returnQuantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" {...field} max={item.originalQuantity} min={0} className="w-24"/>
                                                </FormControl>
                                                 <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.reason`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="w-48"><SelectValue/></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="defective">Defective</SelectItem>
                                                        <SelectItem value="wrong_item">Wrong Item</SelectItem>
                                                        <SelectItem value="customer_unhappy">Customer Unhappy</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.action`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="w-48"><SelectValue/></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="return_to_inventory">Return to Inventory</SelectItem>
                                                        <SelectItem value="mark_as_damaged">Mark as Damaged</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-6">
                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Process Return
                        </Button>
                    </div>
                    </CardContent>
                </form>
            </Form>
        </Card>
      ) : !isSearching && billNumber && (
          <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                  <p>Order "{billNumber}" was not found for the selected store.</p>
                  <p className="text-xs">Please verify the bill number and store selection.</p>
              </CardContent>
          </Card>
      )}

        {processedReturnData && (
            <Card>
                <CardHeader>
                    <CardTitle>Return Processed - Credit Note Ready</CardTitle>
                    <CardDescription>A credit note has been generated for order #{processedReturnData.order.orderNumber}. You can now print it.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-start gap-6">
                    <div className='flex-1 space-y-4'>
                        <h3 className="font-semibold">Returned Items:</h3>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {processedReturnData.returnedItems.map(item => (
                                <li key={item.productId}>{item.name} (Qty: {item.quantity})</li>
                            ))}
                        </ul>
                         <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Credit Note
                        </Button>
                    </div>
                     <div className="w-1/2 p-4 bg-muted border rounded-lg shadow-inner">
                        <h4 className="font-semibold text-center mb-2">Print Preview</h4>
                         <div className="bg-white p-2 border rounded shadow-sm scale-90 origin-top">
                            <PrintableCreditNote ref={printRef} data={processedReturnData} store={store} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}
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

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
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
