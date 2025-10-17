
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
import type { Vendor } from '@/lib/firebase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateVendor, getVendor } from '../actions';

const editVendorSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters.'),
  vendorCategory: z.string({ required_error: 'Please select a vendor category.' }),
  operationalRegion: z.string({ required_error: 'Please select an operational region.' }),
  status: z.enum(['Active', 'Inactive', 'Pending Approval', 'Rejected']),
  contactName: z.string().min(2, 'Contact name is required.'),
  contactEmail: z.string().email('Please enter a valid email address.'),
  contactPhone: z.string().min(10, 'Please enter a valid phone number.'),
  businessAddress: z.string().min(5, 'Address is required.'),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  paymentTerms: z.enum(['Net 30', 'Net 60', 'Upon Receipt'], { required_error: 'Please select payment terms.'}),
  preferredPaymentMethod: z.enum(['Bank Transfer', 'Credit Card', 'Cheque'], { required_error: 'Please select a payment method.'}),
  gstin: z.string().length(15, 'GSTIN must be 15 characters.'),
  panNumber: z.string().length(10, 'PAN must be 10 characters.'),
  bankName: z.string().min(2, 'Bank name is required.'),
  accountHolderName: z.string().min(2, 'Account holder name is required.'),
  accountNumber: z.string().min(9, 'Enter a valid bank account number.'),
  ifscCode: z.string().length(11, 'IFSC code must be 11 characters.'),
});

type EditVendorFormValues = z.infer<typeof editVendorSchema>;


export default function EditVendorProfilePage({ params }: any) {
    const router = useRouter();
    const { toast } = useToast();
    const [vendorData, setVendorData] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition();
    
    const form = useForm<EditVendorFormValues>({
        resolver: zodResolver(editVendorSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        async function fetchVendorData() {
            setLoading(true);
            try {
                const data = await getVendor(params.id);
                if (!data) {
                    notFound();
                    return;
                }
                setVendorData(data);
                form.reset({
                    businessName: data.name,
                    vendorCategory: data.category,
                    operationalRegion: data.operationalRegion,
                    status: data.status,
                    contactName: data.contact.name,
                    contactEmail: data.contact.email,
                    contactPhone: data.contact.phone,
                    businessAddress: data.address,
                    website: data.website || '',
                    paymentTerms: data.paymentTerms,
                    preferredPaymentMethod: data.preferredPaymentMethod,
                    gstin: data.tax.gstin,
                    panNumber: data.tax.panNumber,
                    bankName: data.banking.bankName,
                    accountHolderName: data.banking.accountHolderName,
                    accountNumber: data.banking.accountNumber,
                    ifscCode: data.banking.ifscCode,
                });
            } catch (error) {
                console.error("Failed to fetch vendor data:", error);
                notFound();
            } finally {
                setLoading(false);
            }
        }
        fetchVendorData();
    }, [params.id, form]);

  async function onSubmit(data: EditVendorFormValues) {
    startTransition(async () => {
        const submissionData = {
            name: data.businessName,
            category: data.vendorCategory,
            operationalRegion: data.operationalRegion,
            status: data.status,
            contact: {
                name: data.contactName,
                email: data.contactEmail,
                phone: data.contactPhone,
            },
            address: data.businessAddress,
            website: data.website,
            paymentTerms: data.paymentTerms,
            preferredPaymentMethod: data.preferredPaymentMethod,
            tax: {
                gstin: data.gstin,
                panNumber: data.panNumber,
            },
            banking: {
                bankName: data.bankName,
                accountHolderName: data.accountHolderName,
                accountNumber: data.accountNumber,
                ifscCode: data.ifscCode,
            }
        };

        try {
            await updateVendor(params.id, submissionData as Partial<Vendor>);
            toast({
                title: 'Vendor Updated',
                description: `${data.businessName}'s profile has been successfully updated.`,
            });
            router.push(`/dashboard/vendor/profile/${params.id}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to update vendor:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update vendor. Please try again.',
            });
        }
    });
  }
  
  if (loading) {
    return <EditVendorProfileSkeleton />;
  }

  if (!vendorData) {
    return null; // Should be handled by notFound() in useEffect
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vendor Profile</h1>
            <p className="text-muted-foreground">Update the details for {vendorData.name}.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="vendorCategory"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vendor Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Raw Materials Supplier">Raw Materials Supplier</SelectItem>
                                <SelectItem value="Component Manufacturer">Component Manufacturer</SelectItem>
                                <SelectItem value="Finished Goods Wholesaler">Finished Goods Wholesaler</SelectItem>
                                <SelectItem value="Service Provider">Service Provider</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="operationalRegion"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Operations Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select region list" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="North">North</SelectItem>
                            <SelectItem value="South">South</SelectItem>
                            <SelectItem value="West">West</SelectItem>
                            <SelectItem value="East">East</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Person Name</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Person Email</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Person Phone</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>These metrics are calculated automatically by the system and cannot be manually edited.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormItem>
                        <FormLabel>On-Time Delivery (%)</FormLabel>
                        <Input type="number" value={vendorData.onTimeDelivery} readOnly disabled />
                    </FormItem>
                    <FormItem>
                        <FormLabel>Quality Score (/5)</FormLabel>
                        <Input type="number" step="0.1" value={vendorData.qualityScore} readOnly disabled />
                    </FormItem>
                    <FormItem>
                        <FormLabel>Avg. Response Time</FormLabel>
                        <Input value={vendorData.avgResponseTime} readOnly disabled />
                    </FormItem>
                </CardContent>
            </Card>

           <Card>
            <CardHeader>
              <CardTitle>Payment & Tax Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Terms</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select payment terms" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Net 30">Net 30</SelectItem>
                                    <SelectItem value="Net 60">Net 60</SelectItem>
                                    <SelectItem value="Upon Receipt">Upon Receipt</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="preferredPaymentMethod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preferred Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="gstin"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>GSTIN</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Banking Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="ifscCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
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

function EditVendorProfileSkeleton() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>GST and Tax Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Banking Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-10" />
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
