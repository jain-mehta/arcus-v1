"use client";

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users as UsersIcon, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { User, Role, Permission, Store as TStore } from '@/lib/mock-data/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createNewUser } from './actions';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  roleIds: z.array(z.string()).optional(),
    customPermissions: z.string().optional(),
  designation: z.string().optional(),
  storeId: z.string().optional(),
});
type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface UsersClientProps {
  initialUsers: User[];
  allRoles: Role[];
  allPermissions: Permission[];
  allStores: TStore[];
}

export function UsersClient({ initialUsers, allRoles, allPermissions, allStores }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [, startTransition] = useTransition();

  const handleUserCreated = (u: User) => {
    setUsers((prev) => [u, ...prev]);
  };

  const roleMap = new Map(allRoles.map((r) => [r.id, r.name]));
  const storeMap = new Map(allStores.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon /> User Management
          </h1>
          <p className="text-muted-foreground">Assign roles and permissions to users in your organization.</p>
        </div>
        <CreateUserDialog allRoles={allRoles} allStores={allStores} allPermissions={allPermissions} onUserCreated={handleUserCreated} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
          <CardDescription>This is a list of all users in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Store</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className={cn(u.status === 'Inactive' && 'text-muted-foreground opacity-70')}>
                  <TableCell>
                    <Link href={`/dashboard/hrms/employees/${u.id}`} className="hover:underline">
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {u.roleIds?.map((rid) => (
                        <Badge key={rid}>{roleMap.get(rid) ?? rid}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{u.storeId ? storeMap.get(u.storeId) ?? 'Unknown' : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateUserDialog({ allRoles, allStores, allPermissions, onUserCreated }: { allRoles: Role[]; allStores: TStore[]; allPermissions: Permission[]; onUserCreated: (user: User) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', roleIds: [], customPermissions: '', designation: '', storeId: '' },
  });

  const onSubmit = (values: CreateUserFormValues) => {
    startSubmitting(async () => {
      try {
        const result = await createNewUser(values as any);
        if (result.success && result.newUser) {
          onUserCreated(result.newUser);
          const temp = result.message || '';
          toast({ title: 'User Created', description: `${result.newUser.name} has been added.` });
          if (temp) {
            toast({ title: 'Temporary Password', description: 'A temporary password was generated and copied to clipboard.' });
            try { await navigator.clipboard.writeText(temp); } catch (e) { /* ignore */ }
          }
          setOpen(false);
          form.reset();
        } else {
          throw new Error(result.message || 'An unknown error occurred.');
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || String(error) });
      }
    });
  };

  return (
    <div>
      <Button onClick={() => { form.reset(); setOpen(true); }}>
        <PlusCircle className="mr-2" /> Create User
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded shadow p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold">Create New User</h3>
            <p className="text-sm text-muted-foreground mb-4">This will create a new user account and invite them to the organization.</p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              <div>
                    <label htmlFor="create-user-name" className="block text-sm font-medium mb-1">Full Name</label>
                <input id="create-user-name" className="input w-full" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{String(form.formState.errors.name?.message)}</p>}
              </div>
              <div>
                <label htmlFor="create-user-email" className="block text-sm font-medium mb-1">Email</label>
                <input id="create-user-email" className="input w-full" type="email" {...form.register('email')} />
                {form.formState.errors.email && <p className="text-xs text-destructive">{String(form.formState.errors.email?.message)}</p>}
              </div>
              <div>
                <label htmlFor="create-user-roles" className="block text-sm font-medium mb-1">Roles (comma-separated role ids)</label>
                <input id="create-user-roles" className="input w-full" {...form.register('roleIds')} placeholder={allRoles.map(r => r.id).join(', ')} />
                <p className="text-xs text-muted-foreground">You can enter role ids as comma separated values (e.g. admin,shop-owner)</p>
              </div>

              <div>
                <label htmlFor="create-user-custom-perms" className="block text-sm font-medium mb-1">Custom Permissions (comma-separated)</label>
                <input id="create-user-custom-perms" className="input w-full" {...form.register('customPermissions')} placeholder={allPermissions.map(p => p.id).join(', ')} />
                <p className="text-xs text-muted-foreground">Assign specific permission strings directly. This allows granting a single submodule action without a role.</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting as unknown as boolean}>{isSubmitting ? 'Creating...' : 'Create User'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// preserve default export for other imports
export default UsersClient;


