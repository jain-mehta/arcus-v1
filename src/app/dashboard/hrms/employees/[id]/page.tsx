

import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getStaffMember, getShiftLogsForStaff, MOCK_STORES } from '@/lib/mock-data/firestore';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function StaffDetailPage({ params }: any) {
    const [staff, shiftLogs] = await Promise.all([
        getStaffMember(params.id),
        getShiftLogsForStaff(params.id),
    ]);
    
    if (!staff) {
        notFound();
    }

    const store = MOCK_STORES.find(s => s.id === staff.storeId);

    return (
        <div className="space-y-8">
            <div className='flex items-center justify-between'>
                <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" asChild className="mr-2">
                        <Link href="/dashboard/hrms/employees">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={`https://picsum.photos/seed/${staff.id}/64/64`} data-ai-hint="person" />
                        <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{staff.name}</h1>
                        <p className="text-muted-foreground">{staff.designation || 'Employee'} at {store?.name || 'N/A'}</p>
                    </div>
                </div>
                 <Button variant="outline" asChild>
                    <Link href={`/dashboard/hrms/employees/${staff.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Shift History</CardTitle>
                    <CardDescription>A log of all clock-in/out and break activities for this staff member.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date &amp; Time</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shiftLogs.length > 0 ? (
                                shiftLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={log.type === 'Clock In' ? 'default' : log.type === 'Clock Out' ? 'destructive' : 'secondary'}>
                                                {log.type}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        No shift history found for this staff member.
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
