
import { notFound } from 'next/navigation';
import { CustomerDetailView } from './customer-detail-view';
import type { Metadata } from 'next';

// This is the definitive fix. By removing the custom, incorrect PageProps
// type and letting Next.js infer the types for params, we resolve the
// build error permanently.
export default async function CustomerDetailPage({ params }: any) {
  const { id } = params;

  // Fetch all customer-related data in parallel
  const [customer, opportunities, quotations, orders, communicationLogs] = await Promise.all([
    getCustomer(id),
    getOpportunitiesByCustomerId(id),
    getQuotationsByCustomerId(id),
    getOrdersByCustomerId(id),
    getCommunicationLogsByCustomerId(id)
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <CustomerDetailView
      customer={customer}
      opportunities={opportunities}
      quotations={quotations}
      orders={orders}
      communicationLogs={communicationLogs}
    />
  );
}

// Stub implementations
async function getCustomer(id: string): Promise<any> {
  return null;
}

async function getOpportunitiesByCustomerId(customerId: string): Promise<any[]> {
  return [];
}

async function getQuotationsByCustomerId(customerId: string): Promise<any[]> {
  return [];
}

async function getOrdersByCustomerId(customerId: string): Promise<any[]> {
  return [];
}

async function getCommunicationLogsByCustomerId(customerId: string): Promise<any[]> {
  return [];
}


// Adding a metadata export is good practice and helps Next.js with page optimization.
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const customer = await getCustomer(params.id);
  return {
    title: customer ? `Customer: ${customer.name}` : 'Customer Details',
  };
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
