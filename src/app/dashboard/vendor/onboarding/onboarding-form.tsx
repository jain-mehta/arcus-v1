
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Upload, File as FileIcon, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createVendor } from './actions';
import type { VendorDocument } from '@/lib/mock-data/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];


const fileSchema = z.instanceof(File)
  .optional()
  .refine(file => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    file => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png, .webp, and .pdf formats are supported."
  );

const onboardingSchema = z.object({
  // Vendor General Information
  businessName: z.string().min(2, 'Business name must be at least 2 characters.'),
  vendorCategory: z.string({ required_error: 'Please select a vendor category.' }),
  operationalRegion: z.string({ required_error: 'Please select an operational region.' }),
  contactName: z.string().min(2, 'Contact name is required.'),
  contactEmail: z.string().email('Please enter a valid email address.'),
  contactPhone: z.string().min(10, 'Please enter a valid phone number.'),
  businessAddress: z.string().min(5, 'Address is required.'),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),

  // Payment Details
  paymentTerms: z.enum(['Net 30', 'Net 60', 'Upon Receipt'], { required_error: 'Please select payment terms.'}),
  preferredPaymentMethod: z.enum(['Bank Transfer', 'Credit Card', 'Cheque'], { required_error: 'Please select a payment method.'}),

  // GST and Tax Details
  gstin: z.string().length(15, 'GSTIN must be 15 characters.'),
  panNumber: z.string().length(10, 'PAN must be 10 characters.'),
  
  // Banking Details
  bankName: z.string().min(2, 'Bank name is required.'),
  accountHolderName: z.string().min(2, 'Account holder name is required.'),
  accountNumber: z.string().min(9, 'Enter a valid bank account number.'),
  ifscCode: z.string().length(11, 'IFSC code must be 11 characters.'),

  // Document Uploads
  visitingCard: fileSchema,
  businessLicense: fileSchema,
  signedContract: fileSchema,
  bankProof: fileSchema,
  otherDocuments: fileSchema,
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;
type FileUploadFieldName = "visitingCard" | "businessLicense" | "signedContract" | "bankProof" | "otherDocuments";


const defaultValues: Partial<OnboardingFormValues> = {};

const FileUploadInput = ({ name, label, description, control, onFileChange, onFileRemove }: { name: FileUploadFieldName, label: string, description: string, control: any, onFileChange: (name: FileUploadFieldName, file: File | undefined) => void, onFileRemove: (name: FileUploadFieldName) => void }) => {
    
    return (
        <Card className="bg-muted/30">
            <CardContent className="p-6 text-center">
                <FormField
                    control={control}
                    name={name}
                    render={({ field }) => {
                        const fileName = field.value?.name;
                        return (
                            <FormItem>
                                <FormLabel className="text-base font-semibold">{label}</FormLabel>
                                <FormDescription className="mb-4">{description}</FormDescription>
                                <FormControl>
                                    <div className="relative flex flex-col items-center justify-center gap-4">
                                        <Upload className="h-10 w-10 text-muted-foreground" />
                                        <Input
                                            type="file"
                                            className="sr-only"
                                            id={name}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                field.onChange(file);
                                                onFileChange(name, file);
                                                if (e.target) e.target.value = '';
                                            }}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                        <div className='flex items-center gap-2'>
                                            <label htmlFor={name} className="cursor-pointer">
                                                <Button asChild variant="outline" type="button">
                                                    <div>{fileName ? 'Change file' : 'Upload file'}</div>
                                                </Button>
                                            </label>
                                            {fileName && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileIcon className="h-4 w-4" />
                                                    <span className='truncate max-w-[150px]'>{fileName}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onFileRemove(name)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )
                    }}
                />
            </CardContent>
        </Card>
    );
};

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <FormLabel>
        {children} <span className="text-destructive">*</span>
    </FormLabel>
);

export function OnboardingForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
    mode: 'onChange',
  });

  const handleFileChange = (name: FileUploadFieldName, file: File | undefined) => {
    form.setValue(name, file, { shouldValidate: true });
  };
  
  const handleFileRemove = (name: FileUploadFieldName) => {
    form.setValue(name, undefined, { shouldValidate: true });
  };


  async function onSubmit(data: OnboardingFormValues) {
    setIsSubmitting(true);
    
    try {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(key, value);
            } else if (value) {
                formData.append(key, value);
            }
        });
        
        await createVendor(formData);
        
        toast({
            title: 'Vendor Submitted for Approval',
            description: `${data.businessName} has been successfully submitted and is pending approval.`,
        });
    } catch (error: any) {
        console.error("Failed to create vendor:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to create vendor. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
      
      <Card>
        <CardHeader>
          <CardTitle>Vendor General Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                    <FormItem>
                    <RequiredLabel>Business Name</RequiredLabel>
                    <FormControl>
                        <Input placeholder="Enter business name" {...field} />
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
                    <RequiredLabel>Vendor Category</RequiredLabel>
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
                    <RequiredLabel>Operations Region</RequiredLabel>
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
                        <RequiredLabel>Contact person name</RequiredLabel>
                        <FormControl>
                        <Input placeholder="Enter contact person name" {...field} />
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
                        <RequiredLabel>Contact person email</RequiredLabel>
                        <FormControl>
                        <Input placeholder="Enter contact person email" {...field} />
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
                        <RequiredLabel>Contact person phone number</RequiredLabel>
                        <FormControl>
                        <Input placeholder="Enter contact person phone number" {...field} />
                        </FormControl>
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
                  <RequiredLabel>Business Address</RequiredLabel>
                  <FormControl>
                    <Input placeholder="Enter business address" {...field} />
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
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
            <CardTitle>Payment & Tax Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                        <FormItem>
                            <RequiredLabel>Payment Terms</RequiredLabel>
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
                            <RequiredLabel>Preferred Payment Method</RequiredLabel>
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
                        <RequiredLabel>GSTIN</RequiredLabel>
                        <FormControl>
                            <Input placeholder="Enter GSTIN" {...field} />
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
                        <RequiredLabel>PAN Number</RequiredLabel>
                        <FormControl>
                            <Input placeholder="Enter PAN number" {...field} />
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
            <CardTitle>Banking Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                    <FormItem>
                    <RequiredLabel>Bank Name</RequiredLabel>
                    <FormControl>
                        <Input placeholder="Enter bank name" {...field} />
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
                    <RequiredLabel>Account Holder Name</RequiredLabel>
                    <FormControl>
                        <Input placeholder="Enter account holder name" {...field} />
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
                    <RequiredLabel>Account Number</RequiredLabel>
                    <FormControl>
                        <Input placeholder="Enter account number" {...field} />
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
                    <RequiredLabel>IFSC Code</RequiredLabel>
                    <FormControl>
                        <Input placeholder="Enter IFSC code" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contract & Document Uploads</CardTitle>
           <CardDescription>Upload relevant documents for the vendor.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadInput name="visitingCard" label="Visiting Card (Optional)" description="Upload a scan of the visiting card" control={form.control} onFileChange={handleFileChange} onFileRemove={handleFileRemove} />
            <FileUploadInput name="businessLicense" label="Business License/Registration (Optional)" description="Upload Business License/Registration" control={form.control} onFileChange={handleFileChange} onFileRemove={handleFileRemove} />
            <FileUploadInput name="signedContract" label="Signed Contract Agreement (Optional)" description="Upload Signed Contract Agreement" control={form.control} onFileChange={handleFileChange} onFileRemove={handleFileRemove} />
            <FileUploadInput name="bankProof" label="Bank Account Proof (Optional)" description="Upload Bank Account Proof" control={form.control} onFileChange={handleFileChange} onFileRemove={handleFileRemove} />
            <FileUploadInput name="otherDocuments" label="Other Supporting Documents (Optional)" description="Upload Other Supporting Documents" control={form.control} onFileChange={handleFileChange} onFileRemove={handleFileRemove} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit for Approval
        </Button>
      </div>
    </form>
  </Form>
  )

}


