"use client";

import React, { useMemo, useState } from 'react';
import type { Role, Store, User } from '@/lib/mock-data/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addStaffMember, updateStaffMember } from '../actions';
import { useToast } from '@/hooks/use-toast';

type EmployeesClientProps = {
    initialStaff: User[];
    allStores: Store[];
    allUsers: User[];
    allRoles: Role[];
    isAdmin: boolean;
    currentUserStoreId?: string;
};

export function EmployeesClient(props: EmployeesClientProps) {
    const { initialStaff, allStores, allUsers, allRoles, isAdmin, currentUserStoreId } = props;
    const { toast } = useToast();

    const [staff, setStaff] = useState<User[]>(initialStaff);
    const [filterStore, setFilterStore] = useState<string>(currentUserStoreId || 'all');
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [designation, setDesignation] = useState<string>('');
    const [storeId, setStoreId] = useState<string>(currentUserStoreId || '');
    const [reportsTo, setReportsTo] = useState<string>('');

    const filtered = useMemo(() => {
        if (filterStore === 'all') return staff;
        return staff.filter(s => s.storeId === filterStore);
    }, [staff, filterStore]);

    async function handleAddStaff(e: React.FormEvent) {
        e.preventDefault();
        if (!isAdmin) {
            toast({ variant: 'destructive', title: 'Permission denied' });
            return;
        }
        const res = await addStaffMember({ name, designation, email, phone, storeId: storeId || undefined, reportsTo: reportsTo || undefined });
        if (res.success && res.newUser) {
            setStaff(prev => [res.newUser as User, ...prev]);
            toast({ title: 'Staff added' });
            setName(''); setEmail(''); setPhone(''); setDesignation('');
        } else {
            toast({ variant: 'destructive', title: 'Failed to add staff', description: res.message });
        }
    }

    async function handleQuickStatusToggle(user: User) {
        if (!isAdmin) return;
        const newStatus: any = (user as any).status === 'Clocked In' ? 'Clocked Out' : 'Clocked In';
        const res = await updateStaffMember(user.id, { status: newStatus });
        if (res.success && res.updatedUser) {
            setStaff(prev => prev.map(s => s.id === user.id ? (res.updatedUser as User) : s));
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Employees</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <Label>Filter by Store</Label>
                            <Select value={filterStore} onValueChange={setFilterStore}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select store" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stores</SelectItem>
                                    {allStores.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Status</TableHead>
                                    {isAdmin && <TableHead>Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{u.designation}</TableCell>
                                        <TableCell>{allStores.find(s => s.id === u.storeId)?.name || '-'}</TableCell>
                                        <TableCell>{u.status || 'Clocked Out'}</TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <Button variant="secondary" size="sm" onClick={() => handleQuickStatusToggle(u)}>
                                                    Toggle Status
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add Staff Member</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
                            </div>
                            <div>
                                <Label>Designation</Label>
                                <Select value={designation} onValueChange={setDesignation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select designation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allRoles.map(r => (
                                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Store</Label>
                                <Select value={storeId} onValueChange={setStoreId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {allStores.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Reports To</Label>
                                <Select value={reportsTo} onValueChange={setReportsTo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {allUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-3">
                                <Button type="submit">Add Staff</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}




