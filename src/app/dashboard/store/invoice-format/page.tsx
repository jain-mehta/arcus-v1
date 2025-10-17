
'use client';

import { useState, useTransition, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrintableInvoice } from "../components/printable-invoice";
import { PrintableThermalReceipt } from '../components/printable-thermal-receipt';
import { PrintablePackingSlip } from '../components/printable-packing-slip';
import { PrintableDeliveryChallan } from '../components/printable-delivery-challan';
import type { Order, Store, InvoiceTemplate } from '@/lib/firebase/types';
import { getStores, updateStore } from "../manage/actions";
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  invoiceTemplate: z.enum(['A4', 'thermal', 'Packing Slip', 'Delivery Challan']),
  
  // Shared Details
  name: z.string().min(2, 'Store name is required.'),
  address: z.string().min(3, 'Address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  pincode: z.string().length(6, 'Pincode must be 6 digits.'),
  contact: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().length(15, 'GSTIN must be 15 characters.').optional().or(z.literal('')),

  // Template-specific details
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MASTER_FORMAT_ID = 'master-format';

// Mock master format data.
const MOCK_MASTER_STORE: Store = {
    id: MASTER_FORMAT_ID,
    name: 'Bobs Bath Fittings Pvt Ltd (Master)',
    address: 'X-18, UPSIDC-IA, G. T. ROAD, ETAH',
    city: 'Etah',
    state: 'Uttar Pradesh',
    pincode: '207001',
    region: 'National',
    cashInHand: 0,
    cashAlertThreshold: 0,
    contact: '+91-9810045456',
    email: 'thebobs06@gmail.com',
    gstin: '09ABKPJ5249B2ZO',
    receiptHeader: 'Tax Invoice',
    receiptFooter: 'This is a Computer Generated Invoice',
    invoiceTemplate: 'A4',
};


function InvoiceFormatEditor() {
  const searchParams = useSearchParams();
  const storeParam = searchParams.get('store');

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(MASTER_FORMAT_ID);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const formWatcher = form.watch();

  const selectedStore = selectedStoreId === MASTER_FORMAT_ID 
    ? MOCK_MASTER_STORE 
    : stores.find(s => s.id === selectedStoreId);

  useEffect(() => {
    async function loadStores() {
      setLoading(true);
      try {
        const fetchedStores = await getStores();
        setStores(fetchedStores);
        
        const storeToSelect = storeParam || MASTER_FORMAT_ID;
        setSelectedStoreId(storeToSelect);
        
        const initialData = storeToSelect === MASTER_FORMAT_ID
            ? MOCK_MASTER_STORE
            : fetchedStores.find(s => s.id === storeToSelect);

        if (initialData) {
          form.reset({
            invoiceTemplate: initialData.invoiceTemplate || 'A4',
            name: initialData.name,
            address: initialData.address,
            city: initialData.city,
            state: initialData.state,
            pincode: initialData.pincode,
            contact: initialData.contact || '',
            email: initialData.email || '',
            gstin: initialData.gstin || '',
            receiptHeader: initialData.receiptHeader || '',
            receiptFooter: initialData.receiptFooter || '',
          });
        }
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load store data.'
        });
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, [form, toast, storeParam]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    const store = storeId === MASTER_FORMAT_ID ? MOCK_MASTER_STORE : stores.find(s => s.id === storeId);
    if (store) {
      form.reset({
        invoiceTemplate: store.invoiceTemplate || 'A4',
        name: store.name,
        address: store.address,
        city: store.city,
        state: store.state,
        pincode: store.pincode,
        contact: store.contact || '',
        email: store.email || '',
        gstin: store.gstin || '',
        receiptHeader: store.receiptHeader || '',
        receiptFooter: store.receiptFooter || '',
      });
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!selectedStore) return;

    startSaving(async () => {
        try {
            const result = await updateStore(selectedStore.id, data);
            if (result.success) {
                toast({
                    title: 'Format Updated',
                    description: `Invoice format for ${selectedStore.name} has been saved.`,
                });
                if (selectedStoreId !== MASTER_FORMAT_ID) {
                    setStores(prev => prev.map(s => s.id === selectedStore.id ? {...s, ...data} : s));
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update invoice format.',
            });
        }
    });
  }


  // Create mock data just for the preview
  const mockOrder: Order = {
    id: 'ord-preview',
    ownerId: 'user-preview',
    orderNumber: 'STORE-PREVIEW-001',
    customerId: 'cust-preview',
    orderDate: new Date().toISOString(),
    status: 'Delivered',
    lineItems: [
        { productId: 'p1', name: 'SAANCHIGHEE1L', sku: 'SKU001', quantity: 1, unitPrice: 290.00 },
        { productId: 'p2', name: 'EVEREST SAMBAR MASAL', sku: 'SKU002', quantity: 1, unitPrice: 34.00 },
        { productId: 'p3', name: 'VIVEL ST SFT 100GMX3', sku: 'SKU003', quantity: 1, unitPrice: 54.00 },
    ],
    discountPercentage: 1.06, // Approx 4.00 on 378.00
    totalAmount: 374.00,
    storeId: selectedStore?.id,
  };

  const mockCustomer = {
    id: 'cust-preview',
    name: 'CUSTOMER NAME',
    address: 'CUSTOMER ADDRESS, CITY, STATE, PINCODE',
  };

  const currentTemplate = formWatcher.invoiceTemplate || 'A4';

  const renderPreview = () => {
    const previewStoreData = { ...(selectedStore || {}), ...formWatcher } as Store;

    switch (currentTemplate) {
      case 'thermal':
        return <PrintableThermalReceipt order={mockOrder} customer={mockCustomer} store={previewStoreData} />;
      case 'Packing Slip':
        return <PrintablePackingSlip order={mockOrder} customer={mockCustomer} store={previewStoreData} />;
      case 'Delivery Challan':
        return <PrintableDeliveryChallan order={mockOrder} customer={mockCustomer} store={previewStoreData} />;
      case 'A4':
      default:
        return <PrintableInvoice order={mockOrder} customer={mockCustomer} store={previewStoreData} />;
    }
  };

  return (
    <div className="space-y-8">
       <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Format Editor</h1>
            <p className="text-muted-foreground">Select a store to customize its printed invoice details, or choose the master format.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Format to Edit</CardTitle>
                        <CardDescription>Choose "Master Format" or a specific store.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-10 max-w-sm" /> :
                            <Select onValueChange={handleStoreChange} value={selectedStoreId || ''}>
                                <SelectTrigger className="w-full max-w-sm">
                                    <SelectValue placeholder="Select a format to edit..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={MASTER_FORMAT_ID}>Master Invoice Format</SelectItem>
                                    <Separator className="my-1" />
                                    {stores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        }
                    </CardContent>
                </Card>

                {loading ? <Skeleton className="h-[500px]" /> : selectedStore && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>2. Edit Details for {selectedStore.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="invoiceTemplate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Invoice Template</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="A4">A4 Full Page</SelectItem>
                                                        <SelectItem value="thermal">Thermal Receipt (3-inch)</SelectItem>
                                                        <SelectItem value="Packing Slip">Packing Slip</SelectItem>
                                                        <SelectItem value="Delivery Challan">Delivery Challan</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>Choose the print format for this store's invoices.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Separator />
                                     <h3 className='text-lg font-semibold pt-2'>Shared Details</h3>
                                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Store Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="pincode" render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="contact" render={({ field }) => (<FormItem><FormLabel>Contact No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <FormField control={form.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>GSTIN/UIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    
                                    <Separator />
                                    <h3 className='text-lg font-semibold pt-2'>Template-Specific Text</h3>
                                    <FormField
                                        control={form.control}
                                        name="receiptHeader"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Receipt Header Text</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Tax Invoice, Estimate..." {...field} />
                                                </FormControl>
                                                <FormDescription>This text appears at the very top of the selected invoice template.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="receiptFooter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Receipt Footer Text</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="e.g., Thank you for your business!" {...field} />
                                                </FormControl>
                                                <FormDescription>This text appears at the very bottom of the selected invoice template.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" /> Save Changes
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </Form>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>3. Live Preview</CardTitle>
                    <CardDescription>The invoice preview will update as you type.</CardDescription>
                </CardHeader>
                <CardContent className="bg-muted p-4">
                    <div className="p-4 bg-white shadow-lg w-full scale-90 origin-top">
                        {renderPreview()}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default function InvoiceFormatEditorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InvoiceFormatEditor />
        </Suspense>
    )
}
