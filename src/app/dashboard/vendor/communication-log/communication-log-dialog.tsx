
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCommunicationLog } from '@/app/dashboard/vendor/profile/[id]/actions';
import type { CommunicationLog, Vendor } from '@/lib/firebase/types';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  vendorId: z.string().min(1, "Please select a vendor."),
  type: z.string().min(1, "Type is required."),
  summary: z.string().min(10, "Summary must be at least 10 characters long."),
});

type LogFormValues = z.infer<typeof formSchema>;

interface CommunicationLogDialogProps {
  vendors: Vendor[];
  onLogAdded: (newLog: CommunicationLog) => void;
}

export function CommunicationLogDialog({ vendors, onLogAdded }: CommunicationLogDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const form = useForm<LogFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { vendorId: '', type: 'Call', summary: '' },
    });

    const onSubmit = async (values: LogFormValues) => {
        startSubmitting(async () => {
            try {
                const result = await addCommunicationLog({
                    vendorId: values.vendorId,
                    type: values.type as CommunicationLog['type'],
                    summary: values.summary,
                });

                if (result.success && result.newLog) {
                    toast({ title: 'Success', description: 'Communication log added.' });
                    onLogAdded(result.newLog);
                    setOpen(false);
                    form.reset();
                } else {
                     throw new Error('Failed to add communication log');
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to add communication log.' });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" /> Add Log Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Communication Log Entry</DialogTitle>
                     <DialogDescription>
                        Record a new call, email, or meeting with a vendor.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField
                            control={form.control}
                            name="vendorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vendor</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
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
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Communication Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Call">Call</SelectItem>
                                            <SelectItem value="Email">Email</SelectItem>
                                            <SelectItem value="Meeting">Meeting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Summary</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter a summary of the communication..." {...field} rows={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Log
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
