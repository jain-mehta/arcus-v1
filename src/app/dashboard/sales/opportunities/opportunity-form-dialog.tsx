

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle } from 'lucide-react';
import type { Opportunity, Customer } from '@/lib/mock-data/types';

export const opportunitySchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    customerId: z.string().min(1, "Please select a customer."),
    value: z.coerce.number().min(1, "Value must be greater than 0."),
    stage: z.enum(['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']),
    closeDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface OpportunityFormDialogProps {
    formType: 'add' | 'edit';
    dialogTrigger: React.ReactNode;
    formAction: (data: any) => Promise<void>;
    salesCustomers: Customer[];
    initialData?: Opportunity;
    defaultStage?: Opportunity['stage'];
}

const pipelineStages = [
    { id: 'Qualification', title: 'Qualification' },
    { id: 'Needs Analysis', title: 'Needs Analysis' },
    { id: 'Proposal', title: 'Proposal' },
    { id: 'Negotiation', title: 'Negotiation' },
    { id: 'Closed Won', title: 'Closed Won' },
    { id: 'Closed Lost', title: 'Closed Lost' },
];

export function OpportunityFormDialog({
    formType,
    dialogTrigger,
    formAction,
    salesCustomers,
    initialData,
    defaultStage = 'Qualification',
}: OpportunityFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const defaultAddValues = {
        title: '',
        customerId: '',
        value: 100000,
        stage: defaultStage,
        closeDate: new Date().toISOString().split('T')[0],
    };

    const form = useForm<OpportunityFormValues>({
        resolver: zodResolver(opportunitySchema),
        defaultValues: formType === 'edit' && initialData ? {
            title: initialData.title,
            customerId: initialData.customerId,
            value: initialData.value,
            stage: initialData.stage,
            closeDate: initialData.closeDate,
        } : defaultAddValues
    });

    const onSubmit = (values: OpportunityFormValues) => {
        startSubmitting(async () => {
            await formAction(values);
            setOpen(false);
            if (formType === 'add') {
                form.reset(defaultAddValues);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {dialogTrigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{formType === 'add' ? 'Add New Opportunity' : 'Edit Opportunity'}</DialogTitle>
                    <DialogDescription>
                        {formType === 'add'
                            ? "Fill in the details for the new sales opportunity."
                            : `Editing: ${initialData?.title}`
                        }
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Opportunity Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Full Bathroom Fittings for New Hotel" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {salesCustomers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField control={form.control} name="value" render={({ field }) => (
                            <FormItem><FormLabel>Deal Value (?)</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem>
                        )} />
                         <div className="grid grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="stage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stage</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {pipelineStages.map(stage => <SelectItem key={stage.id} value={stage.id}>{stage.title}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control} name="closeDate" render={({ field }) => (
                                <FormItem><FormLabel>Expected Close Date</FormLabel><FormControl><Input {...field} type="date" /></FormControl><FormMessage /></FormItem>
                            )} />
                         </div>

                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {formType === 'add' ? 'Add Opportunity' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


