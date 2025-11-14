
'use client';

import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { updatePurchaseOrderStatus } from "../../actions";
import { useToast } from "@/hooks/use-toast";
export function ApprovalActions({ poId }: { poId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleUpdateStatus = (status: any) => {
        startTransition(async () => {
            try {
                await updatePurchaseOrderStatus(poId, status);
                toast({ 
                    title: `PO ${status}`, 
                    description: `The purchase order has been ${status.toLowerCase()}.` 
                });
            } catch (error) {
                toast({ 
                    variant: 'destructive', 
                    title: "Error", 
                    description: `Failed to update the PO status.` 
                });
            }
        });
    };

    return (
        <div className="flex gap-2">
            <Button variant="destructive" onClick={() => handleUpdateStatus('draft')} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Reject
            </Button>
            <Button variant="default" onClick={() => handleUpdateStatus('approved')} disabled={isPending}>
                 {isPending ? <Loader2 className="animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Approve
            </Button>
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
