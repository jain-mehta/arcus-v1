
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vendor, CommunicationLog } from '@/lib/mock-data/types';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Phone, Mail, Users } from "lucide-react";
import { CommunicationLogDialog } from './communication-log-dialog';

interface LogWithVendorName extends CommunicationLog {
    vendorName: string;
}

interface CommunicationLogClientProps {
    initialLogs: LogWithVendorName[];
    vendors: Vendor[];
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'Call': return <Phone className="h-4 w-4 text-muted-foreground" />;
        case 'Email': return <Mail className="h-4 w-4 text-muted-foreground" />;
        case 'Meeting': return <Users className="h-4 w-4 text-muted-foreground" />;
        default: return <History className="h-4 w-4 text-muted-foreground" />;
    }
}

export function CommunicationLogClient({ initialLogs, vendors }: CommunicationLogClientProps) {
    const [filterVendor, setFilterVendor] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<LogWithVendorName[]>(initialLogs);

    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    const onLogAdded = (newLogData: any) => {
        // Find vendor name to enrich the log entry for immediate UI update
        const vendorName = vendors.find(v => v.id === newLogData.vendorId)?.name || 'N/A';
        const enrichedLog = { ...newLogData, vendorName };
        setLogs(prev => [enrichedLog, ...prev]);
    };

    const filteredLogs = useMemo(() => {
        if (filterVendor === 'all') return logs;
        return logs.filter(log => log.vendorId && log.vendorId === filterVendor);
    }, [logs, filterVendor]);

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Communication Log</h1>
                    <p className="text-muted-foreground">A central repository for all vendor communications.</p>
                </div>
                 <CommunicationLogDialog vendors={vendors} onLogAdded={onLogAdded} />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Filter Logs</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">Vendor</label>
                        <Select value={filterVendor} onValueChange={setFilterVendor}>
                            <SelectTrigger>
                                <SelectValue placeholder={vendors.length > 0 ? "All Vendors" : "No vendors available"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Vendors</SelectItem>
                                {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Log Entries</CardTitle>
                    <CardDescription>A chronological list of all communication logs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Summary</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>
                                ))
                            ) : filteredLogs.length > 0 ? filteredLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.vendorName}</TableCell>
                                    <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getActivityIcon(log.type)}
                                            <span>{log.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{log.user}</TableCell>
                                    <TableCell className="max-w-sm whitespace-pre-wrap">{log.summary}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No communication logs found for the selected filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


