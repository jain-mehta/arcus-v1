


'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { Loader2, ShoppingCart, Download, Printer } from 'lucide-react';
import Link from 'next/link';

interface Quotation {
    id: string;
    customerId: string;
    status: string;
    [key: string]: any;
}

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
