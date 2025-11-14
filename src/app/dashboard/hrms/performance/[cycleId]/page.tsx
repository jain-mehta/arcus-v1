

import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Type definitions
interface PerformanceCycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
}

interface EmployeeReview {
    id: string;
    employeeId: string;
    employeeName: string;
    status: string;
    [key: string]: any;
}

// Stub implementations for missing functions
async function getPerformanceCycle(cycleId: string): Promise<PerformanceCycle | null> {
    // TODO: Fetch actual performance cycle from database
    return null;
}

async function getEmployeeReviewsForCycle(cycleId: string): Promise<EmployeeReview[]> {
    // TODO: Fetch actual employee reviews from database
    return [];
}

export default async function PerformanceCycleDetailPage({ params }: any) {
    const cycleId = params.cycleId;
    const [cycle, employeeReviews] = await Promise.all([
        getPerformanceCycle(cycleId),
        getEmployeeReviewsForCycle(cycleId),
    ]);
    
    if (!cycle) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div>
                 <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/dashboard/hrms/performance">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Cycles
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{cycle.name}</h1>
                <p className="text-muted-foreground">
                    Period: {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Employee Progress</CardTitle>
                    <CardDescription>Tracking the status of each employee in this review cycle.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employeeReviews.map(review => (
                                <TableRow key={review.id}>
                                    <TableCell className="font-medium">{review.employeeName}</TableCell>
                                    <TableCell>
                                        <Badge variant={review.status === 'Completed' ? 'default' : 'secondary'}>
                                            {review.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/dashboard/hrms/performance/appraisal/${review.id}`}>View Appraisal</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
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
