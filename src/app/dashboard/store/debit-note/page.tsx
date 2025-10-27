
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeftRight, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Store, Customer } from '@/lib/mock-data/types';
import { useReactToPrint } from 'react-to-print';
import { PrintableDebitNote } from '../components/printable-debit-note';
import { getSalesCustomers } from '../../sales/actions';
import { getStores } from '../manage/actions';

const debitNoteSchema = z.object({
    customerId: z.string().min(1, "Please select a customer."),
    originalOrderNumber: z.string().min(1, "Original order number is required."),
    reason: z.string().min(10, "A reason for the debit note is required."),
    items: z.array(z.object({
        description: z.string().min(3, "Item description is required."),
        amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
    })).min(1, "At least one item is required."),
});

type DebitNoteFormValues = z.infer<typeof debitNoteSchema>;


export default function DebitNotePage() {
    const { toast } = useToast();
    const [isProcessing, startProcessing] = useTransition();
    const [processedData, setProcessedData] = useState<any | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => printRef.current });
    
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
      async function loadInitialData() {
        setLoading(true);
        try {
            const [customerData, storeData] = await Promise.all([
                getSalesCustomers(),
                getStores(),
            ]);
            setCustomers(customerData.customers);
            setStores(storeData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load initial data.' });
        } finally {
            setLoading(false);
        }
      }
      loadInitialData();
    }, [toast]);


    const form = useForm<DebitNoteFormValues>({
        resolver: zodResolver(debitNoteSchema),
        defaultValues: {
            items: [{ description: '', amount: 0 }]
        },
    });

    const onSubmit = (values: DebitNoteFormValues) => {
        startProcessing(() => {
            // Simulate processing
            const customer = customers.find(c => c.id === values.customerId);
            const dataToProcess = {
                ...values,
                debitNoteNumber: `DN-${Date.now()}`,
                date: new Date().toISOString(),
                customer: customer || { name: 'Unknown Customer' },
            };
            setProcessedData(dataToProcess);
            toast({
                title: "Debit Note Generated",
                description: "The debit note is ready for printing."
            });
        });
    };

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ArrowLeftRight /> Create Debit Note</h1>
            <p className="text-muted-foreground">Issue a debit note to a customer for post-sale adjustments.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card>
                <CardHeader>
                    <CardTitle>Debit Note Details</CardTitle>
                    <CardDescription>Fill in the details for the debit note.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a customer..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="originalOrderNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Original Order/Bill Number *</FormLabel>
                                        <FormControl><Input placeholder="e.g., ORD-12345" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason for Debit *</FormLabel>
                                        <FormControl><Textarea placeholder="e.g., Price correction for item XYZ" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div>
                                <h3 className="text-md font-medium mb-2">Items to Debit</h3>
                                {form.watch('items').map((_, index) => (
                                    <div key={index} className="flex items-end gap-2 mb-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                                                    <FormControl><Input placeholder="Item description" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.amount`}
                                            render={({ field }) => (
                                                <FormItem>
                                                     <FormLabel className={cn(index !== 0 && "sr-only")}>Amount (?)</FormLabel>
                                                    <FormControl><Input type="number" className="w-28" {...field} /></FormControl>
                                                     <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                             <Button type="submit" disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Debit Note
                            </Button>
                         </form>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <div className='flex items-center justify-between'>
                         <div>
                            <CardTitle>Print Preview</CardTitle>
                            <CardDescription>A preview of the generated debit note.</CardDescription>
                         </div>
                        {processedData && <Button variant="outline" onClick={handlePrint}><Printer className='mr-2' /> Print</Button>}
                    </div>
                </CardHeader>
                <CardContent className="bg-muted p-4">
                    <div className="bg-white p-2 border rounded shadow-sm">
                        {processedData ? (
                            <PrintableDebitNote ref={printRef} data={processedData} store={stores[0]} />
                        ) : (
                             <div className="text-center text-muted-foreground p-8">
                                <p>Fill out the form and click "Generate" to see a preview.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}


