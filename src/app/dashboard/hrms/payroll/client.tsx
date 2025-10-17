

'use client';

import { useState, useTransition, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useReactToPrint } from 'react-to-print';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Banknote, Download, FileText, Loader2, BookUser, PlusCircle, BookCopy, Edit, Trash2, View } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Payslip, SalaryStructure, Store, User } from '@/lib/firebase/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSalaryStructure, runPayroll as runPayrollServerAction, updateSalaryStructure, deleteSalaryStructure } from './actions';
import { PrintablePayslip } from './printable-payslip';

interface PayrollClientProps {
    initialUsers: User[];
    initialSalaryStructures: SalaryStructure[];
    store: Store; // Assuming a single master store format for company details
}

const salaryStructureSchema = z.object({
    name: z.string().min(2, "Structure name is required."),
    description: z.string().optional(),
    components: z.array(z.object({
        name: z.string().min(1, "Component name is required."),
        type: z.enum(['Earning', 'Deduction']),
        calculationType: z.enum(['Fixed', 'Percentage']),
        value: z.coerce.number().min(0, "Value cannot be negative."),
    })).min(1, "At least one component is required.")
});
type SalaryStructureFormValues = z.infer<typeof salaryStructureSchema>;


export function PayrollClient({ initialUsers, initialSalaryStructures, store }: PayrollClientProps) {
  const { toast } = useToast();
  const [isProcessing, startProcessing] = useTransition();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [generatedPayslips, setGeneratedPayslips] = useState<Payslip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>(initialSalaryStructures || []);

  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const payslipPrintRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
      content: () => payslipPrintRef.current,
  });

  const handleStructureSave = (structure: SalaryStructure) => {
    setSalaryStructures(prev => {
        const exists = prev.some(s => s.id === structure.id);
        if (exists) {
            return prev.map(s => s.id === structure.id ? structure : s);
        }
        return [...prev, structure];
    });
  };

  const handleStructureDelete = (id: string) => {
    setSalaryStructures(prev => prev.filter(s => s.id !== id));
  }
  
  const handleRunPayroll = () => {
    startProcessing(async () => {
        try {
            const result = await runPayrollServerAction(selectedMonth);
            if (result.success) {
                setGeneratedPayslips(result.payslips);
                toast({
                    title: "Payroll Processed",
                    description: `Payroll for ${selectedMonth} has been successfully processed for ${result.payslips.length} employees.`
                });
            } else {
                throw new Error(result.message);
            }
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: "Error Processing Payroll",
                description: error.message
            });
        }
    });
  }
  
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Banknote /> Payroll Management
        </h1>
        <p className="text-muted-foreground">
          Process monthly payroll, generate payslips, and manage salary disbursements.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Run Payroll</CardTitle>
                    <CardDescription>Select a month and click "Run Payroll" to process salaries for all employees.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-end gap-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <label>Month</label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            {monthOptions.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleRunPayroll} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run Payroll
                    </Button>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">This action will calculate and save payslip data for the selected month.</p>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Generated Payslips for {selectedMonth}</CardTitle>
                    <CardDescription>Review the generated payslips below. You can view or download individual payslips.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Gross Salary (₹)</TableHead>
                                <TableHead>Deductions (₹)</TableHead>
                                <TableHead>Net Salary (₹)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {generatedPayslips.length > 0 ? generatedPayslips.map(slip => (
                            <TableRow key={slip.id}>
                                <TableCell className="font-medium">{slip.staffName}</TableCell>
                                <TableCell>{slip.grossSalary.toLocaleString('en-IN')}</TableCell>
                                <TableCell>{slip.deductions.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="font-semibold">{slip.netSalary.toLocaleString('en-IN')}</TableCell>
                                <TableCell><Badge>{slip.status}</Badge></TableCell>
                                <TableCell className="text-right space-x-2">
                                    <PayslipViewDialog payslip={slip} salaryStructure={salaryStructures.find(s => s.id === 'struct-standard')!} store={store} />
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedPayslip(slip); setTimeout(handlePrint, 100); }}><Download className="mr-2 h-4 w-4" />Download</Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    {isProcessing ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> : 'Run payroll to see generated payslips.'}
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <div>
                        <CardTitle className="flex items-center gap-2"><BookUser /> Salary Structures</CardTitle>
                        <CardDescription>Define and manage salary components.</CardDescription>
                    </div>
                    <SalaryStructureDialog 
                        mode="add" 
                        onSave={handleStructureSave}
                        trigger={<Button variant="outline"><PlusCircle className="mr-2" />Add</Button>}
                    />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Structure Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salaryStructures.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end">
                                         <SalaryStructureDialog 
                                            mode="edit" 
                                            structure={s}
                                            onSave={handleStructureSave}
                                            trigger={<Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>}
                                        />
                                        <DeleteStructureDialog structureId={s.id} structureName={s.name} onDelete={handleStructureDelete} />
                                    </TableCell>
                                </TableRow>
                            ))}
                             {salaryStructures.length === 0 && (
                                 <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No salary structures defined.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookCopy /> Compliance Reports</CardTitle>
                    <CardDescription>Generate statutory compliance reports.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground p-8">
                    <p>Functionality to generate PF, ESI, and other compliance reports will be available here soon.</p>
                </CardContent>
            </Card>
        </div>
       </div>

       <div className="hidden">
        {selectedPayslip && <PrintablePayslip ref={payslipPrintRef} payslip={selectedPayslip} store={store} />}
       </div>

    </div>
  );
}


// DIALOGS

function PayslipViewDialog({ payslip, salaryStructure, store }: { payslip: Payslip; salaryStructure: SalaryStructure; store: Store }) {
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => printRef.current });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><View className="mr-2 h-4 w-4" />View</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                 <DialogHeader>
                    <DialogTitle>Payslip for {payslip.staffName}</DialogTitle>
                    <DialogDescription>Payslip for the month of {payslip.month}.</DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-muted overflow-auto">
                    <PrintablePayslip ref={printRef} payslip={payslip} store={store} />
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={handlePrint}>
                        Download / Print
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SalaryStructureDialog({ mode, structure, onSave, trigger }: { mode: 'add' | 'edit', structure?: SalaryStructure, onSave: (data: SalaryStructure) => void, trigger: React.ReactNode }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const defaultValues = mode === 'edit' && structure ? structure : { name: '', description: '', components: [{ name: 'Basic', type: 'Earning', calculationType: 'Percentage', value: 40 }] };
    
    const normalizedDefaults: SalaryStructureFormValues = {
        name: (defaultValues as any).name || '',
        description: (defaultValues as any).description || '',
        components: ((defaultValues as any).components || []).map((c: any) => ({
            name: c.name ?? '',
            type: c.type === 'Deduction' ? 'Deduction' : 'Earning',
            calculationType: c.calculationType === 'Percentage' ? 'Percentage' : 'Fixed',
            value: typeof c.value === 'number' ? c.value : Number(c.value ?? 0),
        })),
    };
    
    const form = useForm<SalaryStructureFormValues>({
        resolver: zodResolver(salaryStructureSchema),
        defaultValues: normalizedDefaults
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "components"
    });

    const handleSubmit = async (values: SalaryStructureFormValues) => {
        startSubmitting(async () => {
            try {
                let result;
                if (mode === 'add') {
                    result = await createSalaryStructure(values);
                    if (result.success && result.newStructure) {
                        onSave(result.newStructure);
                        toast({ title: 'Structure Created' });
                    } else throw new Error();
                } else if (structure) {
                    result = await updateSalaryStructure(structure.id, values);
                    if (result.success && result.updatedStructure) {
                        onSave(result.updatedStructure);
                        toast({ title: 'Structure Updated' });
                    } else throw new Error();
                }
                setOpen(false);
                if (mode === 'add') form.reset();
            } catch (error) {
                toast({ variant: 'destructive', title: "Error", description: "Could not save the salary structure." });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Create New' : 'Edit'} Salary Structure</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Structure Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div>
                            <Label>Components</Label>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-end p-2 border rounded-md mt-2">
                                    <FormField control={form.control} name={`components.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name={`components.${index}.type`} render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Earning">Earning</SelectItem><SelectItem value="Deduction">Deduction</SelectItem></SelectContent></Select></FormItem>)} />
                                    <FormField control={form.control} name={`components.${index}.calculationType`} render={({ field }) => (<FormItem><FormLabel>Calculation</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Fixed">Fixed</SelectItem><SelectItem value="Percentage">Percentage</SelectItem></SelectContent></Select></FormItem>)} />
                                    <FormField control={form.control} name={`components.${index}.value`} render={({ field }) => (<FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '', type: 'Earning', calculationType: 'Fixed', value: 0 })}>Add Component</Button>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />}Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteStructureDialog({ structureId, structureName, onDelete }: { structureId: string, structureName: string, onDelete: (id: string) => void }) {
    const [isDeleting, startDeleting] = useTransition();
    const { toast } = useToast();

    const handleDelete = async () => {
        startDeleting(async () => {
            const result = await deleteSalaryStructure(structureId);
            if (result.success) {
                onDelete(structureId);
                toast({ title: 'Structure Deleted' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the "{structureName}" salary structure.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? <Loader2 className="animate-spin" /> : 'Delete'}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
