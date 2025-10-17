

import { notFound } from 'next/navigation';
import { getPerformanceCycle, getEmployeeReviewsForCycle } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
