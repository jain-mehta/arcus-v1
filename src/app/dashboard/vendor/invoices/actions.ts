
'use server';

import {
  MOCK_INVOICES,
  MOCK_PURCHASE_ORDERS,
  getPurchaseOrders as getPurchaseOrdersFromDb,
} from '@/lib/mock-data/firestore';
import type { Invoice, PurchaseOrder } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';

export async function getPurchaseOrders(vendorId?: string): Promise<PurchaseOrder[]> {
    const { purchaseOrders } = await getPurchaseOrdersFromDb(vendorId);
    return purchaseOrders;
}

export async function uploadInvoice(
  invoiceData: any,
  fileBase64: string,
  fileName: string
): Promise<Invoice> {
  console.log('Mock uploadInvoice:', invoiceData, fileName);
  const newInvoice: Invoice = {
    id: `inv-${Date.now()}`,
    ...invoiceData,
    uploadDate: new Date().toISOString(),
    status: 'Unpaid',
    fileName: fileName,
    fileUrl: fileBase64, // Using base64 for mock display
    filePath: `invoices/${fileName}`,
  };
  MOCK_INVOICES.push(newInvoice);
  revalidatePath('/dashboard/vendor/invoices');
  return newInvoice;
}

export async function updateInvoice(
  invoiceId: string,
  data: Partial<Invoice>
): Promise<{ success: boolean }> {
  console.log('Mock updateInvoice:', invoiceId, data);
  const index = MOCK_INVOICES.findIndex((inv) => inv.id === invoiceId);
  if (index > -1) {
    MOCK_INVOICES[index] = { ...MOCK_INVOICES[index], ...data };
    revalidatePath('/dashboard/vendor/invoices');
    return { success: true };
  }
  return { success: false };
}


