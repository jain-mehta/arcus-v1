
'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreVertical, Search, Trash2, CheckCircle, Clock, XCircle, Building2, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { approveVendor, rejectVendor, deleteVendor, getVendors } from './actions';
import { useRouter } from 'next/navigation';

interface VendorListProps {
    initialVendors: Vendor[];
}

export function VendorList({ initialVendors }: VendorListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // When the initial props change (e.g., due to a revalidation), update the state
  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(
      (vendor: any) =>
        (vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ((vendor as any).category || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'all' || vendor.status === statusFilter)
    );
  }, [vendors, searchTerm, statusFilter]);

  const handleStatusChange = (vendorId: string, newStatus: any) => {
    startTransition(async () => {
      try {
        if (newStatus === 'active') {
          await approveVendor(vendorId);
        } else if (newStatus === 'rejected') {
          await rejectVendor(vendorId);
        }
        toast({ title: 'Success', description: 'Vendor status updated.' });
        router.refresh(); // Re-fetch data on the server and update props
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
      }
    });
  };

  const handleDelete = (vendorId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteVendor(vendorId);
        if (result.success) {
            toast({ title: 'Success', description: 'Vendor deleted.' });
            router.refresh(); // Re-fetch data on the server and update props
        } else {
            throw new Error('Failed to delete vendor');
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete vendor.' });
      }
    });
  };
  
  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'active': return <CheckCircle className="text-green-500" />;
      case 'pending': return <Clock className="text-yellow-500" />;
      case 'rejected': case 'inactive': return <XCircle className="text-red-500" />;
      default: return null;
    }
  };
  
  return (
    <>
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Vendor Profiles</h1>
                <p className="text-muted-foreground">View, manage, and onboard all vendors.</p>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/dashboard/vendor/onboarding">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Onboard New Vendor
                    </Button>
                </Link>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Vendor List</CardTitle>
                <CardDescription>A comprehensive list of all vendors in your system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="Search by name or category..."
                        className="pl-9 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-auto">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Vendor Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {initialVendors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No vendors found.
                                    </TableCell>
                                </TableRow>
                             ) : filteredVendors.length > 0 ? (
                            filteredVendors.map((vendor: any) => (
                                <TableRow key={vendor.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/vendor/profile/${vendor.id}`} className="hover:underline flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {vendor.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{(vendor as any).category || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={(vendor as any).status === 'active' ? 'default' : (vendor as any).status === 'pending' ? 'secondary' : 'destructive'}>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon((vendor as any).status)}
                                            {(vendor as any).status}
                                        </div>
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {(vendor as any).status === 'pending' && (
                                        <div className="inline-flex gap-2 mr-2">
                                            <Button variant="outline" size="sm" onClick={() => handleStatusChange(vendor.id, 'active')} disabled={isPending}>Approve</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleStatusChange(vendor.id, 'rejected')} disabled={isPending}>Reject</Button>
                                        </div>
                                    )}
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                                            <span className="sr-only">Open menu</span>
                                            <MoreVertical />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                             <Link href={`/dashboard/vendor/profile/${vendor.id}`}>View Profile</Link>
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem
                                                className="text-destructive"
                                                onSelect={(e) => e.preventDefault()}
                                                >
                                                <Trash2 className="mr-2" />
                                                Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete "{vendor.name}" and all associated data.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(vendor.id)}
                                                    className={cn(buttonVariants({ variant: 'destructive' }))}
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No vendors found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </>
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
