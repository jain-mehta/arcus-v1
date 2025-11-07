

'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Briefcase, PlusCircle, Calendar as CalendarIcon, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addLeaveRequest, updateLeaveRequestStatus } from '../actions';
import type { DateRange } from 'react-day-picker';

const leaveRequestSchema = z.object({
  staffId: z.string().min(1, 'Please select a staff member.'),
  type: z.string().min(1, 'Please select a leave type.'),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
  reason: z.string().min(10, 'Please provide a reason for your leave.'),
});
type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;


const managerActionSchema = z.object({
    managerComments: z.string().optional(),
});
type ManagerActionFormValues = z.infer<typeof managerActionSchema>;

type LeaveRequestWithDuration = LeaveRequest & { duration: number };

interface LeavesClientProps {
    initialRequests: LeaveRequestWithDuration[];
    leavePolicies: LeavePolicy[];
    staffList: User[];
    currentUser: User;
    isAdmin: boolean;
}

export function LeavesClient({ initialRequests, leavePolicies, staffList, currentUser, isAdmin }: LeavesClientProps) {
    const [requests, setRequests] = useState(initialRequests);
    
    const onLeaveAdded = (newRequest: LeaveRequestWithDuration) => {
        setRequests(prev => [newRequest, ...prev]);
    };

    const onStatusUpdated = (updatedRequest: LeaveRequest) => {
        setRequests(prev => prev.map(r => r.id === updatedRequest.id ? {...r, ...updatedRequest} : r));
    }

    const leaveBalance = useMemo(() => {
        const balance: Record<string, number> = {};
        if (!leavePolicies || !currentUser) return balance;

        leavePolicies.forEach(p => {
            const taken = requests
                .filter(r => r.staffId === currentUser.id && r.type === p.leaveType && r.status === 'Approved')
                .reduce((total, req) => total + req.duration, 0);
            balance[p.leaveType] = p.daysAllowed - taken;
        });
        return balance;
    }, [requests, currentUser.id, leavePolicies]);


    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const myRequests = requests.filter(r => r.staffId === currentUser.id);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Briefcase /> Leave Management</h1>
                    <p className="text-muted-foreground">Apply for leaves and manage leave requests.</p>
                </div>
                <ApplyLeaveDialog 
                    leavePolicies={leavePolicies} 
                    staffList={staffList}
                    currentUser={currentUser}
                    onLeaveAdded={onLeaveAdded}
                    isAdmin={isAdmin}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {leavePolicies.map(policy => (
                     <Card key={policy.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{policy.leaveType}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{leaveBalance[policy.leaveType] ?? policy.daysAllowed} / {policy.daysAllowed}</div>
                            <p className="text-xs text-muted-foreground">days remaining</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {isAdmin && pendingRequests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Approvals</CardTitle>
                        <CardDescription>Review and action pending leave requests from your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LeaveTable requests={pendingRequests} onStatusUpdated={onStatusUpdated} />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>My Leave History</CardTitle>
                    <CardDescription>A log of all your past and present leave requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LeaveTable requests={myRequests} onStatusUpdated={onStatusUpdated} showActions={false} />
                </CardContent>
            </Card>

        </div>
    );
}


function LeaveTable({ requests, onStatusUpdated, showActions = true }: { requests: LeaveRequestWithDuration[], onStatusUpdated: (req: LeaveRequest) => void, showActions?: boolean }) {
    
    const getStatusBadgeVariant = (status: LeaveStatus) => {
        if (status === 'Approved') return 'default';
        if (status === 'Rejected') return 'destructive';
        return 'secondary';
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {showActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.length > 0 ? requests.map(req => (
                    <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.staffName}</TableCell>
                        <TableCell>{req.type}</TableCell>
                        <TableCell>{format(new Date(req.startDate), 'PPP')} - {format(new Date(req.endDate), 'PPP')}</TableCell>
                        <TableCell>{req.duration} day(s)</TableCell>
                        <TableCell className="max-w-xs text-muted-foreground">{req.reason}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(req.status)}>{req.status}</Badge></TableCell>
                        {showActions && (
                            <TableCell className="text-right">
                                {req.status === 'Pending' && <ManagerActionDialog request={req} onStatusUpdated={onStatusUpdated} />}
                            </TableCell>
                        )}
                    </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={showActions ? 7 : 6} className="h-24 text-center">
                            No leave requests found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

function ApplyLeaveDialog({ leavePolicies, staffList, currentUser, onLeaveAdded, isAdmin }: { leavePolicies: LeavePolicy[], staffList: User[], currentUser: User, onLeaveAdded: (req: LeaveRequestWithDuration) => void, isAdmin: boolean }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const form = useForm<LeaveRequestFormValues>({
        resolver: zodResolver(leaveRequestSchema),
        defaultValues: {
            staffId: currentUser.id,
            dateRange: { from: new Date(), to: addDays(new Date(), 1) }
        }
    });

    const handleSubmit = async (values: LeaveRequestFormValues) => {
        startSubmitting(async () => {
            const dataToSubmit = {
                staffId: values.staffId,
                type: values.type,
                startDate: values.dateRange.from.toISOString(),
                endDate: values.dateRange.to.toISOString(),
                reason: values.reason,
            }
            const result = await addLeaveRequest(dataToSubmit as any, currentUser);
            if (result.success && result.newRequest) {
                onLeaveAdded(result.newRequest);
                toast({ title: "Leave Request Submitted" });
                setOpen(false);
                form.reset();
            } else {
                toast({ variant: 'destructive', title: "Error", description: 'Failed to submit leave request.' });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" /> Apply for Leave
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Apply for Leave</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {isAdmin && (
                             <FormField
                                control={form.control}
                                name="staffId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Leave Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a leave type..."/></SelectTrigger></FormControl>
                                        <SelectContent>{leavePolicies.map(p => <SelectItem key={p.id} value={p.leaveType}>{p.leaveType}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dateRange"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date Range</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value.from && "text-muted-foreground")}>
                                                {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "PPP")} - {format(field.value.to, "PPP")}</>) : (format(field.value.from, "PPP"))) : (<span>Pick a date range</span>)}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar initialFocus mode="range" numberOfMonths={2} defaultMonth={field.value.from} selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl><Textarea placeholder="Please provide a brief reason for your leave..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ManagerActionDialog({ request, onStatusUpdated }: { request: LeaveRequest; onStatusUpdated: (req: LeaveRequest) => void; }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const form = useForm<ManagerActionFormValues>({
        resolver: zodResolver(managerActionSchema),
        defaultValues: { managerComments: '' }
    });

    const handleAction = async (status: 'Approved' | 'Rejected') => {
        startSubmitting(async () => {
            const values = form.getValues();
            const result = await updateLeaveRequestStatus(request.id, status, values.managerComments || '');
            if (result.success) {
                onStatusUpdated({ ...request, status, managerComments: values.managerComments });
                toast({ title: `Request ${status}`});
                setOpen(false);
            } else {
                 toast({ variant: 'destructive', title: "Error"});
            }
        });
    }

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Review</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Review Leave Request</DialogTitle>
                    <DialogDescription>For {request.staffName} from {format(new Date(request.startDate), 'PPP')} to {format(new Date(request.endDate), 'PPP')}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <p className="text-sm"><strong className="text-muted-foreground">Reason:</strong> {request.reason}</p>
                </div>
                 <Form {...form}>
                    <form className="space-y-4">
                         <FormField
                            control={form.control}
                            name="managerComments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manager Comments (Optional)</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="destructive" onClick={() => handleAction('Rejected')} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <X className="mr-2 h-4 w-4" />Reject
                            </Button>
                            <Button type="button" variant="default" onClick={() => handleAction('Approved')} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Check className="mr-2 h-4 w-4" />Approve
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


\n\n
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
