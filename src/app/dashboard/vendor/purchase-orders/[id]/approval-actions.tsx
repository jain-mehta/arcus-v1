
'use client';

import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { updatePurchaseOrderStatus } from "../../actions";
import { useToast } from "@/hooks/use-toast";
import type { PurchaseOrder } from "@/lib/mock-data/types";

export function ApprovalActions({ poId }: { poId: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleUpdateStatus = (status: PurchaseOrder['status']) => {
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
            <Button variant="destructive" onClick={() => handleUpdateStatus('Canceled')} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Reject
            </Button>
            <Button variant="default" onClick={() => handleUpdateStatus('Approved')} disabled={isPending}>
                 {isPending ? <Loader2 className="animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Approve
            </Button>
        </div>
    )
}
