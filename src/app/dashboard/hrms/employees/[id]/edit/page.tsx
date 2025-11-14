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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { updateStaffMember } from '../../../actions');

interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  org_id?: string;
  role_id?: string;
  designation?: string;
  created_at?: string;
  updated_at?: string;
}

interface Role {
  id: string;
  name?: string;
}

async function updateStaffMember(staffId: string, data: any) {
  try {
    // TODO: Implement actual API call
    console.log('Updating staff member:', staffId, data);
    return { success: true, message: 'Updated successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to update' };
  }
}

const editStaffSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().min(10, "A valid phone number is required."),
  designation: z.string().min(2, "Designation is required."),
  storeId: z.string().optional(),
  reportsTo: z.string().optional(),
});

type EditStaffFormValues = z.infer<typeof editStaffSchema>;


export default function EditStaffProfilePage() {
    const params = useParams();
    const staffId = params.id as string;
    const router = useRouter();
    const { toast } = useToast();
    const [staffData, setStaffData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition();
    
    const form = useForm<EditStaffFormValues>({
        resolver: zodResolver(editStaffSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        async function fetchStaffData() {
            setLoading(true);
            try {
                // TODO: Implement actual API call to fetch staff data
                const user: User | null = null;

                if (user === null) {
                    notFound();
                    return;
                }
                setStaffData(user);
                // Reset the form with the fetched data
                form.reset({
                    name: (user as User).name || '',
                    email: (user as User).email,
                    phone: (user as User).phone || '',
                    designation: (user as User).designation || '',
                    storeId: (user as User).org_id || 'unassigned',
                    reportsTo: (user as User).id || 'none',
                });
            } catch (error) {
                console.error("Failed to fetch staff data:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        }
        fetchStaffData();
    }, [staffId]);

    async function onSubmit(data: EditStaffFormValues) {
        startTransition(async () => {
            try {
                // TODO: Implement role selection logic
                const selectedRole = null as Role | null;

                const result = await updateStaffMember(staffId, { 
                  name: data.name,
                  email: data.email,
                  phone: data.phone,
                  designation: data.designation,
                  storeId: data.storeId === 'unassigned' ? undefined : data.storeId,
                  reportsTo: data.reportsTo === 'none' ? undefined : data.reportsTo,
                  roleIds: selectedRole?.id ? [selectedRole.id] : [],
                });
                
                if (result.success) {
                    toast({
                        title: 'Profile Updated',
                        description: `${data.name}'s profile has been successfully updated.`,
                    });
                    router.push(`/dashboard/hrms/employees/${staffId}`);
                    router.refresh();
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                console.error("Failed to update staff:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Failed to update staff. Please try again.',
                });
            }
        });
    }
  
    if (loading) {
    return <EditStaffProfileSkeleton />;
  }

  if (!staffData) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Employee Profile</h1>
            <p className="text-muted-foreground">Update the details for {staffData.name}.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Personal & Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                            <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Role & Assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Designation</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a designation"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {/* TODO: Load designations from API */}
                                    </SelectContent>
                                </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assigned Store (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="unassigned">No Store</SelectItem>
                                {/* TODO: Load stores from API */}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="reportsTo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Reports To (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {/* TODO: Load users from API */}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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

function EditStaffProfileSkeleton() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal & Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Role & Assignment</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                         <Skeleton className="h-10" />
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
