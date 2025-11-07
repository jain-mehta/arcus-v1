
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { FileText, MessageSquare, Star, ArrowLeft, DollarSign, Package, TrendingUp } from 'lucide-react';
import { ClientWrapper } from './client-wrapper';
import { Button } from '@/components/ui/button';
import { getStoreDetails, getStoreManagers } from './actions';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { RecentSalesClient } from './recent-sales-client';


function StoreNotFound() {
  return (
    <div className="text-center py-16">
      <h2 className="text-2xl font-bold mb-2">Store Not Found</h2>
      <p className="text-muted-foreground mb-6">The store you are looking for does not exist.</p>
      <Button asChild>
        <Link href="/dashboard/store/manage">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Store List
        </Link>
      </Button>
    </div>
  )
}

export default async function StoreProfilePage({ params }: any) {
  const { store, inventory, kpis, topProducts, recentSales, manager } = await getStoreDetails(params.id);
  
  if (!store) {
    return <StoreNotFound />;
  }

  const storeManagers = await getStoreManagers();

  const kpiData = [
    { title: 'Total Sales (All Time)', value: `>₹${kpis.totalSales.toLocaleString('en-IN')}`, icon: DollarSign },
    { title: 'Total Stock Units', value: kpis.totalStockUnits.toLocaleString(), icon: Package },
    { title: 'Total Stock Value', value: `>₹${kpis.totalStockValue.toLocaleString('en-IN')}`, icon: DollarSign },
  ];
  
  const generalInfo = {
    'Address': `${store.address}, ${store.city}, ${store.state} - ${store.pincode}`,
    'Region': store.region,
    'Manager': manager?.name || 'Unassigned',
    'Cash Alert Threshold': `>₹${store.cashAlertThreshold.toLocaleString('en-IN')}`,
    'Current Cash-in-Hand': `>₹${store.cashInHand.toLocaleString('en-IN')}`,
  };

  return (
    <div className="space-y-8">
      <ClientWrapper storeData={store} storeManagers={storeManagers} />
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Selling Product</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold">{kpis.topSellingProduct}</div>
            </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
            <InfoCard title="Store Details" data={generalInfo} />
            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Units</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {topProducts.length > 0 ? topProducts.map(item => (
                            <TableRow key={item.name}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{item.unitsSold}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">No sales data found.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <Card>
            <CardHeader>
                <CardTitle>Current Inventory</CardTitle>
                <CardDescription>Live stock levels for this location.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.length > 0 ? inventory.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">No inventory found for this store.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>

            <RecentSalesClient recentSales={recentSales} store={store} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, string | undefined>;
}) {
  const filteredData = Object.entries(data).filter(([_, value]) => value !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="space-y-4">
          {filteredData.map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm font-medium text-muted-foreground">
                {key}
              </dt>
              <dd className="text-sm text-foreground">{value || 'N/A'}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function DocumentRepository({
  documents,
}: {
  documents: VendorDocument[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Repository</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length > 0 ? (
            documents.map((doc) => (
            <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50"
            >
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium truncate">{doc.name}</span>
            </a>
            ))
        ) : (
            <p className="text-sm text-muted-foreground text-center p-4">No documents uploaded.</p>
        )}
      </CardContent>
    </Card>
  );
}

function CommunicationLog({
  log,
}: {
  log: CommunicationLog[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {log.length > 0 ? (
            log.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                <p className="text-sm font-medium">{item.type} - {item.user}</p>
                <p className="text-xs text-muted-foreground pb-1">
                    {new Date(item.date).toLocaleString()}
                </p>
                <p className='text-sm'>{item.summary}</p>
                </div>
            </div>
            ))
        ) : (
             <p className="text-sm text-muted-foreground text-center p-4">No communication logged.</p>
        )}
      </CardContent>
    </Card>
  );
}
\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n
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
