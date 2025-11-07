
import { notFound } from 'next/navigation';
import { QuotationDetailClient } from './client';
import { QuotationDetailView } from './view';
import { createOrderFromQuote } from '../../actions';

export default async function QuotationDetailPage({ params }: any) {
  
  const quotation = await getQuotation(params.id);

  if (!quotation) {
    notFound();
  }
  
  const customer = quotation.customerId ? await getCustomer(quotation.customerId) : null;

  const subtotal = quotation.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.18; // Assuming 18% GST

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <QuotationDetailClient quotation={quotation} createOrderFromQuote={createOrderFromQuote} />
        <QuotationDetailView 
            quotation={quotation} 
            customer={customer}
            subtotal={subtotal}
            tax={tax}
        />
    </div>
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
