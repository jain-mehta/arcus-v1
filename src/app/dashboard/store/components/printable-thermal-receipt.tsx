
'use client';

import React from 'react';
import type { Order, Customer, Store } from '@/lib/types/domain';

interface PrintableThermalReceiptProps {
    order: Order;
    customer?: Partial<Customer> | null;
    store?: Partial<Store> | null;
}

export const PrintableThermalReceipt = React.forwardRef<HTMLDivElement, PrintableThermalReceiptProps>(
    ({ order, customer, store }, ref) => {

    const lineItems = order.lineItems || order.items || [];
    const subtotal = lineItems.reduce((acc, item) => acc + (((item as any).unitPrice || (item as any).unit_price || 0) * ((item as any).quantity || 0)), 0);
    const discountAmount = subtotal * ((order.discountPercentage || 0) / 100);

    return (
        <div ref={ref} className="p-1 bg-white text-black font-mono text-[10px] w-[288px]"> {/* 3-inch receipt width is approx 288px */}
            <div className='text-center'>
                <h1 className="font-bold text-lg">{store?.name || 'Store Name'}</h1>
                <p>{store?.address || 'Store Address'}</p>
                <p>Ph No:- {store?.contact || 'N/A'}</p>
                <p className="mt-1 font-bold">CASH MEMO - RETAIL INVOICE</p>
            </div>
            
            <div className="border-t border-b border-dashed border-black my-2 py-1">
                <div className='grid grid-cols-[1fr_auto]'>
                    <span className='font-bold'>Item Name</span>
                    <span className='font-bold text-right'>Amount(Rs)</span>
                </div>
            </div>

            <div className="space-y-1">
                {lineItems.map(item => (
                    <div key={(item as any).productId || (item as any).product_id} className="grid grid-cols-[1fr_auto]">
                        <span>{(item as any).name || (item as any).product_name || 'Item'}</span>
                        <span className="text-right">{((item as any).unitPrice || (item as any).unit_price || 0).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {discountAmount > 0 && (
                 <div className="grid grid-cols-[1fr_auto] mt-1">
                    <span>Discount</span>
                    <span className="text-right">-{discountAmount.toFixed(2)}</span>
                </div>
            )}
            
            <div className="border-t border-dashed border-black my-2" />

            <div className="space-y-1 font-bold text-sm">
                <div className='grid grid-cols-2'>
                    <span>BALANCE DUE</span>
                    <span className="text-right">₹{(order.totalAmount || order.total_amount || subtotal).toFixed(2)}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-2" />

             <div className="space-y-1">
                <div className='grid grid-cols-2'>
                    <span>Total number of items sold = {lineItems.length}</span>
                    <span className="text-right"></span>
                </div>
                 {discountAmount > 0 && (
                    <div className='grid grid-cols-2'>
                        <span>TOTAL SAVING:</span>
                        <span className="text-right">{discountAmount.toFixed(2)}</span>
                    </div>
                 )}
            </div>

             <div className="border-t border-dashed border-black my-2" />
             
             <div className="text-center text-xs">
                <p>C4207 #0113 {new Date(order.orderDate || order.order_date || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}  {new Date(order.orderDate || order.order_date || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}).replace(/ /g,'')}</p>
                <p>AMOUNT INCLUSIVE OF APPLICABLE TAXES</p>
                <p>TIN (VAT)# : {store?.gstin || 'N/A'}</p>
                <p>*Thank You* Please Visit again!</p>
            </div>

            <div className="border-t border-dashed border-black my-2" />

            <div className='text-center text-[8px]'>
                <p>*{store?.receiptFooter || 'This is a Computer Generated Invoice'}*</p>
            </div>
        </div>
    );
});
PrintableThermalReceipt.displayName = 'PrintableThermalReceipt';


