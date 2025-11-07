'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Trash2,
  Upload,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  uploadDocument,
  deleteVendorDocument,
  getDocumentsForVendor,
} from '@/app/dashboard/vendor/documents/actions';
const uploadFormSchema = z.object({
  name: z.string().min(3, 'Document name is required.'),
  type: z.enum(['Contract', 'License', 'Certification', 'NDA', 'Other']),
  expiryDate: z.date().optional(),
  description: z.string().optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'File is required.'),
});
type UploadFormValues = z.infer<typeof uploadFormSchema>;

const getStatus = (
  doc: VendorDocument
): {
  text: 'Active' | 'Expires Soon' | 'Expired';
  variant: 'default' | 'secondary' | 'destructive';
} => {
  if (!doc.expiryDate)
    return { text: 'Active', variant: 'default' };
  const expiry = new Date(doc.expiryDate);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (expiry < today) {
    return { text: 'Expired', variant: 'destructive' };
  }
  if (expiry <= thirtyDaysFromNow) {
    return { text: 'Expires Soon', variant: 'secondary' };
  }
  return { text: 'Active', variant: 'default' };
};

interface DocumentManagementClientProps {
  vendors: Vendor[];
  initialDocuments: VendorDocument[];
}

export function DocumentManagementClient({
  vendors,
  initialDocuments,
}: DocumentManagementClientProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>(
    vendors[0]?.id || ''
  );
  const [documents, setDocuments] = useState<VendorDocument[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedVendor) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    async function fetchDocuments() {
      setLoading(true);
      try {
        const docs = await getDocumentsForVendor(selectedVendor);
        setDocuments(docs);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load documents.',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [selectedVendor, toast]);

  const onDocumentUploaded = (newDoc: VendorDocument) => {
    setDocuments((prev) =>
      [...prev, newDoc].sort(
        (a, b) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      )
    );
  };

  const handleDocumentDelete = async (docId: string, filePath: string) => {
    startDeleteTransition(async () => {
        try {
          await deleteVendorDocument(docId, filePath);
          setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
          toast({
            title: 'Success',
            description: 'Document deleted successfully.',
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete document.',
          });
        }
    });
  };

  const vendorName =
    vendors.find((v) => v.id === selectedVendor)?.name || '...';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Vendor Document Management
        </h1>
        <p className="text-muted-foreground">
          Store, track, and manage contracts, licenses, and other important
          vendor documents.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <CardTitle>Select Vendor</CardTitle>
            <CardDescription>
              Choose a vendor to manage their documents.
            </CardDescription>
          </div>
          <UploadDocumentDialog
            vendorId={selectedVendor}
            onDocumentUploaded={onDocumentUploaded}
            disabled={!selectedVendor}
          />
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No vendors found. Please onboard a vendor first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents for {vendorName}</CardTitle>
          <CardDescription>
            A list of all documents associated with the selected vendor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : documents.length > 0 ? (
                documents.map((doc) => {
                  const status = getStatus(doc);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {doc.expiryDate
                          ? new Date(doc.expiryDate).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.text}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDocumentDelete(doc.id, doc.filePath)
                          }
                          disabled={isDeleting}
                        >
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No documents found for this vendor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UploadDocumentDialog({
  vendorId,
  onDocumentUploaded,
  disabled,
}: {
  vendorId: string;
  onDocumentUploaded: (doc: VendorDocument) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const { toast } = useToast();
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      name: '',
      type: 'Other',
      description: '',
    },
  });

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  async function onSubmit(data: UploadFormValues) {
    if (!vendorId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No vendor selected.',
      });
      return;
    }
    
    startTransition(async () => {
        try {
          const fileBase64 = await toBase64(data.file);
          const newDocData = {
            name: data.name,
            type: data.type,
            expiryDate: data.expiryDate?.toISOString(),
            description: data.description,
          };
          const newDoc = await uploadDocument(vendorId, newDocData, fileBase64, data.file.name);

          onDocumentUploaded(newDoc);
          toast({ title: 'Success', description: 'Document uploaded.' });
          setOpen(false);
          form.reset();
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to upload document.',
          });
        }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Annual Maintenance Contract" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="License">License</SelectItem>
                      <SelectItem value="Certification">Certification</SelectItem>
                      <SelectItem value="NDA">NDA</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, ref, name } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="application/pdf,image/*"
                      name={name}
                      ref={ref as any}
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upload
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

\n\n
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
