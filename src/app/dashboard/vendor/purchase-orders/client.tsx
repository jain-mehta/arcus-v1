
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PurchaseOrder, Vendor } from '@/lib/types/domain';

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'Approved':
        case 'Delivered':
        case 'Billed':
        case 'Closed':
            return 'default';
        case 'Pending Approval': 
        case 'In Transit':
            return 'secondary';
        case 'Canceled': return 'destructive';
        case 'Draft': return 'outline';
        default: return 'outline';
    }
};

interface PurchaseOrderClientProps {
    initialPurchaseOrders: PurchaseOrder[];
    vendors: Vendor[];
}

export function PurchaseOrderClient({ initialPurchaseOrders, vendors }: PurchaseOrderClientProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || 'Unknown';
  };

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(
      (po) =>
        ((po.poNumber || po.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          getVendorName(po.vendorId || po.vendor_id || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (vendorFilter === 'all' || (po.vendorId || po.vendor_id) === vendorFilter) &&
        (statusFilter === 'all' || po.status === statusFilter)
    );
  }, [purchaseOrders, searchTerm, vendorFilter, statusFilter]);

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Purchase Orders & Bills</h1>
                <p className="text-muted-foreground">Manage all purchase orders and vendor bills from a single location.</p>
            </div>
            <Link href="/dashboard/vendor/purchase-orders/create">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New PO
                </Button>
            </Link>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Purchase Order List</CardTitle>
                <CardDescription>A comprehensive list of all purchase orders in your system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="Search by PO number or vendor..."
                        className="pl-9 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={vendorFilter} onValueChange={setVendorFilter}>
                        <SelectTrigger className="w-full sm:w-auto">
                            <SelectValue placeholder="Filter by vendor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vendors</SelectItem>
                            {vendors.map(vendor => (
                                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-auto">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="In Transit">In Transit</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Billed">Billed</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                            <SelectItem value="Canceled">Canceled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Total Amount (?)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPurchaseOrders.length > 0 ? (
                            filteredPurchaseOrders.map((po) => (
                                <TableRow key={po.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/vendor/purchase-orders/${po.id}`} className="hover:underline">
                                        {po.poNumber || po.order_number}
                                    </Link>
                                </TableCell>
                                <TableCell>{getVendorName(po.vendorId || po.vendor_id || '')}</TableCell>
                                <TableCell>{new Date(po.orderDate || po.order_date || '').toLocaleDateString()}</TableCell>
                                <TableCell>{(po.totalAmount || po.total_amount || 0).toLocaleString('en-IN')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" asChild>
                                         <Link href={`/dashboard/vendor/purchase-orders/${po.id}`}>View Details</Link>
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}


