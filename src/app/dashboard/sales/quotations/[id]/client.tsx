
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import type { Quotation } from '@/lib/firebase/types';
import { Loader2, ShoppingCart, Download, Printer } from 'lucide-react';
import Link from 'next/link';

interface QuotationDetailClientProps {
    quotation: Quotation;
    createOrderFromQuote: (quote: Quotation) => Promise<{ success: boolean; orderId?: string; message?: string; }>;
}


export function QuotationDetailClient({ quotation, createOrderFromQuote }: QuotationDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isConverting, startConverting] = useTransition();

  const handleConvertToOrder = () => {
    if (!quotation) return;
    startConverting(async () => {
      const result = await createOrderFromQuote(quotation);
      if (result.success && result.orderId) {
        toast({
            title: "Order Created!",
            description: `Order ${result.orderId} created from quotation.`,
            action: <Button asChild size="sm"><Link href={`/dashboard/sales/orders/${result.orderId}`}>View Order</Link></Button>
        });
        router.push('/dashboard/sales/orders');
      } else {
        toast({
          variant: 'destructive',
          title: "Conversion Failed",
          description: result.message || "Could not create an order from this quotation."
        });
      }
    });
  };

  return (
      <div className="flex justify-between items-start">
        <div>
            {/* Title and status are now in the view component */}
        </div>
        <div className="flex gap-2">
                {quotation.status === 'Approved' && (
                    <Button onClick={handleConvertToOrder} disabled={isConverting}>
                        {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                        Convert to Order
                    </Button>
                )}
                <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download</Button>
                <Button><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
    </div>
  );
}
