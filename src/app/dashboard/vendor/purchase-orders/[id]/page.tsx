

import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { getPurchaseOrder, getVendor } from '@/lib/mock-data/firestore';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Printer, Download, MessageCircle, Check, X } from 'lucide-react';
import { ApprovalActions } from './approval-actions';

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

export default async function PurchaseOrderDetailsPage({ params }: any) {
  const po = await getPurchaseOrder(params.id);

  if (!po) {
    notFound();
  }

  const vendor = await getVendor(po.vendorId);
  const subtotal = po.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.18; // Assuming 18% GST

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Purchase Order</h1>
                <p className="text-muted-foreground">PO Number: {po.poNumber}</p>
                <div className="mt-2">
                    <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
                </div>
            </div>
            <div className="flex gap-2">
                {po.status === 'Pending Approval' && <ApprovalActions poId={po.id} />}
                <Button variant="outline"><MessageCircle className="mr-2 h-4 w-4" /> Comment</Button>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download</Button>
                <Button><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>PO Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold">Vendor</h3>
                    {vendor ? (
                         <div className="text-sm text-muted-foreground">
                            <p className="font-bold text-foreground">{vendor.name}</p>
                            <p>{vendor.address}</p>
                            <p>GSTIN: {vendor.tax.gstin}</p>
                            <Link href={`/dashboard/vendor/profile/${vendor.id}`} className="text-primary hover:underline">
                                View Profile
                            </Link>
                         </div>
                    ) : (
                        <p className="text-sm text-destructive">Vendor not found (ID: {po.vendorId})</p>
                    )}
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold">Shipping Address</h3>
                    <div className="text-sm text-muted-foreground">
                        <p className="font-bold text-foreground">Bobs Bath Fittings Pvt Ltd</p>
                        <p>123 Industrial Area</p>
                        <p>New Delhi, 110020</p>
                    </div>
                </div>
                <div className="space-y-4">
                     <h3 className="font-semibold">Dates</h3>
                     <dl className="grid grid-cols-2 gap-1 text-sm">
                        <dt className="text-muted-foreground">Order Date:</dt>
                        <dd>{new Date(po.orderDate).toLocaleDateString()}</dd>
                        <dt className="text-muted-foreground">Delivery Date:</dt>
                        <dd>{new Date(po.deliveryDate).toLocaleDateString()}</dd>
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
                            <TableHead>Material</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price (>₹)</TableHead>
                            <TableHead className="text-right">Total (>₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {po.lineItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.material}</TableCell>
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
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span>₹{tax.toLocaleString('en-IN')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>₹{po.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {po.notes || 'No additional notes provided for this purchase order.'}
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
