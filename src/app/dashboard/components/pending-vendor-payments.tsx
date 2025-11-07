
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


\n\n
// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
