

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit } from 'lucide-react';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';
import { StoreDialog } from '../../manage/store-dialog';
// import { CommunicationLogDialog } from './communication-log-dialog';

export function ClientWrapper({ storeData, storeManagers }: { storeData: Store, storeManagers: User[] }) {
  const router = useRouter();
  const [isDeactivating, startDeactivation] = useTransition();
  const [isDeleting, startDeletion] = useTransition();
  const { toast } = useToast();

  const handleDeactivate = () => {
    // startDeactivation(async () => {
    //   try {
    //     // await deactivateVendor(storeData.id);
    //     toast({
    //       title: "Store Deactivated",
    //       description: `${storeData?.name} has been marked as inactive.`,
    //     });
    //     router.refresh();
    //   } catch (error) {
    //     toast({
    //       variant: 'destructive',
    //       title: "Error",
    //       description: "Failed to deactivate store. Please try again.",
    //     });
    //   }
    // });
  }

  const handleDelete = () => {
    // startDeletion(async () => {
    //   try {
    //     // await deleteVendor(storeData.id);
    //     toast({
    //       title: "Store Deleted",
    //       description: `${storeData?.name} has been permanently deleted.`,
    //     });
    //   } catch (error) {
    //     toast({
    //       variant: 'destructive',
    //       title: "Error",
    //       description: "Failed to delete store. Please try again.",
    //     });
    //   }
    // });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                {storeData.name}
            </h1>
            <p className="text-muted-foreground">Store ID: {storeData.id}</p>
        </div>
        <div className="flex items-center gap-2">
            <StoreDialog mode="edit" store={storeData as any} storeManagers={storeManagers as any} />
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Store
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the store and all associated data from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className={cn(buttonVariants({variant: 'destructive'}))}
                            onClick={handleDelete} 
                            disabled={isDeleting}
                        >
                             {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, delete store
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
  )
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
