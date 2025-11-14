

'use client';

import React from 'react';
import type { Payslip, Store } from '@/lib/types/domain';
import type { PayslipLayout } from '../payroll/formats/actions';

interface PrintablePayslipProps {
    payslip: Payslip;
    store: Partial<Store>;
    layout?: PayslipLayout;
}


// A simplified function to replace placeholders like {{employeeName}}
const replacePlaceholders = (text: string | undefined, payslip: Payslip, store: Partial<Store>) => {
    if (!text) return '';
    return text
        .replace(/{{companyName}}/g, store.name || '')
        .replace(/{{companyAddress}}/g, store.address || '')
        .replace(/{{payslipMonth}}/g, payslip.month || '')
        .replace(/{{employeeName}}/g, payslip.staffName || '')
        .replace(/{{employeeId}}/g, payslip.staffId || '');
};

const renderSection = (section: any, payslip: Payslip) => {
    const fields = section.fields.map((field: any) => {
        let value: string | number = field.exampleValue;

        // This is a more robust mapping from field labels to actual payslip data
        const label = field.label.toLowerCase();
        if (label.includes('gross')) value = payslip.grossSalary || 0;
        else if (label.includes('total deduction')) value = payslip.deductions || 0;
        else if (label.includes('net')) value = payslip.netSalary || 0;
        else if (label.includes('employee id')) value = payslip.staffId || '';
        else {
            const component = (payslip.components || []).find((c: any) => c.name.toLowerCase() === label);
            if (component) {
                 if (component.calculationType === 'Percentage') {
                    value = `${component.value}%`; // Show percentage for relevant fields
                } else {
                    value = component.value;
                }
            }
        }

        return {
            ...field,
            // Prioritize actual payslip value, fallback to example
            value: typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value
        };
    });

    return (
        <div key={section.title} className="p-2 border-b" style={{ gridColumn: `span ${section.columns || 1}` }}>
            <h4 className="font-semibold text-xs uppercase tracking-wider mb-2">{section.title}</h4>
            <div className={`grid grid-cols-${section.columns > 1 ? section.columns : 2} gap-x-4 gap-y-2`}>
                {fields.map((field: any) => (
                    <div key={field.label}>
                        <p className="text-[10px] text-gray-500">{field.label}</p>
                        <p className="text-xs font-medium">{field.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const PrintablePayslip = React.forwardRef<HTMLDivElement, PrintablePayslipProps>(
    ({ payslip, store, layout }, ref) => {
        
    // Fallback to a default layout if none is provided, to avoid crashes
    const safeLayout = layout || {
        header: { companyName: store.name || 'Company Name', companyAddress: store.address || 'Address', title: 'Payslip', period: payslip.month || '' },
        body: { gridColumns: 2, sections: [
            { title: 'Earnings', columns: 1, fields: (payslip.components || []).filter((c: any) => c.type === 'Earning').map((c: any) => ({ label: c.name, exampleValue: `₹${c.value}`})) },
            { title: 'Deductions', columns: 1, fields: (payslip.components || []).filter((c: any) => c.type === 'Deduction').map((c: any) => ({ label: c.name, exampleValue: `₹${c.value}`})) },
        ] },
        footer: { summary: [
            { label: 'Gross Salary', exampleValue: `₹${payslip.grossSalary || 0}`, isTotal: false },
            { label: 'Total Deductions', exampleValue: `₹${payslip.deductions || 0}`, isTotal: false },
            { label: 'Net Salary', exampleValue: `₹${payslip.netSalary || 0}`, isTotal: true },
        ], notes: 'This is a computer-generated payslip.' },
    };

    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans text-xs">
             <header className="text-center pb-4 border-b-2 border-black">
                <h1 className="text-2xl font-bold">{replacePlaceholders(safeLayout.header.companyName, payslip, store)}</h1>
                <p>{replacePlaceholders(safeLayout.header.companyAddress, payslip, store)}</p>
                <h2 className="text-xl font-semibold mt-4">{replacePlaceholders(safeLayout.header.title, payslip, store)}</h2>
                <p>{replacePlaceholders(safeLayout.header.period, payslip, store)}</p>
            </header>
            
             <div className={`grid grid-cols-${safeLayout.body.gridColumns || 1} gap-2 my-4`}>
                 {safeLayout.body.sections.map(section => renderSection(section, payslip))}
            </div>

            <section className="mt-6 p-4 bg-gray-100 border-2 border-black">
                 {safeLayout.footer.summary.map(item => (
                    <div key={item.label} className="flex justify-between font-bold text-lg">
                        <span>{item.label}</span>
                        <span>{item.label.includes('Net') ? `₹${(payslip.netSalary || 0).toLocaleString('en-IN')}` : item.label.includes('Gross') ? `₹${(payslip.grossSalary || 0).toLocaleString('en-IN')}` : item.label.includes('Deduction') ? `₹${(payslip.deductions || 0).toLocaleString('en-IN')}` : item.exampleValue}</span>
                    </div>
                ))}
            </section>
            
            {safeLayout.footer.notes && (
                 <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                    <p>{safeLayout.footer.notes}</p>
                </footer>
            )}
        </div>
    );
});
PrintablePayslip.displayName = 'PrintablePayslip';


