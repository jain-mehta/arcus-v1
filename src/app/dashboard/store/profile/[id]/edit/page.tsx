

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { Store, User } from '@/lib/mock-data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateStore, getEditStorePageData } from './actions';
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

type EditStoreFormValues = z.infer<typeof storeSchema>;


export default function EditStoreProfilePage() {
    const params = useParams();
    const storeId = params.id as string;
    const router = useRouter();
    const { toast } = useToast();
    const [storeData, setStoreData] = useState<Store | null>(null);
    const [storeManagers, setStoreManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition();
    
    const form = useForm<EditStoreFormValues>({
        resolver: zodResolver(storeSchema),
        mode: 'onChange',
    });
    
    const selectedState = form.watch('state');
    const citiesForSelectedState = indianStatesAndCities.find(s => s.state === selectedState)?.cities || [];

    useEffect(() => {
        async function fetchStoreData() {
            setLoading(true);
            try {
                const data = await getEditStorePageData(storeId);

                if (!data.store) {
                    notFound();
                    return;
                }
                setStoreData(data.store);
                setStoreManagers(data.managers);
                form.reset({
                    name: data.store.name,
                    address: data.store.address,
                    city: data.store.city,
                    state: data.store.state,
                    pincode: data.store.pincode,
                    region: data.store.region,
                    managerId: data.store.managerId || 'unassigned',
                    cashAlertThreshold: data.store.cashAlertThreshold || undefined,
                });
            } catch (error) {
                console.error("Failed to fetch store data:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        }
        fetchStoreData();
    }, [storeId, form]);

  async function onSubmit(data: EditStoreFormValues) {
    startTransition(async () => {
        const submissionData: Partial<Store> = {
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          region: data.region,
          managerId: data.managerId === 'unassigned' ? undefined : data.managerId,
          cashAlertThreshold: data.cashAlertThreshold,
        };

        try {
            await updateStore(storeId, submissionData);
            toast({
                title: 'Store Updated',
                description: `${data.name}'s profile has been successfully updated.`,
            });
            router.push(`/dashboard/store/profile/${storeId}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to update store:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update store. Please try again.',
            });
        }
    });
  }
  
  if (loading) {
    return <EditStoreProfileSkeleton />;
  }

  if (!storeData) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Store Profile</h1>
            <p className="text-muted-foreground">Update the details for {storeData.name}.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                        <Input {...field} />
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
                          <FormLabel>Cash Alert Threshold (>₹)</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="e.g., 75000" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>
            </CardContent>
          </Card>


          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function EditStoreProfileSkeleton() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Store Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                        <Skeleton className="h-10" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Skeleton className="h-10" />
                          <Skeleton className="h-10" />
                          <Skeleton className="h-10" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <Skeleton className="h-10" />
                           <Skeleton className="h-10" />
                        </div>
                    </CardContent>
                </Card>
                 <div className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
}

    
