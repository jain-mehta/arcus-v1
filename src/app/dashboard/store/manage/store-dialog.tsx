

'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Store, User } from '@/lib/types/domain';
import { addStore, updateStore } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { indianStatesAndCities } from '@/lib/india-data';

const storeSchema = z.object({
  name: z.string().min(3, 'Store name must be at least 3 characters.'),
  address: z.string().min(5, 'Address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  region: z.string().min(2, 'Region is required.'),
  pincode: z.string().length(6, 'Pincode must be 6 digits.'),
  managerId: z.string().optional(),
  cashAlertThreshold: z.coerce.number().min(0, "Threshold must be a positive number.").optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreDialogProps {
  mode: 'add' | 'edit';
  store?: Store;
  storeManagers: User[];
}

export function StoreDialog({ mode, store, storeManagers }: StoreDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues:
      mode === 'edit' && store
        ? {
            name: store.name,
            address: store.address,
            city: store.city,
            state: store.state,
            region: store.region,
            pincode: store.pincode,
            managerId: store.managerId || '',
            cashAlertThreshold: store.cashAlertThreshold || undefined,
          }
        : {
            name: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            region: '',
            managerId: '',
            cashAlertThreshold: undefined,
          },
  });
  
  const selectedState = form.watch('state');
  const citiesForSelectedState = indianStatesAndCities.find(s => s.state === selectedState)?.cities || [];

  const onSubmit = (values: StoreFormValues) => {
    startTransition(async () => {
      try {
        const submissionData = {
          ...values,
          managerId: values.managerId === 'unassigned' ? undefined : values.managerId,
          cashInHand: store?.cashInHand || 0, // Preserve existing cash on hand during edit
          cashAlertThreshold: values.cashAlertThreshold || 0,
        };
        
        let result: { success: boolean; message?: string; newStoreId?: string } | { success: boolean; message?: string } | undefined;
        if (mode === 'edit' && store) {
          result = await updateStore(store.id, submissionData);
           if (result.success) {
            toast({
              title: 'Store Updated',
              description: `${values.name} has been successfully saved.`,
            });
            setOpen(false);
          } else {
            throw new Error(result.message);
          }
        } else {
          result = await addStore(submissionData);
          if (result && result.success && (result as any).newStoreId) {
             const newStoreId = (result as any).newStoreId as string;
             toast({
              title: `Store "${values.name}" Added!`,
              description: "Next, set up the invoice format for this store.",
              action: (
                <Button onClick={() => router.push(`/dashboard/store/invoice-format?store=${newStoreId}`)}>
                  Edit Invoice Format
                </Button>
              ),
              duration: 10000,
            });
            setOpen(false);
          } else {
             throw new Error(result.message);
          }
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to save store.',
        });
      }
    });
  };

  const triggerButton =
    mode === 'add' ? (
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Store
      </Button>
    ) : (
      <Button variant="outline">
        <Edit className="mr-2 h-4 w-4" /> Edit Profile
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Store' : 'Edit Store'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details for the new store location.'
              : `Editing ${store?.name}`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="my-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Downtown Flagship" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Manager (Store Supervisor)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'unassigned'}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a manager" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="unassigned">None</SelectItem>
                              {storeManagers.map(manager => (
                                  <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., 123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>State</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('city', '');
                            }} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {indianStatesAndCities.map(s => (
                                        <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>City</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {citiesForSelectedState.map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                              <Input placeholder="e.g., 110001" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Region</FormLabel>
                          <FormControl>
                              <Input placeholder="e.g., North" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                  <FormField
                      control={form.control}
                      name="cashAlertThreshold"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Cash Alert Threshold (?)</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="e.g., 75000" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Add Store' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


