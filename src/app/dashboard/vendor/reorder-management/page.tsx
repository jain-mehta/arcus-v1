

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getItemsToReorder() {
    return [] as any[];
}

async function getVendor(vendorId: string) {
    return null;
}

export default async function ReorderManagementPage() {
    const itemsToReorder = await getItemsToReorder();
    const enrichedItems: any[] = await Promise.all((itemsToReorder || []).map(async (item: any) => {
        const vendor = await getVendor((item as any).vendorId);
        return { ...item, vendorName: (vendor as any)?.name || 'Unknown' };
    }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reorder Management</h1>
                <p className="text-muted-foreground">Review materials that have fallen below their reorder level.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <AlertTriangle className="text-destructive h-5 w-5" />
                        Items Requiring Reorder
                    </CardTitle>
                    <CardDescription>
                        The following materials are below their specified reorder levels. Take action to prevent stockouts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead className="text-center">Reorder Level</TableHead>
                                <TableHead className="text-center">Safety Stock</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {enrichedItems.length > 0 ? (
                                enrichedItems.map((item: any) => (
                                    <TableRow key={(item as any).id}>
                                        <TableCell className="font-medium">{(item as any).material}</TableCell>
                                        <TableCell>{(item as any).sku}</TableCell>
                                        <TableCell>{(item as any).vendorName}</TableCell>
                                        <TableCell className="text-center">{(item as any).reorderLevel}</TableCell>
                                        <TableCell className="text-center">{(item as any).safetyStock}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild>
                                                <Link href="/dashboard/vendor/purchase-orders/create">
                                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                                    Create PO
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        All material stock levels are healthy. No reorders needed at this time.
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
