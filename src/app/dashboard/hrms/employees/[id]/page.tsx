

import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

    // TODO: Implement store lookup
    const store = null;

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
                        <AvatarImage src={`https://picsum.photos/seed/${(staff as any).id}/64/64`} data-ai-hint="person" />
                        <AvatarFallback>{(staff as any).name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{(staff as any).name}</h1>
                        <p className="text-muted-foreground">{(staff as any).designation || 'Employee'} at {(store as any)?.name || 'N/A'}</p>
                    </div>
                </div>
                 <Button variant="outline" asChild>
                    <Link href={`/dashboard/hrms/employees/${(staff as any).id}/edit`}>
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
                                    <TableRow key={(log as any).id}>
                                        <TableCell>{new Date((log as any).timestamp).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={(log as any).type === 'Clock In' ? 'default' : (log as any).type === 'Clock Out' ? 'destructive' : 'secondary'}>
                                                {(log as any).type}
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

// TODO: Implement getStaffMember and getShiftLogsForStaff functions
async function getStaffMember(id: string): Promise<{id: string; name: string; designation?: string} | null> {
  return null;
}

async function getShiftLogsForStaff(id: string): Promise<any[]> {
  return [];
}