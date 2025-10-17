
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from '@/components/ui/button';
import { Download, Printer, View } from 'lucide-react';
import Link from 'next/link';
import type { Order, Customer, Store } from '@/lib/firebase/types';
import { PrintableInvoice } from '../../components/printable-invoice';
import { PrintableThermalReceipt } from '../../components/printable-thermal-receipt';
import { PrintablePackingSlip } from '../../components/printable-packing-slip';
import { PrintableDeliveryChallan } from '../../components/printable-delivery-challan';

interface RecentSalesClientProps {
  recentSales: Order[];
  store: Store | null;
}

export function RecentSalesClient({ recentSales, store }: RecentSalesClientProps) {
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    onAfterPrint: () => setSelectedOrderForPrint(null),
  });

  const triggerPrint = (order: Order) => {
    setSelectedOrderForPrint(order);
    setTimeout(handlePrint, 100);
  };
  
  const getCustomerForOrder = (order: Order) => {
    if (order.customerDetails) {
        return {
            id: 'walk-in-manual',
            name: order.customerDetails.name,
            address: order.customerDetails.address
        } as Customer
    }
    // In a real app, you might want to fetch the customer if not inlined.
    return { name: "N/A" } as Partial<Customer>;
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
                    customer={customerForOrder}
                    store={store}
                />
            );
        case 'Packing Slip':
             return (
                <PrintablePackingSlip 
                    ref={printComponentRef} 
                    order={selectedOrderForPrint} 
                    customer={customerForOrder}
                    store={store}
                />
            );
        case 'Delivery Challan':
            return (
                <PrintableDeliveryChallan
                    ref={printComponentRef}
                    order={selectedOrderForPrint}
                    customer={customerForOrder}
                    store={store}
                />
            );
        case 'A4':
        default:
            return (
                <PrintableInvoice 
                    ref={printComponentRef} 
                    order={selectedOrderForPrint} 
                    customer={customerForOrder}
                    store={store}
                />
            );
    }
  }

  return (
    <TooltipProvider>
        <Card>
            <CardHeader>
                <CardTitle>Recent Sales History</CardTitle>
                <CardDescription>The last 5 sales from this store.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-left">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {recentSales.length > 0 ? recentSales.map(order => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerDetails?.name || 'Walk-in'}</TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">₹{order.totalAmount.toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                                <div className="flex justify-center gap-2">
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <Link href={`/dashboard/sales/orders/${order.id}`}><View /></Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View Order Details</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => triggerPrint(order)}>
                                                <Download />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Download PDF</TooltipContent>
                                    </Tooltip>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => triggerPrint(order)}>
                                                <Printer />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Print Invoice</TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">No sales recorded for this store yet.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <div style={{ display: 'none' }}>
            {renderPrintableComponent()}
        </div>
    </TooltipProvider>
  );
}
