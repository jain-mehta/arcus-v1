
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
import type { MaterialMapping } from '@/lib/mock-data/types';

const formSchema = z.object({
    material: z.string().min(1, "Material name is required."),
    sku: z.string().min(1, "SKU is required."),
    unit: z.string().min(1, "Unit is required."),
    unitPrice: z.coerce.number().min(0, "Unit price must be a positive number."),
    quantity: z.coerce.number().int().min(0, "Initial quantity is required."),
    reorderLevel: z.coerce.number().int().min(0, "Reorder level must be a positive integer."),
    safetyStock: z.coerce.number().int().min(0, "Safety stock must be a positive integer."),
});

type AddMappingFormValues = z.infer<typeof formSchema>;

interface AddMappingDialogProps {
    onAddMapping: (data: Omit<MaterialMapping, 'id' | 'vendorId' | 'active'>) => Promise<boolean>;
    disabled: boolean;
}

export function AddMappingDialog({ onAddMapping, disabled }: AddMappingDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AddMappingFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            material: '',
            sku: '',
            unit: 'kg',
            unitPrice: 0,
            quantity: 0,
            reorderLevel: 0,
            safetyStock: 0
        },
    });

    const onSubmit = async (values: AddMappingFormValues) => {
        setIsSubmitting(true);
        const success = await onAddMapping(values);
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
                    Add New Mapping
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Material Mapping</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="material"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Material</FormLabel>
                                    <FormControl><Input placeholder="e.g., Brass Ingots (Grade A)" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU</FormLabel>
                                    <FormControl><Input placeholder="e.g., BI-GA-001" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <FormControl><Input placeholder="e.g., kg, piece" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Price (?)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 1240" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                             <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Quantity</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 1000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reorderLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reorder Level</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 500" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="safetyStock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Safety Stock</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Mapping
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


