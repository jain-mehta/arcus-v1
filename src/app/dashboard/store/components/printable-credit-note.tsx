
'use client';

import React from 'react';
interface PrintableCreditNoteProps {
    data: {
        order: Order;
        returnedItems: {
            productId: string;
            name: string;
            sku: string;
            quantity: number;
            unitPrice: number;
        }[];
    };
    store?: Partial<Store> | null;
}

export const PrintableCreditNote = React.forwardRef<HTMLDivElement, PrintableCreditNoteProps>(
    ({ data, store }, ref) => {
        const { order, returnedItems } = data;

        const subtotal = returnedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
        // Assuming the same discount and tax structure as the original order
        const discountAmount = subtotal * ((order.discountPercentage || 0) / 100);
        const subtotalAfterDiscount = subtotal - discountAmount;
        const tax = subtotalAfterDiscount * 0.18; // Assuming 18% GST
        const totalCredit = subtotalAfterDiscount + tax;
        
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-sm">
            <header className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold">{store?.name || 'Bobs Bath Fittings'}</h1>
                    <p>{store?.address || 'Store Address'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-red-600">Credit Note</h2>
                    <p>Credit Note #: CN-{order.orderNumber}</p>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <p>Original Order: {order.orderNumber}</p>
                </div>
            </header>

            <section className="my-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Credit For:</h3>
                <p className="font-bold">{order.customerDetails?.name || 'Walk-in Customer'}</p>
                 <p>{order.customerDetails?.address || ''}</p>
            </section>

            <section>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className='bg-gray-100'>
                            <th className="p-3 text-sm font-semibold uppercase">Item Description</th>
                            <th className="p-3 text-sm font-semibold uppercase text-center">Qty Returned</th>
                            <th className="p-3 text-sm font-semibold uppercase text-right">Unit Price</th>
                            <th className="p-3 text-sm font-semibold uppercase text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returnedItems.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                                <td className="p-3 text-right">₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
             <section className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between"><span className="text-gray-600">Discount</span><span>- ₹{discountAmount.toLocaleString('en-IN')}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
                    <div className="border-t-2 border-gray-800 my-2"></div>
                    <div className="flex justify-between font-bold text-lg"><span className="text-gray-800">Total Credit</span><span>₹{totalCredit.toLocaleString('en-IN')}</span></div>
                </div>
            </section>


            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                <p>This credit can be applied to future purchases.</p>
                <p>{store?.receiptFooter || 'Thank you for your business!'}</p>
            </footer>
        </div>
    );
});
PrintableCreditNote.displayName = 'PrintableCreditNote';


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
