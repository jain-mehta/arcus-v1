
'use client';

import React from 'react';
import type { Order, Customer, Store } from '@/lib/firebase/types';

interface DebitNoteData {
    originalOrderNumber: string;
    debitNoteNumber: string;
    date: string;
    customer: Partial<Customer>;
    items: {
        description: string;
        amount: number;
    }[];
    reason: string;
}

interface PrintableDebitNoteProps {
    data: DebitNoteData;
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


export const PrintableDebitNote = React.forwardRef<HTMLDivElement, PrintableDebitNoteProps>(
    ({ data, store }, ref) => {
        const { debitNoteNumber, date, customer, items, reason, originalOrderNumber } = data;

        const totalDebitAmount = items.reduce((acc, item) => acc + item.amount, 0);
        
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-sm">
            <header className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold">{store?.name || 'Bobs Bath Fittings'}</h1>
                    <p>{store?.address || 'Store Address'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-blue-600">Debit Note</h2>
                    <p>Debit Note #: {debitNoteNumber}</p>
                    <p>Date: {new Date(date).toLocaleDateString()}</p>
                    <p>Ref. Order: {originalOrderNumber}</p>
                </div>
            </header>

            <section className="my-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Debit To:</h3>
                <p className="font-bold">{customer?.name || 'N/A'}</p>
                 <p>{customer?.address || ''}</p>
            </section>

            <section>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className='bg-gray-100'>
                            <th className="p-3 text-sm font-semibold uppercase">Description</th>
                            <th className="p-3 text-sm font-semibold uppercase text-right">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-3 font-medium">{item.description}</td>
                                <td className="p-3 text-right">₹{item.amount.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

             <section className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Reason for Debit:</h3>
                <p className="text-sm border p-2 bg-gray-50 rounded">{reason}</p>
            </section>
            
             <section className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                    <div className="border-t-2 border-gray-800 my-2"></div>
                    <div className="flex justify-between font-bold text-lg"><span className="text-gray-800">Total Debit Amount</span><span>₹{totalDebitAmount.toLocaleString('en-IN')}</span></div>
                    <div className="text-right text-xs text-gray-600">{numberToWords(totalDebitAmount)}</div>
                </div>
            </section>


            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                <p>This is a computer generated document.</p>
                <p>{store?.receiptFooter || 'Thank you for your business!'}</p>
            </footer>
        </div>
    );
});
PrintableDebitNote.displayName = 'PrintableDebitNote';
