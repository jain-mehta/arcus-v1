
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Printer, Download, MessageCircle, Truck } from 'lucide-react';
import { PrintableInvoice } from '@/app/dashboard/store/components/printable-invoice';
import { PrintableThermalReceipt } from '@/app/dashboard/store/components/printable-thermal-receipt';
import { PrintablePackingSlip } from '@/app/dashboard/store/components/printable-packing-slip';
import { PrintableDeliveryChallan } from '@/app/dashboard/store/components/printable-delivery-challan';
const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'Delivered':
        case 'Confirmed':
            return 'default';
        case 'Shipped':
        case 'Picked':
            return 'secondary';
        case 'Draft':
            return 'outline';
        default:
            return 'destructive';
    }
};

const MASTER_STORE_FALLBACK: Store = {
    id: 'master-format',
    name: 'Bobs Bath Fittings Pvt Ltd (Master)',
    address: 'X-18, UPSIDC-IA, G. T. ROAD, ETAH',
    city: 'Etah',
    state: 'Uttar Pradesh',
    pincode: '207001',
    region: 'National',
    cashInHand: 0,
    cashAlertThreshold: 0,
    contact: '+91-9810045456',
    email: 'thebobs06@gmail.com',
    gstin: '09ABKPJ5249B2ZO',
    receiptHeader: 'Tax Invoice',
    receiptFooter: 'This is a Computer Generated Invoice',
    invoiceTemplate: 'A4',
};

export default async function SalesOrderDetailPage({ params }: any) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }
  
  let customer: Partial<Customer> | null = null;
  // If the order was created from POS for a walk-in, the details are inlined
  if (order.customerDetails?.name) {
    customer = {
        id: 'walk-in',
        name: order.customerDetails.name,
        address: order.customerDetails.address,
        email: order.customerDetails.email,
        phone: order.customerDetails.phone,
    }
  } else if (order.customerId && order.customerId !== 'walk-in-customer') {
    // Otherwise, fetch the full customer record, avoiding the generic walk-in ID
    customer = await getCustomer(order.customerId);
  } else {
    // Handle the case of a generic walk-in customer with no details
    customer = { id: 'walk-in-customer', name: 'Walk-in Customer' };
  }

  const store = order.storeId ? [].find(s => s.id === order.storeId) : MASTER_STORE_FALLBACK;

  const subtotal = order.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * ((order.discountPercentage || 0) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = subtotalAfterDiscount * 0.18; // Assuming 18% GST
  
  const renderPrintableComponent = () => {
    if (!store) {
        // Default to A4 if no store is associated
        return <PrintableInvoice order={order} customer={customer} store={store} />;
    }
    switch (store.invoiceTemplate) {
        case 'thermal':
            return <PrintableThermalReceipt order={order} customer={customer} store={store} />;
        case 'Packing Slip':
            return <PrintablePackingSlip order={order} customer={customer} store={store} />;
        case 'Delivery Challan':
            return <PrintableDeliveryChallan order={order} customer={customer} store={store} />;
        case 'A4':
        default:
            return <PrintableInvoice order={order} customer={customer} store={store} />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sales Order</h1>
                <p className="text-muted-foreground">Order Number: {order.orderNumber}</p>
                <div className="mt-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Truck className="mr-2 h-4 w-4" /> Track Shipment</Button>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download</Button>
                <Button><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Printable Invoice Preview</CardTitle>
                <CardDescription>This is a preview of the invoice that will be printed.</CardDescription>
            </CardHeader>
            <CardContent className="bg-muted p-4">
                <div className="bg-white p-4 shadow-lg rounded-lg border w-full">
                   {renderPrintableComponent()}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n

// TODO: Replace with actual database queries
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
