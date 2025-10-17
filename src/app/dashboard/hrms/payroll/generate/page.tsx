

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
import { useToast } from '@/hooks/use-toast';
import type { User, SalaryStructure, Payslip, Store } from '@/lib/firebase/types';
import { runPayroll, getPageData } from './actions';
import { Loader2, FileText, Printer } from 'lucide-react';
import { PrintablePayslip } from '../printable-payslip';
import { useReactToPrint } from 'react-to-print';
import { Skeleton } from '@/components/ui/skeleton';
import type { PayslipLayout } from '../formats/actions';

const generatePayslipSchema = z.object({
  staffId: z.string().min(1, 'Please select a staff member.'),
  month: z.string().min(1, 'Please select a month.'),
});

type GeneratePayslipFormValues = z.infer<typeof generatePayslipSchema>;

export default function GeneratePayslipPage() {
    const { toast } = useToast();
    const [isGenerating, startGeneration] = useTransition();
    const [generatedPayslip, setGeneratedPayslip] = useState<Payslip | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageData, setPageData] = useState<{
        staffList: User[], 
        stores: Store[], 
        salaryStructures: SalaryStructure[],
        payslipLayouts: PayslipLayout[]
    }>({
        staffList: [],
        stores: [],
        salaryStructures: [],
        payslipLayouts: [],
    });
    
    // For now, we'll hardcode fetching the 'standard' layout for printing.
    const payslipLayout = pageData.payslipLayouts.find(f => f.id === 'format-standard');

    const payslipPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => payslipPrintRef.current,
    });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const data = await getPageData();
                setPageData(data);
            } catch (error) {
                toast({ variant: 'destructive', title: "Error", description: 'Failed to load initial data.' });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [toast]);
    
    const defaultMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const form = useForm<GeneratePayslipFormValues>({
        resolver: zodResolver(generatePayslipSchema),
        defaultValues: { month: defaultMonth }
    });

    const onSubmit = (values: GeneratePayslipFormValues) => {
        startGeneration(async () => {
            try {
                // The `runPayroll` action is now overloaded to handle a single staffId
                const result = await runPayroll(values.month, values.staffId);
                const payslip = result.payslips.find(p => p.staffId === values.staffId);
                
                if (payslip) {
                    setGeneratedPayslip(payslip);
                    toast({
                        title: 'Payslip Generated',
                        description: `Payslip for ${payslip.staffName} for ${values.month} is ready.`,
                    });
                } else {
                     throw new Error('Could not find the generated payslip.');
                }

            } catch (error: any) {
                setGeneratedPayslip(null);
                 toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    }

    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    });
    
    const store = pageData.stores[0]; // Assuming first store for company details on payslip

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><FileText /> Generate Individual Payslip</h1>
                <p className="text-muted-foreground">Generate a payslip for a specific employee for any given month.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Payslip Generation</CardTitle>
                        <CardDescription>Select an employee and the month to generate their payslip.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-48" /> : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                     <FormField
                                        control={form.control}
                                        name="staffId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Employee</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select an employee..."/></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {pageData.staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="month"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Month</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {monthOptions.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isGenerating} className="w-full">
                                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generate Payslip
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <div>
                                <CardTitle>Payslip Preview</CardTitle>
                                <CardDescription>A preview of the generated payslip.</CardDescription>
                            </div>
                            {generatedPayslip && <Button variant="outline" onClick={handlePrint}><Printer className='mr-2' /> Print</Button>}
                        </div>
                    </CardHeader>
                    <CardContent className="bg-muted p-4">
                        <div className="bg-white p-2 border rounded shadow-sm">
                            {generatedPayslip && payslipLayout && store ? (
                                <PrintablePayslip ref={payslipPrintRef} payslip={generatedPayslip} layout={payslipLayout} store={store} />
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    {isGenerating ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : <p>Select an employee and generate to see a preview.</p>}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
