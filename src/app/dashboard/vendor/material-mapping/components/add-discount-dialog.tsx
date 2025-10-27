

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2 } from "lucide-react";
import type { VolumeDiscount } from '@/lib/mock-data/types';

const formSchema = z.object({
    minQuantity: z.coerce.number().int().min(1, "Minimum quantity must be at least 1."),
    discount: z.coerce.number().min(0.1, "Discount must be positive.").max(100, "Discount cannot exceed 100%."),
});

type AddDiscountFormValues = z.infer<typeof formSchema>;

interface AddDiscountDialogProps {
    onAdd: (data: Omit<VolumeDiscount, 'id' | 'mappingId'>) => Promise<boolean>;
    disabled: boolean;
}

export function AddDiscountDialog({ onAdd, disabled }: AddDiscountDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AddDiscountFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            minQuantity: 100,
            discount: 5,
        },
    });

    const onSubmit = async (values: AddDiscountFormValues) => {
        setIsSubmitting(true);
        const success = await onAdd(values);
        setIsSubmitting(false);
        if (success) {
            setOpen(false);
            form.reset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Discount
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Volume Discount</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="minQuantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Minimum Quantity</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 1000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="discount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discount (%)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Discount
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    


