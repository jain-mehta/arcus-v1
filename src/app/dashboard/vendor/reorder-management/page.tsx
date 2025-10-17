

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { getItemsToReorder, getVendor } from '@/lib/firebase/firestore';
import type { MaterialMapping } from '@/lib/firebase/types';
import Link from 'next/link';

interface ReorderItem extends MaterialMapping {
    vendorName?: string;
}

export default async function ReorderManagementPage() {
    const itemsToReorder = await getItemsToReorder();
    const enrichedItems: ReorderItem[] = await Promise.all(itemsToReorder.map(async item => {
        const vendor = await getVendor(item.vendorId);
        return { ...item, vendorName: vendor?.name || 'Unknown' };
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
                                enrichedItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.material}</TableCell>
                                        <TableCell>{item.sku}</TableCell>
                                        <TableCell>{item.vendorName}</TableCell>
                                        <TableCell className="text-center">{item.reorderLevel}</TableCell>
                                        <TableCell className="text-center">{item.safetyStock}</TableCell>
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
