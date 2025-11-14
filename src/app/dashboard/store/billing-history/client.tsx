
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileClock, Download } from 'lucide-react';
import Link from 'next/link';
import type { Order, Customer, Store } from '@/lib/types/domain';
import { PrintableInvoice } from '../components/printable-invoice';
import { PrintableThermalReceipt } from '../components/printable-thermal-receipt';
import { PrintablePackingSlip } from '../components/printable-packing-slip';
import { PrintableDeliveryChallan } from '../components/printable-delivery-challan';

interface BillingHistoryClientProps {
    initialOrders: Order[];
    customers: Customer[];
    store: Store | null;
}

export function BillingHistoryClient({ initialOrders, customers, store }: BillingHistoryClientProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);

    const customerMap = useMemo(() => {
        const map = new Map<string, Customer>();
        customers.forEach(c => map.set(c.id, c));
        return map;
    }, [customers]);

    const printComponentRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = useReactToPrint({
        content: () => printComponentRef.current,
        onAfterPrint: () => setSelectedOrderForPrint(null),
    });

    const triggerPrint = (order: Order) => {
        setSelectedOrderForPrint(order);
    };

    useEffect(() => {
        if (selectedOrderForPrint) {
            handlePrint();
        }
    }, [selectedOrderForPrint, handlePrint]);
    
    const getCustomerForOrder = (order: Order): Partial<Customer> | null => {
        if (order.customerDetails) {
            return {
                id: 'walk-in-manual',
                name: order.customerDetails.name,
                address: order.customerDetails.address
            } as Customer
        }
        return customerMap.get(order.customerId || order.customer_id || '') || null;
    }
    
    const renderPrintableComponent = () => {
        if (!selectedOrderForPrint || !store) return null;

        const customerForOrder = getCustomerForOrder(selectedOrderForPrint);
        
        switch (store.invoiceTemplate) {
            case 'thermal':
                return (
                    <PrintableThermalReceipt 
                        ref={printComponentRef} 
                        order={selectedOrderForPrint} 
                        customer={customerForOrder as Customer}
                        store={store}
                    />
                );
            case 'Packing Slip':
                 return (
                    <PrintablePackingSlip 
                        ref={printComponentRef} 
                        order={selectedOrderForPrint} 
                        customer={customerForOrder as Customer}
                        store={store}
                    />
                );
            case 'Delivery Challan':
                return (
                    <PrintableDeliveryChallan
                        ref={printComponentRef}
                        order={selectedOrderForPrint}
                        customer={customerForOrder as Customer}
                        store={store}
                    />
                );
            case 'A4':
            default:
                return (
                    <PrintableInvoice 
                        ref={printComponentRef} 
                        order={selectedOrderForPrint} 
                        customer={customerForOrder as Customer}
                        store={store}
                    />
                );
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <FileClock /> Billing History
                </h1>
                <p className="text-muted-foreground">
                    A log of all bills generated from this POS terminal.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Completed Bills</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order Number</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length > 0 ? orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.orderNumber || order.order_number}</TableCell>
                                    <TableCell>{getCustomerForOrder(order)?.name || 'Walk-in'}</TableCell>
                                    <TableCell>{new Date(order.orderDate || order.order_date || '').toLocaleString()}</TableCell>
                                    <TableCell>₹{(order.totalAmount || order.total_amount || 0).toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/sales/orders/${order.id}`}>
                                                View Order
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => triggerPrint(order)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Print
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No bills have been created from this store yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <div style={{ display: 'none' }}>
                {renderPrintableComponent()}
            </div>
        </div>
    );
}


