
'use client';

import { useState, useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { PlusCircle, Users2, Loader2 } from "lucide-react";
import { getStaff, addStaffMember, logShiftActivity } from "../../hrms/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Store, User } from '@/lib/types/domain';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StaffClientProps {
    isAdmin: boolean;
    allStores: Store[];
    userStoreId?: string;
    initialStaff: User[];
    initialStoreId?: string;
}

export function StaffClient({ isAdmin, allStores, userStoreId, initialStaff, initialStoreId }: StaffClientProps) {
    const { toast } = useToast();
    const [staff, setStaff] = useState(initialStaff);
    const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId || '');
    const [isLoading, startLoading] = useTransition();

    const handleStoreChange = useCallback((storeId: string) => {
        setSelectedStoreId(storeId);
        setStaff([]);
        startLoading(async () => {
            try {
                const response = await getStaff(storeId);
                const newStaff = response.success ? (response.data || []) : [];
                setStaff(newStaff);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: "Error",
                    description: "Failed to load staff for the selected store."
                });
            }
        });
    }, [toast]);
    
    const onStaffAdded = (newStaffMember: User) => {
        setStaff(prev => [newStaffMember, ...prev]);
    };
    
    const selectedStoreName = allStores.find(s => s.id === selectedStoreId)?.name || '...';
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Users2 /> Staff & Shift Logs</h1>
                <p className="text-muted-foreground">Manage store staff and log daily shifts.</p>
            </div>
            
            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Store</CardTitle>
                        <CardDescription>Choose a store to view and manage its staff.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='max-w-sm space-y-2'>
                             <Label htmlFor="store-select">Store Location</Label>
                             <Select onValueChange={handleStoreChange} value={selectedStoreId}>
                                <SelectTrigger id="store-select">
                                    <SelectValue placeholder="Select a store" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allStores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Staff Members for {selectedStoreName}</CardTitle>
                        <CardDescription>A list of all staff members assigned to this store.</CardDescription>
                    </div>
                     <AddStaffDialog storeId={selectedStoreId} onStaffAdded={onStaffAdded} />
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : staff.length > 0 ? staff.map(member => (
                            <TableRow key={member.id}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://picsum.photos/seed/${member.id}/40/40`} alt={member.name || ''} data-ai-hint="person" />
                                        <AvatarFallback>{(member.name || 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{member.name || 'Unnamed'}</span>
                                </TableCell>
                                <TableCell>{member.designation || 'N/A'}</TableCell>
                                <TableCell>{member.status}</TableCell>
                                <TableCell>
                                    <Button variant="outline" asChild>
                                        <Link href={`/dashboard/hrms/employees/${member.id}`}>View Shifts</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No staff assigned to this store yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Today's Shift Log for {selectedStoreName}</CardTitle>
                <CardDescription>A log of clock-ins and clock-outs for today.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex justify-end mb-4">
                        <ShiftLogDialog staffMembers={staff} disabled={staff.length === 0} />
                </div>
                <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    This is a placeholder. Real-time log data would be displayed here.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
    );
}


// --- Dialog Components ---

const addStaffSchema = z.object({
  name: z.string().min(2, "Staff name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().min(10, "A valid phone number is required."),
  designation: z.string().min(1, 'Designation is required'),
});
type AddStaffFormValues = z.infer<typeof addStaffSchema>;

function AddStaffDialog({ storeId, onStaffAdded }: { storeId: string; onStaffAdded: (staff: User) => void; }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();

  const form = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { name: '', email: '', phone: '', designation: 'Sales Associate' },
  });
  
  const handleSubmit = async (values: AddStaffFormValues) => {
    if (!storeId) {
        toast({ variant: 'destructive', title: 'No store selected!' });
        return;
    }
    startSubmitting(async () => {
        const result = await addStaffMember(values);
        if(result.success) {
            const newUser = result.data as User;
            onStaffAdded(newUser);
            toast({ title: "Staff Member Added" });
            setOpen(false);
            form.reset();
        } else {
            toast({ variant: 'destructive', title: result.error || "Error" });
        }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!storeId}>
          <PlusCircle className="mr-2" /> Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new staff member. This will also create a system user account.
          </DialogDescription>
        </DialogHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                 <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Staff Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="designation" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Cashier">Cashier</SelectItem>
                                <SelectItem value="Sales Associate">Sales Associate</SelectItem>
                                <SelectItem value="Floor Manager">Floor Manager</SelectItem>
                                <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                        Add Member
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const shiftLogSchema = z.object({
  staffId: z.string().min(1, "Please select a staff member."),
  type: z.enum(['Clock In', 'Clock Out', 'On Break']),
});
type ShiftLogFormValues = z.infer<typeof shiftLogSchema>;

function ShiftLogDialog({ staffMembers, disabled }: { staffMembers: User[], disabled: boolean }) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const form = useForm<ShiftLogFormValues>({
        resolver: zodResolver(shiftLogSchema),
    });

    const handleSubmit = async (values: ShiftLogFormValues) => {
        startSubmitting(async () => {
            const result = await logShiftActivity(values.staffId, values.type);
            if (result.success) {
                toast({ title: "Shift Activity Logged" });
                router.refresh();
                setOpen(false);
                form.reset();
            } else {
                 toast({ variant: 'destructive', title: "Error" });
            }
        });
    };

    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>Clock In / Out</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Log Shift Activity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField control={form.control} name="staffId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Staff Member</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select staff..."/></SelectTrigger></FormControl>
                            <SelectContent>
                                {staffMembers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select action..."/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Clock In">Clock In</SelectItem>
                                <SelectItem value="Clock Out">Clock Out</SelectItem>
                                <SelectItem value="On Break">On Break</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Log Activity
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
    );
}


