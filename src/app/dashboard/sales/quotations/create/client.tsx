'use client';

import React, { useState, useTransition, useEffect, useRef, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { FileText, PlusCircle, Trash2, Loader2, Printer, Send, Sparkles, WandSparkles } from 'lucide-react';
import type { Product, Customer, Quotation } from '@/lib/mock-data/types';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';
import { Icons } from '@/components/icons';
import { addQuotation, getCurrentUser } from '../../actions';
import { generateQuotation } from './actions';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';


const lineItemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  name: z.string(),
  sku: z.string(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  unitPrice: z.coerce.number(),
});

const quotationSchema = z.object({
  ownerId: z.string(),
  customerId: z.string().min(1, 'Please select a customer.'),
  quoteNumber: z.string().min(1, 'Quote Number is required.'),
  quoteDate: z.string().min(1, 'Quote date is required.'),
  expiryDate: z.string().min(1, 'Expiry date is required.'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required.'),
  totalAmount: z.coerce.number(),
  status: z.enum(['Draft', 'Awaiting Approval', 'Approved', 'Rejected', 'Expired']),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;

const aiAssistantSchema = z.object({
  prompt: z.string().min(10, "Please provide a detailed description of the items for the quote."),
});
type AiAssistantFormValues = z.infer<typeof aiAssistantSchema>;

interface CreateQuotationClientProps {
    products: Product[];
    customers: Customer[];
}

export function CreateQuotationClient({ products, customers }: CreateQuotationClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const printableComponentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => printableComponentRef.current,
        documentTitle: `Quotation-${Date.now()}`,
    });
    
    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 30);

    const form = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationSchema),
        defaultValues: {
            ownerId: '',
            quoteNumber: '',
            quoteDate: today.toISOString().split('T')[0],
            expiryDate: expiry.toISOString().split('T')[0],
            lineItems: [{ productId: '', name: '', sku: '', quantity: 1, unitPrice: 0 }],
            totalAmount: 0,
            status: 'Awaiting Approval',
            customerId: '',
            discountPercentage: 0,
        },
        mode: 'onChange',
    });

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            form.setValue('ownerId', user?.id || '');
        };
        fetchUser();
        // Set quote number on client-side to avoid hydration mismatch
        form.setValue('quoteNumber', `QT-${Date.now()}`);
    }, [form]);

    const { fields, append, remove, update, replace } = useFieldArray({
        control: form.control,
        name: "lineItems"
    });

    const lineItems = form.watch('lineItems');
    const discountPercentage = form.watch('discountPercentage') || 0;
    
    const { subtotal, discountAmount, total } = useMemo(() => {
        const sub = (lineItems || []).reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const discAmount = sub * (discountPercentage / 100);
        const subAfterDiscount = sub - discAmount;
        const tax = subAfterDiscount * 0.18; // Assuming 18% GST
        const finalTotal = subAfterDiscount + tax;
        return { subtotal: sub, discountAmount: discAmount, total: finalTotal };
    }, [lineItems, discountPercentage]);

    const tax = total - (subtotal - discountAmount);

    const formValues = form.getValues();

    useEffect(() => {
        form.setValue('totalAmount', total);
    }, [total, form]);

    function onSubmit(data: QuotationFormValues) {
        startTransition(async () => {
            const result = await addQuotation(data);
            if (result.success) {
                toast({
                    title: 'Quotation Submitted',
                    description: `Quotation #${data.quoteNumber} has been saved and is awaiting approval.`,
                });
                router.push('/dashboard/sales/quotations');
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to submit quotation.',
                });
            }
        });
    }
    
    const handleProductChange = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            update(index, {
                ...lineItems[index],
                productId: product.id,
                name: product.name,
                sku: product.sku,
                unitPrice: product.price,
            });
        }
    };

    const onAiGenerate = (generatedQuote: any) => {
        replace(generatedQuote.lineItems);
        form.setValue('totalAmount', generatedQuote.totalAmount);
    }
    
    const isPrintDisabled = !form.formState.isValid || isPending;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Create Quotation</h1>
          </div>
          <p className="text-muted-foreground">Build and send professional quotations to your customers.</p>
        </div>
         <AiAssistantDialog
            customerId={form.watch('customerId')}
            onGenerate={onAiGenerate}
            disabled={!form.watch('customerId')}
        />
      </div>
      
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Quotation Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                          control={form.control}
                          name="customerId"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                          )}
                      />
                    <FormField control={form.control} name="quoteNumber" render={({ field }) => (<FormItem><FormLabel>Quote Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="quoteDate" render={({ field }) => (<FormItem><FormLabel>Quote Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="expiryDate" render={({ field }) => (<FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price (?)</TableHead>
                                <TableHead>Total (?)</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField control={form.control} name={`lineItems.${index}.productId`} render={() => (
                                            <FormItem>
                                                <Select onValueChange={(value) => handleProductChange(index, value)} value={field.productId || ''}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={`lineItems.${index}.sku`} render={({ field }) => <Input {...field} value={field.value || ''} readOnly />} />
                                    </TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => <Input type="number" {...field} value={field.value || 1} />} />
                                    </TableCell>
                                    <TableCell>
                                         <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => <Input type="number" {...field} value={field.value || 0} readOnly />} />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        ?{(lineItems[index]?.quantity * lineItems[index]?.unitPrice).toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ productId: '', name: '', sku: '', quantity: 1, unitPrice: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-end bg-muted/50 p-6">
                    <div className="w-full max-w-sm space-y-4">
                        <FormField
                            control={form.control}
                            name="discountPercentage"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-2 items-center">
                                <FormLabel>Discount (%)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0" {...field} className="w-24 ml-auto" />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="w-full space-y-2">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>?{subtotal.toLocaleString('en-IN')}</span></div>
                            {discountAmount > 0 && <div className="flex justify-between text-destructive"><span className="text-muted-foreground">Discount</span><span>- ?{discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>?{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>?{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={handlePrint} disabled={isPrintDisabled}>
                    <Printer className="mr-2" /> Print / Export PDF
                </Button>
                <Button type="submit" disabled={isPending || !form.formState.isValid}>
                  {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                  Submit for Approval
                </Button>
            </div>
        </form>
       </Form>

       <div className="hidden">
            <PrintableQuotation
                ref={printableComponentRef}
                data={formValues}
                customer={customers.find(c => c.id === formValues.customerId)}
                subtotal={subtotal}
                discountAmount={discountAmount}
                tax={tax}
                total={total}
            />
       </div>
    </div>
  );
}


function AiAssistantDialog({ customerId, onGenerate, disabled }: { customerId: string, onGenerate: (quote: any) => void, disabled: boolean }) {
    const [open, setOpen] = useState(false);
    const [isGenerating, startGenerating] = useTransition();
    const { toast } = useToast();
    
    const form = useForm<AiAssistantFormValues>({
        resolver: zodResolver(aiAssistantSchema),
        defaultValues: {
            prompt: "Please prepare a quote for 10 Solo series faucets and 5 Galaxy series shower heads."
        }
    });

    const handleSubmit = async (values: AiAssistantFormValues) => {
        startGenerating(async () => {
            try {
                const result = await generateQuotation(customerId, values.prompt);
                onGenerate(result);
                toast({
                    title: "Quotation Generated!",
                    description: "The line items have been populated from your prompt."
                });
                setOpen(false);
            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: "Generation Failed",
                    description: "The AI assistant failed to generate the quotation. Please try again."
                });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <WandSparkles className="mr-2 h-4 w-4" />
                    AI Assistant
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Quotation Assistant
                    </DialogTitle>
                    <DialogDescription>
                       Describe the products and quantities you want in the quote. The AI will find the products and fill out the line items for you.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Request</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g., 'Draft a quote for two deluxe chrome faucets and one overhead rain shower system.'"
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isGenerating}>
                                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Items
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}



// Printable component
interface PrintableQuotationProps {
    data: QuotationFormValues;
    customer?: Customer;
    subtotal: number;
    discountAmount: number;
    tax: number;
    total: number;
}

const PrintableQuotation = React.forwardRef<HTMLDivElement, PrintableQuotationProps>(
    ({ data, customer, subtotal, discountAmount, tax, total }, ref) => {
        return (
            <div ref={ref} className="p-10 bg-white text-black font-sans">
                <header className="flex justify-between items-start pb-6 border-b-2 border-gray-800">
                    <div className="flex items-center gap-4">
                         <Icons.logo className="h-12 w-12 text-gray-800" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Bobs Bath Fittings Pvt Ltd</h1>
                            <p className="text-sm">UPSIDC-IA, X-18, GT Rd, Etah, Dalelpur, Uttar Pradesh 207003</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-bold uppercase text-gray-800">Quotation</h2>
                        <p className="text-sm"># {data.quoteNumber}</p>
                    </div>
                </header>

                <section className="grid grid-cols-2 gap-8 my-6">
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Bill To:</h3>
                        <p className="font-bold">{customer?.name || 'N/A'}</p>
                        <p>{customer?.contact}</p>
                        <p>{customer?.email}</p>
                    </div>
                    <div className="text-right">
                        <dl className="grid grid-cols-2 gap-x-4">
                            <dt className="font-semibold">Quote Date:</dt>
                            <dd>{new Date(data.quoteDate).toLocaleDateString()}</dd>
                            <dt className="font-semibold">Expiry Date:</dt>
                            <dd>{new Date(data.expiryDate).toLocaleDateString()}</dd>
                        </dl>
                    </div>
                </section>

                <section>
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-sm font-semibold uppercase">Product</th>
                                <th className="p-3 text-sm font-semibold uppercase text-right">Quantity</th>
                                <th className="p-3 text-sm font-semibold uppercase text-right">Unit Price</th>
                                <th className="p-3 text-sm font-semibold uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.lineItems || []).map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-3">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                    </td>
                                    <td className="p-3 text-right">{item.quantity}</td>
                                    <td className="p-3 text-right">?{item.unitPrice.toLocaleString('en-IN')}</td>
                                    <td className="p-3 text-right font-medium">?{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
                <section className="flex justify-end mt-6">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>?{subtotal.toLocaleString('en-IN')}</span></div>
                        {discountAmount > 0 && <div className="flex justify-between text-destructive"><span className="text-gray-600">Discount</span><span>- ?{discountAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>}
                        <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span>?{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                        <div className="border-t-2 border-gray-800 my-2"></div>
                        <div className="flex justify-between font-bold text-lg"><span className="text-gray-800">Total</span><span>?{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
                    </div>
                </section>

                <footer className="mt-12 pt-6 border-t-2 border-gray-800 text-center text-xs text-gray-500">
                    <p>Thank you for your business!</p>
                    <p>Bobs Bath Fittings Pvt Ltd | info@thebobs.in</p>
                </footer>
            </div>
        );
    }
);
PrintableQuotation.displayName = 'PrintableQuotation';


