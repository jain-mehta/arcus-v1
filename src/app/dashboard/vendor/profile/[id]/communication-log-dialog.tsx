

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCommunicationLog } from './actions';
import type { CommunicationLog } from '@/lib/firebase/types';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  type: z.string().min(1, "Type is required."),
  summary: z.string().min(10, "Summary must be at least 10 characters long."),
});

type LogFormValues = z.infer<typeof formSchema>;

interface CommunicationLogDialogProps {
  vendorId: string;
}

export function CommunicationLogDialog({ vendorId }: CommunicationLogDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<LogFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { type: 'Call', summary: '' },
    });

    const onSubmit = async (values: LogFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await addCommunicationLog({
                vendorId,
                type: values.type as CommunicationLog['type'],
                summary: values.summary,
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Communication log added.' });
                router.refresh();
                setOpen(false);
                form.reset();
            } else {
                 throw new Error('Failed to add communication log');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add communication log.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Log Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Communication Log Entry</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
