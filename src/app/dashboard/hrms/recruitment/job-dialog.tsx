'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
const jobOpeningSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters.'),
  department: z.string().min(1, 'Department is required.'),
  location: z.string().min(1, 'Location is required.'),
  description: z.string().min(10, 'A brief description is required.'),
  responsibilities: z.array(z.object({ value: z.string().min(1, "Responsibility can't be empty.") })).min(1, 'At least one responsibility is required.'),
  qualifications: z.array(z.object({ value: z.string().min(1, "Qualification can't be empty.") })).min(1, 'At least one qualification is required.'),
  status: z.enum(['Open', 'Closed', 'Draft']),
});

export type JobOpeningFormValues = z.infer<typeof jobOpeningSchema>;

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  status: 'Open' | 'Closed' | 'Draft';
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface JobDialogProps {
  mode: 'add' | 'edit';
  job?: JobOpening;
  onSave: (data: JobOpeningFormValues, jobId?: string) => Promise<boolean>;
  triggerButton: React.ReactNode;
}

export function JobDialog({
  mode,
  job,
  onSave,
  triggerButton,
}: JobDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const defaultValues = job
    ? {
        ...job,
        responsibilities: job.responsibilities.map((r) => ({ value: r })),
        qualifications: job.qualifications.map((q) => ({ value: q })),
      }
    : {
        title: '',
        department: '',
        location: '',
        description: '',
        responsibilities: [{ value: '' }],
        qualifications: [{ value: '' }],
        status: 'Draft' as const,
      };

  const form = useForm<JobOpeningFormValues>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues: defaultValues,
  });

  const { fields: respFields, append: appendResp, remove: removeResp } = useFieldArray({
    control: form.control,
    name: 'responsibilities',
  });
  const { fields: qualFields, append: appendQual, remove: removeQual } = useFieldArray({
    control: form.control,
    name: 'qualifications',
  });

  const handleSubmit = async (values: JobOpeningFormValues) => {
    startSaving(async () => {
      const success = await onSave(values, job?.id);
      if (success) {
        setOpen(false);
        if (mode === 'add') {
          form.reset();
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Post New Job Opening' : 'Edit Job Opening'}
          </DialogTitle>
           <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details for the new position.'
              : `Editing the opening for: ${job?.title}`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="department" render={({ field }) => ( <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem> )} />
                
                <div>
                    <FormLabel>Responsibilities</FormLabel>
                    <div className="space-y-2 mt-2">
                    {respFields.map((field, index) => (
                         <FormField
                            key={field.id}
                            control={form.control}
                            name={`responsibilities.${index}.value`}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <FormControl><Input {...field} /></FormControl>
                                         <Button type="button" variant="ghost" size="icon" onClick={() => removeResp(index)} disabled={respFields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                     <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    </div>
                     <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendResp({ value: '' })}>Add Responsibility</Button>
                </div>

                <div>
                    <FormLabel>Qualifications</FormLabel>
                     <div className="space-y-2 mt-2">
                    {qualFields.map((field, index) => (
                         <FormField
                            key={field.id}
                            control={form.control}
                            name={`qualifications.${index}.value`}
                            render={({ field }) => (
                                <FormItem>
                                     <div className="flex items-center gap-2">
                                        <FormControl><Input {...field} /></FormControl>
                                         <Button type="button" variant="ghost" size="icon" onClick={() => removeQual(index)} disabled={qualFields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    </div>
                     <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendQual({ value: '' })}>Add Qualification</Button>
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Post Job' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


interface JobDetailDialogProps {
  job: JobOpening;
  triggerButton: React.ReactNode;
}

export function JobDetailDialog({ job, triggerButton }: JobDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job.title}</DialogTitle>
          <DialogDescription>
            {job.department} - {job.location}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 space-y-6">
            <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-sm text-muted-foreground">{job.description}</p>
            </div>
             <div>
                <h3 className="font-semibold mb-2">Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {job.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
             <div>
                <h3 className="font-semibold mb-2">Qualifications</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {job.qualifications.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
        </div>
         <DialogFooter>
          <DialogTrigger asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
