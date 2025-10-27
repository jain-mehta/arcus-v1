
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
import { History } from 'lucide-react';
import { getAuditLogs } from '@/lib/mock-data/firestore';
import { Badge } from '@/components/ui/badge';

export default async function AuditLogPage() {
  const auditLogs = await getAuditLogs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <History /> Audit Log
        </h1>
        <p className="text-muted-foreground">
          A chronological record of all significant actions taken within the
          system.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System & User Actions</CardTitle>
          <CardDescription>
            Review all create, update, and delete operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.userName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.details
                        ? Object.entries(log.details)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No audit logs found.
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


