

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Handshake, FileText, ShoppingCart, MessageSquare, ArrowLeft } from 'lucide-react';
import type { Customer, Opportunity, Quotation, Order, CommunicationLog } from "@/lib/mock-data/types";
import { useRouter } from "next/navigation";

interface CustomerDetailViewProps {
  customer: Customer;
  opportunities: Opportunity[];
  quotations: Quotation[];
  orders: Order[];
  communicationLogs: CommunicationLog[];
}

export function CustomerDetailView({
  customer,
  opportunities,
  quotations,
  orders,
  communicationLogs,
}: CustomerDetailViewProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
        <p className="text-muted-foreground">{customer.email} | {customer.phone}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{customer.totalSpend.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Opportunities</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{customer.source || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>The last 5 orders from this customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.slice(0,5).map(order => (
                        <TableRow key={order.id}>
                            <TableCell>{order.orderNumber}</TableCell>
                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                            <TableCell>₹{order.totalAmount.toLocaleString('en-IN')}</TableCell>
                            <TableCell><Badge>{order.status}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Communication Log</CardTitle>
            <CardDescription>A log of recent interactions with this customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {communicationLogs.slice(0,5).map(log => (
                <div key={log.id} className="flex items-start gap-3">
                    <div className="pt-1"><MessageSquare className="h-4 w-4 text-muted-foreground" /></div>
                    <div>
                        <p className="text-sm font-medium">{log.type} with {log.user}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleString()}</p>
                        <p className="text-sm mt-1">{log.summary}</p>
                    </div>
                </div>
             ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
