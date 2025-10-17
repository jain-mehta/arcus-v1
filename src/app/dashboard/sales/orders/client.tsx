
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import type { Order, Customer } from '@/lib/firebase/types';
import Link from 'next/link';

interface OrdersClientProps {
    initialOrders: Order[];
    customerList: Customer[];
}

export function OrdersClient({ initialOrders, customerList }: OrdersClientProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [customers, setCustomers] = useState<Record<string, string>>({});

    useMemo(() => {
        const customerMap = customerList.reduce((acc, customer) => {
            acc[customer.id] = customer.name;
            return acc;
        }, {} as Record<string, string>);
        setCustomers(customerMap);
    }, [customerList]);

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Delivered':
            case 'Confirmed':
                return 'default';
            case 'Shipped':
            case 'Picked':
                return 'secondary';
            case 'Draft':
                return 'outline';
            default:
                return 'destructive';
        }
    };

    return (
    <div className="space-y-8">
        <div>
            <div className="flex items-center gap-2">
                <ShoppingBag className="h-7 w-7 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
            </div>
            <p className="text-muted-foreground">Track all customer sales orders from confirmation to fulfillment.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Sales Orders</CardTitle>
                <CardDescription>A list of all confirmed sales orders in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/sales/orders/${order.id}`} className="hover:underline">
                                            {order.orderNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{customers[order.customerId] || 'Unknown Customer'}</TableCell>
                                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                    <TableCell>₹{order.totalAmount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/sales/orders/${order.id}`}>View Order</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No sales orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
