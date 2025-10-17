
import {
    Card,
    CardContent,
    CardDescription,
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
import { Button } from '@/components/ui/button';
import { getOrders, getSalesCustomers } from '@/app/dashboard/sales/actions';
import { getCurrentUser, MOCK_STORES } from '@/lib/firebase/firestore';
import { FileClock, Download } from 'lucide-react';
import Link from 'next/link';
import { BillingHistoryClient } from './client';
  
  
export default async function BillingHistoryPage() {
    const user = await getCurrentUser();
    if (!user) {
        return (
             <div className="flex justify-center items-start pt-16 h-full">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                            <FileClock className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Billing History</CardTitle>
                        <CardDescription>User Not Found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Could not load user data. Please try again later.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { orders } = await getOrders();
    const { customers } = await getSalesCustomers();
    const store = MOCK_STORES.find(s => s.id === user?.storeId) || MOCK_STORES[0];

    // Filter orders to only show those created from the current user's store
    const storeOrders = orders.filter(o => o.storeId === user?.storeId);

    return (
        <BillingHistoryClient initialOrders={storeOrders} customers={customers} store={store} />
    );
}
