
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
import type { Vendor, User } from '@/lib/mock-data/types';
import { Loader2, Edit } from 'lucide-react';
import { useTransition } from 'react';
import { deactivateVendor, deleteVendor } from './actions';
import { cn } from '@/lib/utils';
import { CommunicationLogDialog } from './communication-log-dialog';

export function ClientWrapper({ vendorData, storeManagers }: { vendorData: Vendor, storeManagers: User[] }) {
  const router = useRouter();
  const [isDeactivating, startDeactivation] = useTransition();
  const [isDeleting, startDeletion] = useTransition();
  const { toast } = useToast();

  const handleDeactivate = () => {
    startDeactivation(async () => {
      try {
        await deactivateVendor(vendorData.id);
        toast({
          title: "Vendor Deactivated",
          description: `${vendorData?.name} has been marked as inactive.`,
        });
        router.refresh();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: "Error",
          description: "Failed to deactivate vendor. Please try again.",
        });
      }
    });
  }

  const handleDelete = () => {
    startDeletion(async () => {
      try {
        await deleteVendor(vendorData.id);
        toast({
          title: "Vendor Deleted",
          description: `${vendorData?.name} has been permanently deleted.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: "Error",
          description: "Failed to delete vendor. Please try again.",
        });
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                {vendorData.name}
                <Badge
                variant={vendorData.status === 'Active' ? 'default' : 'destructive'}
                className="text-base"
                >
                {vendorData.status}
                </Badge>
            </h1>
            <p className="text-muted-foreground">Vendor ID: {vendorData.id}</p>
        </div>
        <div className="flex items-center gap-2">
            <CommunicationLogDialog vendorId={vendorData.id} />
             <Link href={`/dashboard/vendor/profile/${vendorData.id}/edit`}>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
            </Link>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={vendorData.status === 'Inactive' || isDeactivating}
                    >
                        {isDeactivating ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : vendorData.status === 'Active' ? 'Deactivate' : 'Inactive'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to deactivate this vendor?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will mark the vendor as 'Inactive' and may affect active purchase orders. This action can be undone later by editing the vendor profile.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate} disabled={isDeactivating}>
                        {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Deactivation
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Vendor
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the vendor and all associated data from the database.
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
                            Yes, delete vendor
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
  )
}
