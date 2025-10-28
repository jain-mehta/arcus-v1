

'use client';

import React from 'react';
import type { Order, Customer, Store } from '@/lib/mock-data/types';

interface PrintableInvoiceProps {
    order: Order;
    customer?: Partial<Customer> | null;
    store?: Partial<Store> | null;
}

function numberToWords(num: number): string {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'zero';

    const toWords = (n: number): string => {
        if (n < 20) return a[n];
        let digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 == 0 ? '' : ' and ' + toWords(n % 100));
        if (n < 100000) return toWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 != 0 ? ' ' + toWords(n % 1000) : '');
        if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' lakh' + (n % 100000 != 0 ? ' ' + toWords(n % 100000) : '');
        return '';
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let words = `INR ${toWords(rupees)}`.trim();
    if (paise > 0) {
        words += ` and ${toWords(paise)} paise`;
    }
    words += ' only';
    
    return words.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}


export const PrintableInvoice = React.forwardRef<HTMLDivElement, PrintableInvoiceProps>(
    ({ order, customer, store }, ref) => {

    const subtotal = order.lineItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const discountAmount = subtotal * ((order.discountPercentage || 0) / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    
    // In India, GST is typically calculated on the discounted price.
    const cgst = subtotalAfterDiscount * 0.09; // 9%
    const sgst = subtotalAfterDiscount * 0.09; // 9%
    const total = subtotalAfterDiscount + cgst + sgst;
    
    // Rounding difference
    const roundOff = order.totalAmount - total;
        
    return (
        <div ref={ref} className="p-2 bg-white text-black font-sans text-[10px]">
            <div className='text-center text-[8px] font-bold'>(ORIGINAL FOR RECIPIENT)</div>
            <div className='text-center font-bold'>{store?.receiptHeader || 'Tax Invoice'}</div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <h1 className="font-bold text-sm">{store?.name || 'Bobs Bath Fittings'}</h1>
                    <p>{store?.address || 'X-18, UPSIDC-IA,'}</p>
                    <p>{store ? `${store.city}, ${store.state} - ${store.pincode}`: 'G. T. ROAD, ETAH-207001'}</p>
                    <p>GSTIN/UIN: {store?.gstin || '09ABKPJ5249B2ZO'}</p>
                    <p>State Name: {store?.state || 'Uttar Pradesh'}, Code: 09</p>
                    <p>Contact: {store?.contact || '+91-9810045456'}</p>
                    <p>E-Mail: {store?.email || 'thebobs06@gmail.com'}</p>
                </div>
                <div className='border border-black p-1'>
                    <div className='flex'>
                        <div className='w-1/2 border-r border-b border-black p-1'><strong>Invoice No.</strong><br/>{order.orderNumber.split('-').pop()}</div>
                        <div className='w-1/2 border-b border-black p-1'><strong>Dated</strong><br/>{new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                    </div>
                    <div className='flex'>
                        <div className='w-full border-b border-black p-1'><strong>Delivery Note</strong></div>
                    </div>
                    <div className='flex'>
                         <div className='w-1/2 border-r border-b border-black p-1'><strong>Mode/Terms of Payment</strong></div>
                         <div className='w-1/2 border-b border-black p-1'></div>
                    </div>
                    <div className='flex'>
                        <div className='w-1/2 border-r border-b border-black p-1'><strong>Buyer's Order No.</strong></div>
                        <div className='w-1/2 border-b border-black p-1'><strong>Dated</strong></div>
                    </div>
                    {/* ... other header fields */}
                     <div className='flex'>
                        <div className='w-full border-b border-black p-1 h-8'><strong>Terms of Delivery</strong></div>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4 mt-2 border border-black'>
                 <div className='p-1 border-r border-black'>
                    <p>Consignee (Ship to)</p>
                    <p className='font-bold'>{customer?.name}</p>
                    <p>{customer?.address || 'N/A'}</p>
                 </div>
                 <div className='p-1'>
                    <p>Buyer (Bill to)</p>
                    <p className='font-bold'>{customer?.name}</p>
                    <p>{customer?.address || 'N/A'}</p>
                    <p>Place of Supply: {store?.state || 'Uttar Pradesh'}</p>
                 </div>
            </div>

            <table className="w-full text-left border-collapse border border-black mt-2">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black p-1">SI No</th>
                        <th className="border-r border-black p-1">Description of Goods</th>
                        <th className="border-r border-black p-1">HSN/SAC</th>
                        <th className="border-r border-black p-1">GST Rate</th>
                        <th className="border-r border-black p-1">Quantity Shipped</th>
                        <th className="border-r border-black p-1">Quantity Billed</th>
                        <th className="border-r border-black p-1">Rate</th>
                        <th className="border-r border-black p-1">per</th>
                        <th className="border-r border-black p-1">Disc. %</th>
                        <th className="p-1">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {order.lineItems.length > 0 ? (
                        order.lineItems.map((item, index) => (
                            <tr key={item.productId} className="border-b border-black">
                                <td className="border-r border-black p-1 text-center">{index + 1}</td>
                                <td className="border-r border-black p-1">{item.name}</td>
                                <td className="border-r border-black p-1"></td>
                                <td className="border-r border-black p-1 text-center">18%</td>
                                <td className="border-r border-black p-1 text-center">{item.quantity} Pcs</td>
                                <td className="border-r border-black p-1 text-center">{item.quantity} Pcs</td>
                                <td className="border-r border-black p-1 text-right">{item.unitPrice.toFixed(2)}</td>
                                <td className="border-r border-black p-1 text-center">Pcs</td>
                                <td className="border-r border-black p-1 text-center">{order.discountPercentage || 0}%</td>
                                <td className="p-1 text-right">{(item.quantity * item.unitPrice * (1 - ((order.discountPercentage || 0) / 100))).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                        ))
                    ) : (
                        // Placeholder for the template view
                        <tr className="border-b border-black">
                             <td className="border-r border-black p-1 text-center h-48" colSpan={10}>
                                <span className="text-gray-400">Line items will appear here.</span>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            <div className='grid grid-cols-2 mt-1'>
                 <div>
                    <p className='font-bold'>Less</p>
                 </div>
                 <div className='flex justify-end'>
                    <table className='w-1/2'>
                         <tbody>
                            <tr>
                                <td className='p-1 text-right' colSpan={2}>{subtotalAfterDiscount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                                <td className='p-1'>CGST@ 9%</td>
                                <td className='p-1 text-right'>{cgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                             <tr>
                                <td className='p-1'>SGST @ 9%</td>
                                <td className='p-1 text-right'>{sgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                             <tr>
                                <td className='p-1'>Round Off</td>
                                <td className='p-1 text-right'>{roundOff.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                         </tbody>
                    </table>
                 </div>
            </div>

            <div className='grid grid-cols-[1fr_auto_auto_auto] border border-black mt-2 font-bold'>
                <div className='p-1 border-r border-black'>Amount Chargeable (in words)</div>
                <div className='p-1 border-r border-black text-center'>Total</div>
                <div className='p-1 border-r border-black text-center'>{order.lineItems.reduce((acc, item) => acc + item.quantity, 0)} Pcs</div>
                <div className='p-1 text-right'>₹ {order.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <div className='p-1 border-r border-black' style={{gridColumn: '1 / span 1'}}>{numberToWords(order.totalAmount)}</div>
                <div className='p-1 border-r border-black'></div>
                <div className='p-1 border-r border-black text-center'>{order.lineItems.reduce((acc, item) => acc + item.quantity, 0)} Pcs</div>
                <div className='p-1 text-right'>E. & O.E</div>
            </div>

            <div className='grid grid-cols-2 mt-2'>
                <div className='border-t border-l border-b border-black p-1'>
                    <p>Declaration</p>
                    <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                </div>
                <div className='border-t border-r border-b border-black p-1 flex flex-col justify-between'>
                    <p className='text-center'>for {store?.name || 'BOBS BATH FITTINGS'}</p>
                    <p className='text-right mt-8'>Authorised Signatory</p>
                </div>
            </div>

            <div className='text-center font-bold text-xs mt-1'>
                <p>SUBJECT TO ETAH JURISDICTION</p>
                <p>{store?.receiptFooter || 'This is a Computer Generated Invoice'}</p>
            </div>
        </div>
    );
});
PrintableInvoice.displayName = 'PrintableInvoice';


