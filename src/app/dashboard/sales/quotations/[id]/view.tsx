
'use client';

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Customer, Quotation } from '@/lib/mock-data/types';
  
export function QuotationDetailView({ 
    quotation, 
    customer,
    subtotal,
    tax,
}: { 
    quotation: Quotation, 
    customer: Customer | null,
    subtotal: number,
    tax: number,
}) {

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'default';
            case 'Awaiting Approval':
                return 'secondary';
            case 'Rejected':
            case 'Expired':
                return 'destructive';
            default:
                return 'outline';
        }
    };
    
    return (
        <>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Quotation</h1>
                <p className="text-muted-foreground">Quote Number: {quotation.quoteNumber}</p>
                <div className="mt-2">
                    <Badge variant={getStatusBadgeVariant(quotation.status)}>{quotation.status}</Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quotation Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold">Customer</h3>
                        {customer ? (
                            <div className="text-sm text-muted-foreground">
                                <p className="font-bold text-foreground">{customer.name}</p>
                                <p>{customer.email}</p>
                                <p>{customer.phone}</p>
                                {customer.id && (
                                 <Link href={`/dashboard/sales/customers/${customer.id}`} className="text-primary hover:underline">
                                    View Profile
                                </Link>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-destructive">Customer not found (ID: {quotation.customerId})</p>
                        )}
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">Dates</h3>
                        <dl className="grid grid-cols-2 gap-1 text-sm">
                            <dt className="text-muted-foreground">Quote Date:</dt>
                            <dd>{new Date(quotation.quoteDate).toLocaleDateString()}</dd>
                            <dt className="text-muted-foreground">Expiry Date:</dt>
                            <dd>{new Date(quotation.expiryDate).toLocaleDateString()}</dd>
                        </dl>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price (>₹)</TableHead>
                                <TableHead className="text-right">Total (>₹)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotation.lineItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right">{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex flex-col items-end gap-2 bg-muted/50 p-6">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">GST (18%)</span>
                            <span>>₹{tax.toLocaleString('en-IN')}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>>₹{quotation.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </>
    )
}
