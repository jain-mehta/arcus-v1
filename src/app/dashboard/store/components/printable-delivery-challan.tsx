
'use client';

import React from 'react';

interface Order {
  id: string;
  order_number: string;
  order_date?: string;
  total_amount: number;
  discountPercentage?: number;
  [key: string]: any;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  [key: string]: any;
}

interface PrintableDeliveryChallanProps {
    order: Order;
    customer?: Partial<Customer> | null;
    store?: Partial<Store> | null;
}

export const PrintableDeliveryChallan = React.forwardRef<HTMLDivElement, PrintableDeliveryChallanProps>(
    ({ order, customer, store }, ref) => {
        
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-sm">
            <header className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold">{store?.name || 'Bobs Bath Fittings'}</h1>
                    <p>{store?.address || 'Store Address'}</p>
                    <p>{store ? `${store.city}, ${store.state} - ${store.pincode}`: ''}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-gray-700">Delivery Challan</h2>
                    <p className="text-base">Order #: {order.orderNumber}</p>
                    <p className="text-base">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-8 my-8">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Deliver To:</h3>
                    <p className="font-bold">{customer?.name || 'N/A'}</p>
                    <p>{customer?.address || 'N/A'}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Shipped From:</h3>
                    <p className="font-bold">{store?.name || 'Bobs Bath Fittings'}</p>
                    <p>{store?.address || 'Store Address'}</p>
                </div>
            </section>

            <section>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className='bg-gray-100'>
                            <th className="p-3 text-sm font-semibold uppercase">SKU</th>
                            <th className="p-3 text-sm font-semibold uppercase">Item Description</th>
                            <th className="p-3 text-sm font-semibold uppercase text-center">Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.lineItems?.map((item: any, index: number) => (
                            <tr key={index} className="border-b">
                                <td className="p-3">{item.sku}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <div className="grid grid-cols-2 gap-8 mt-16">
                <div className="pt-8 border-t">
                    <p className="text-sm">Received By:</p>
                </div>
                 <div className="pt-8 border-t">
                    <p className="text-sm">Authorized Signature:</p>
                </div>
            </div>

            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                <p>{store?.receiptFooter || 'Thank you for your business!'}</p>
            </footer>
        </div>
    );
});
PrintableDeliveryChallan.displayName = 'PrintableDeliveryChallan';



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
