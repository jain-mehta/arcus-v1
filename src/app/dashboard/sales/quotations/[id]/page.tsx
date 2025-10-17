
import { notFound } from 'next/navigation';
import { getQuotation, getCustomer } from '@/lib/firebase/firestore';
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
