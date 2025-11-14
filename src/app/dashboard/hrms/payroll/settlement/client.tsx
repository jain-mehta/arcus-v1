
'use client';

import { useState, useTransition, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Printer } from 'lucide-react';
import { PrintableFnF } from './printable-fnf';
import { useReactToPrint } from 'react-to-print';

const settlementSchema = z.object({
    employeeId: z.string().min(1, "Please select an employee."),
    lastWorkingDay: z.string().min(1, "Last working day is required."),
    reason: z.string().min(10, "A reason for the settlement is required."),
    earnings: z.array(z.object({
        description: z.string().min(3, "Item description is required."),
        amount: z.coerce.number().min(0),
    })),
    deductions: z.array(z.object({
        description: z.string().min(3, "Item description is required."),
        amount: z.coerce.number().min(0),
    })),
});

type SettlementFormValues = z.infer<typeof settlementSchema>;

interface SettlementClientProps {
    stores: Store[];
    staffList: User[];
}

export function SettlementClient({ stores, staffList }: SettlementClientProps) {
    const { toast } = useToast();
    const [isProcessing, startProcessing] = useTransition();
    const [processedData, setProcessedData] = useState<any | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => printRef.current });

    const form = useForm<SettlementFormValues>({
        resolver: zodResolver(settlementSchema),
        defaultValues: {
            earnings: [
                { description: 'Salary for the month', amount: 0 },
                { description: 'Leave Encashment', amount: 0 },
            ],
            deductions: [
                { description: 'Notice Period Shortfall', amount: 0 },
                { description: 'Other Deductions', amount: 0 },
            ]
        },
    });

    const onSubmit = async (values: SettlementFormValues) => {
        startProcessing(async () => {
            try {
                const employee = staffList.find(c => c.id === values.employeeId);
                const totalEarnings = values.earnings.reduce((acc, item) => acc + item.amount, 0);
                const totalDeductions = values.deductions.reduce((acc, item) => acc + item.amount, 0);
                const netPayable = totalEarnings - totalDeductions;

                const payload = {
                    ...values,
                    settlementNumber: `FNF-${Date.now()}`,
                    date: new Date().toISOString(),
                    employee: employee || { name: 'Unknown Employee' },
                    totalEarnings,
                    totalDeductions,
                    netPayable,
                };

                const res = await fetch('/api/hrms/settlement', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const json = await res.json();
                if (!res.ok) {
                    toast({ title: 'Settlement failed', description: json?.error || 'Server error' });
                    return;
                }

                setProcessedData(json.settlement);
                toast({ title: 'Settlement saved', description: 'The settlement has been processed and saved.' });
            } catch (e: any) {
                toast({ title: 'Error', description: e?.message || 'Unknown error' });
            }
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Users /> Full & Final Settlement</h1>
                <p className="text-muted-foreground">Process the final settlement for departing employees.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Settlement Details</CardTitle>
                        <CardDescription>Fill in the details to generate the F&amp;F statement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="employeeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employee *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select an employee..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {staffList.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastWorkingDay"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Working Day *</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason for Settlement *</FormLabel>
                                            <FormControl><Textarea placeholder="e.g., Resignation" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-md font-medium mb-2">Earnings</h3>
                                        {form.watch('earnings').map((_, index) => (
                                            <div key={index} className="flex items-center gap-2 mb-2">
                                                <Input value={form.getValues(`earnings.${index}.description`)} disabled className="flex-1" />
                                                <FormField control={form.control} name={`earnings.${index}.amount`} render={({ field }) => ( <FormControl><Input type="number" className="w-28" {...field} /></FormControl> )} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <h3 className="text-md font-medium mb-2">Deductions</h3>
                                        {form.watch('deductions').map((_, index) => (
                                             <div key={index} className="flex items-center gap-2 mb-2">
                                                <Input value={form.getValues(`deductions.${index}.description`)} disabled className="flex-1" />
                                                <FormField control={form.control} name={`deductions.${index}.amount`} render={({ field }) => ( <FormControl><Input type="number" className="w-28" {...field} /></FormControl> )} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <Button type="submit" disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Statement
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
                                <CardDescription>A preview of the generated statement.</CardDescription>
                            </div>
                            {processedData && <Button variant="outline" onClick={handlePrint}><Printer className='mr-2' /> Print</Button>}
                        </div>
                    </CardHeader>
                    <CardContent className="bg-muted p-4">
                        <div className="bg-white p-2 border rounded shadow-sm">
                            {processedData ? (
                                <PrintableFnF ref={printRef} data={processedData} store={stores[0]} />
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
