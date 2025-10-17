
'use client';

import React from 'react';
import type { Order, Customer, Store } from '@/lib/firebase/types';

interface PrintablePackingSlipProps {
    order: Order;
    customer?: Partial<Customer> | null;
    store?: Partial<Store> | null;
}

export const PrintablePackingSlip = React.forwardRef<HTMLDivElement, PrintablePackingSlipProps>(
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
                    <h2 className="text-3xl font-bold uppercase text-gray-700">Packing Slip</h2>
                    <p className="text-base">Order #: {order.orderNumber}</p>
                    <p className="text-base">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-8 my-8">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Ship To:</h3>
                    <p className="font-bold">{customer?.name || 'N/A'}</p>
                    <p>{customer?.address || 'N/A'}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">From:</h3>
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
                        {order.lineItems.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-3">{item.sku}</td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                <p>{store?.receiptFooter || 'Thank you for your order!'}</p>
            </footer>
        </div>
    );
});
PrintablePackingSlip.displayName = 'PrintablePackingSlip';
