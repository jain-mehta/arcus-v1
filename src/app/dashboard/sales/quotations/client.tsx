
'use client';

import React, { useState, useTransition, useEffect } from 'react';
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
import { FileText, PlusCircle, Check, X, Loader2, ShoppingCart, ArrowRight } from "lucide-react";
import type { Quotation, Customer } from '@/lib/firebase/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createOrderFromQuote, updateQuotationStatus } from '../actions';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';


const getStatusVariant = (status: Quotation['status']) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Awaiting Approval': return 'secondary';
        case 'Rejected':
        case 'Expired': 
            return 'destructive';
        default: return 'outline';
    }
};

interface QuotationsClientProps {
    initialQuotations: Quotation[];
    allCustomers: Customer[];
}

export function QuotationsClient({ initialQuotations, allCustomers }: QuotationsClientProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
    const [customers, setCustomers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [loadingStates, setLoadingStates] = useState<Record<string, { [key: string]: boolean }>>({});
    
    useEffect(() => {
        const customerMap = allCustomers.reduce((acc, c) => {
            acc[c.id] = c.name;
            return acc;
        }, {} as Record<string, string>);
        setCustomers(customerMap);
        setQuotations(initialQuotations);
    }, [initialQuotations, allCustomers]);


    const handleUpdateStatus = (id: string, status: Quotation['status']) => {
        setLoadingStates(prev => ({...prev, [id]: { ...prev[id], [status]: true }}));
        startTransition(async () => {
            const result = await updateQuotationStatus(id, status);
            if(result.success) {
                setQuotations(prev => prev.map(q => q.id === id ? {...q, status} : q));
                toast({ title: `Quotation ${status}`, description: `The quotation has been marked as ${status.toLowerCase()}.`});
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
            setLoadingStates(prev => ({...prev, [id]: { ...prev[id], [status]: false }}));
        });
    }
    
    const [isConverting, startTransition] = useTransition();
    const handleConvertToOrder = (quote: Quotation) => {
        if (!quote.id) return;
        setLoadingStates(prev => ({ ...prev, [quote.id!]: { ...prev[quote.id!], convert: true }}));
        startTransition(async () => {
            const result = await createOrderFromQuote(quote);
            if (result.success && result.orderId) {
                toast({
                    title: "Order Created!",
                    description: `Order has been created from quotation ${quote.quoteNumber}.`,
                    action: <Button asChild size="sm"><Link href={`/dashboard/sales/orders/${result.orderId}`}>View Order</Link></Button>
                });
                router.push('/dashboard/sales/orders');
            } else {
                toast({
                    variant: 'destructive',
                    title: "Conversion Failed",
                    description: result.message || "Could not create an order from this quotation."
                });
            }
             setLoadingStates(prev => ({ ...prev, [quote.id!]: { ...prev[quote.id!], convert: false }}));
        });
    }

    return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2">
                    <FileText className="h-7 w-7 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
                </div>
                <p className="text-muted-foreground">Review, approve, and manage all customer quotations.</p>
            </div>
            <Button asChild>
                <Link href="/dashboard/sales/quotations/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Quotation
                </Link>
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>All Quotations</CardTitle>
                <CardDescription>A list of all quotations awaiting action or archived.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Quote Number</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({length: 4}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6" /></TableCell>
                                    <TableCell><Skeleton className="h-6" /></TableCell>
                                    <TableCell><Skeleton className="h-6" /></TableCell>
                                    <TableCell><Skeleton className="h-6" /></TableCell>
                                    <TableCell><Skeleton className="h-6" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : quotations.length > 0 ? (
                            quotations.map(quote => {
                                const isLoading = loadingStates[quote.id!] || {};
                                return (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/sales/quotations/${quote.id}`} className="hover:underline">
                                            {quote.quoteNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{customers[quote.customerId] || 'Unknown Customer'}</TableCell>
                                    <TableCell>{new Date(quote.quoteDate).toLocaleDateString()}</TableCell>
                                    <TableCell>₹{quote.totalAmount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(quote.status)}>{quote.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {quote.status === 'Awaiting Approval' ? (
                                            <div className="flex gap-2 justify-end">
                                                <Button 
                                                    variant="destructive" size="icon"
                                                    onClick={() => handleUpdateStatus(quote.id!, 'Rejected')}
                                                    disabled={isLoading.Rejected || isLoading.Approved}
                                                >
                                                    {isLoading.Rejected ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                                                </Button>
                                                 <Button 
                                                    variant="default" size="icon"
                                                    onClick={() => handleUpdateStatus(quote.id!, 'Approved')}
                                                    disabled={isLoading.Rejected || isLoading.Approved}
                                                >
                                                    {isLoading.Approved ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        ) : quote.status === 'Approved' ? (
                                            <Button 
                                                variant="secondary" size="sm"
                                                onClick={() => handleConvertToOrder(quote)}
                                                disabled={isConverting || isLoading.convert}
                                            >
                                                {isLoading.convert ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShoppingCart className="mr-2 h-4 w-4" />}
                                                Convert to Order
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/sales/quotations/${quote.id}`}>View</Link>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No quotations found.
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
