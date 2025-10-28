
import { Button } from '@/components/ui/button';
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
import type { PurchaseOrder } from '@/lib/mock-data/types';

interface PendingVendorPaymentsProps {
  payments: PurchaseOrder[];
}

export function PendingVendorPayments({ payments }: PendingVendorPaymentsProps) {
  const totalOutstanding = payments.reduce((acc, p) => acc + (p.totalAmount - p.amountGiven), 0);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pending Vendor Payments</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex justify-between items-center">
            <span>Total Outstanding Amount</span>
            <span className="text-2xl font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount Due (?)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.poNumber}</TableCell>
                  <TableCell>{payment.vendorName}</TableCell>
                  <TableCell>{new Date(payment.deliveryDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{(payment.totalAmount - payment.amountGiven).toLocaleString('en-IN')}</TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No pending payments.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="pt-6 justify-end gap-2">
            <Button>View Payment Reports</Button>
            <Button variant="secondary">Manage Vendors</Button>
        </CardFooter>
      </Card>
    </div>
  );
}


