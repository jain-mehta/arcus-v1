
'use client';

import React from 'react';
interface FnFData {
    settlementNumber: string;
    date: string;
    employee: Partial<User>;
    lastWorkingDay: string;
    reason: string;
    earnings: { description: string; amount: number }[];
    deductions: { description: string; amount: number }[];
    totalEarnings: number;
    totalDeductions: number;
    netPayable: number;
}

interface PrintableFnFProps {
    data: FnFData;
    store?: Partial<Store> | null;
}

function numberToWords(num: number): string {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'Zero';

    const toWords = (n: number): string => {
        if (n < 0) return `minus ${toWords(Math.abs(n))}`;
        if (n < 20) return a[n];
        let digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 === 0 ? '' : ' and ' + toWords(n % 100));
        if (n < 100000) return toWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
        if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' lakh' + (n % 100000 !== 0 ? ' ' + toWords(n % 100000) : '');
        return '';
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let words = `INR ${toWords(rupees)}`.trim();
    if (paise > 0) {
        words += ` and ${toWords(paise)} Paise`;
    }
    words += ' Only';
    
    return words.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}


export const PrintableFnF = React.forwardRef<HTMLDivElement, PrintableFnFProps>(
    ({ data, store }, ref) => {
        const { settlementNumber, date, employee, lastWorkingDay, reason, earnings, deductions, totalEarnings, totalDeductions, netPayable } = data;
        
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-sm">
            <header className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold">{store?.name || 'Bobs Bath Fittings'}</h1>
                    <p>{store?.address || 'Store Address'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-blue-600">Full and Final Statement</h2>
                    <p>Statement #: {settlementNumber}</p>
                    <p>Date: {new Date(date).toLocaleDateString()}</p>
                    <p>Last Working Day: {new Date(lastWorkingDay).toLocaleDateString()}</p>
                </div>
            </header>

            <section className="my-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Employee Details:</h3>
                <p className="font-bold">{employee?.name || 'N/A'}</p>
                 <p>{employee?.email || ''}</p>
            </section>

             <section className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-gray-600">Reason for Settlement:</h3>
                <p className="text-sm border p-2 bg-gray-50 rounded">{reason}</p>
            </section>

            <section className="grid grid-cols-2 gap-8 my-8">
                <div>
                    <h4 className="font-bold text-lg mb-2 text-green-700">Earnings</h4>
                    <table className="w-full text-left border-collapse">
                        <tbody>
                            {earnings.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2 text-right">₹{item.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold border-t-2 border-black">
                                <td className="p-2">Total Earnings</td>
                                <td className="p-2 text-right">₹{totalEarnings.toLocaleString('en-IN')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-2 text-red-700">Deductions</h4>
                    <table className="w-full text-left border-collapse">
                         <tbody>
                            {deductions.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2 text-right">₹{item.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold border-t-2 border-black">
                                <td className="p-2">Total Deductions</td>
                                <td className="p-2 text-right">₹{totalDeductions.toLocaleString('en-IN')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
            
             <section className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                    <div className="border-t-2 border-gray-800 my-2"></div>
                    <div className="flex justify-between font-bold text-lg"><span className="text-gray-800">Net Payable Amount</span><span>₹{netPayable.toLocaleString('en-IN')}</span></div>
                    <div className="text-right text-xs text-gray-600">{numberToWords(netPayable)}</div>
                </div>
            </section>


            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
                <p>This is a computer generated document.</p>
                <p>{store?.receiptFooter || 'Thank you for your service!'}</p>
            </footer>
        </div>
    );
});
PrintableFnF.displayName = 'PrintableFnF';


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
