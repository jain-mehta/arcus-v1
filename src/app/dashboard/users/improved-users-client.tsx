"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users as UsersIcon, PlusCircle, Edit, Trash2, Key, RefreshCw, Eye, EyeOff } from 'lucide-react';
import type { User, Role, Permission, Store as TStore } from '@/lib/mock-data/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createNewUser, updateUser, deleteUser } from './actions';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().min(1, 'Role is required'), 
  designation: z.string().optional(),
  storeId: z.string().optional(),
  reportingManagerId: z.string().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface UsersClientProps {
  initialUsers: User[];
  allRoles: Role[];
  allPermissions: Permission[];
  allStores: TStore[];
}

export function ImprovedUsersClient({ initialUsers, allRoles, allPermissions, allStores }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [roles, setRoles] = useState<Role[]>(allRoles || []);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Refresh roles when navigating between tabs
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const response = await fetch('/api/admin/roles');
        if (response.ok) {
          const data = await response.json();
          setRoles(data.roles || data);
        } else {
          const text = await response.text();
          console.warn('[Roles Refresh] failed to fetch roles:', response.status, text);
        }
      } catch (error) {
        console.error('Failed to refresh roles:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleUserCreated = (u: User) => {
    setUsers((prev) => [u, ...prev]);
  };

  const handleUserUpdated = (u: User) => {
    setUsers((prev) => prev.map(user => user.id === u.id ? u : user));
  };

  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter(u => u.id !== userId));
  };

  const roleMap = new Map(roles.map((r) => [r.id, r.name]));
  const storeMap = new Map(allStores.map((s) => [s.id, s.name]));
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-8 w-8" /> User Management
          </h1>
          <p className="text-muted-foreground mt-2">Assign roles and permissions to users in your organization.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
          <CardDescription>Manage all users in your organization. Click on a row to edit.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Roles</TableHead>
                  <TableHead className="font-semibold">Designation</TableHead>
                  <TableHead className="font-semibold">Store</TableHead>
                  <TableHead className="font-semibold">Manager</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No users found. Create your first user to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow 
                      key={u.id} 
                      className={cn(
                        "hover:bg-muted/50 cursor-pointer transition-colors",
                        u.status === 'Inactive' && 'text-muted-foreground opacity-70'
                      )}
                      onClick={() => setEditingUser(u)}
                    >
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roleIds?.map((rid) => (
                            <Badge key={rid} variant="secondary">{roleMap.get(rid) ?? rid}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{u.designation || '-'}</TableCell>
                      <TableCell>{u.storeId ? storeMap.get(u.storeId) ?? 'Unknown' : 'N/A'}</TableCell>
                      <TableCell>{u.reportsTo ? userMap.get(u.reportsTo) ?? 'Unknown' : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUser(u);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        allRoles={roles}
        allStores={allStores}
        allUsers={users}
        onUserCreated={handleUserCreated}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          allRoles={roles}
          allStores={allStores}
          allUsers={users}
          onUserUpdated={handleUserUpdated}
          onUserDeleted={handleUserDeleted}
        />
      )}
    </div>
  );
}

// Generate random password helper
function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allRoles: Role[];
  allStores: TStore[];
  allUsers: User[];
  onUserCreated: (user: User) => void;
}

function CreateUserDialog({ open, onOpenChange, allRoles, allStores, allUsers, onUserCreated }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitting] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(''); // Changed to single role
  const [password, setPassword] = useState('');

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: '', 
      designation: '',
      storeId: '',
      reportingManagerId: '',
    },
  });

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassword(newPassword);
    form.setValue('password', newPassword);
    toast({
      title: 'Password Generated',
      description: 'A secure random password has been generated.',
    });
  };

  const onSubmit = (values: CreateUserFormValues) => {
    startSubmitting(async () => {
      try {
        const result = await createNewUser({
          ...values,
          roleIds: [selectedRole], // Convert single role to array for backend
        } as any);
        
        if (result.success && result.newUser) {
          onUserCreated(result.newUser);
          toast({
            title: 'User Created',
            description: `${result.newUser.name} has been added successfully.`,
          });
          onOpenChange(false);
          form.reset();
          setSelectedRole('');
          setPassword('');
        } else {
          throw new Error(result.message || 'Failed to create user');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || String(error),
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account and assign roles and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...form.register('name')}
              className="h-11"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              className="h-11"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    form.setValue('password', e.target.value);
                  }}
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePassword}
                className="h-11"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          {/* Role Selection - Single Select Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="role-select">Role *</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => {
                setSelectedRole(value);
                form.setValue('roleId', value);
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {allRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.roleId && (
              <p className="text-sm text-destructive">{form.formState.errors.roleId.message}</p>
            )}
          </div>

          {/* Designation */}
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              placeholder="Sales Manager"
              {...form.register('designation')}
              className="h-11"
            />
          </div>

          {/* Store */}
          <div className="space-y-2">
            <Label htmlFor="storeId">Store</Label>
            <Select
              onValueChange={(value) => form.setValue('storeId', value)}
              defaultValue={form.getValues('storeId')}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Store</SelectItem>
                {allStores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reporting Manager */}
          <div className="space-y-2">
            <Label htmlFor="reportingManagerId">Reporting Manager</Label>
            <Select
              onValueChange={(value) => form.setValue('reportingManagerId', value)}
              defaultValue={form.getValues('reportingManagerId')}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select reporting manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {allUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allRoles: Role[];
  allStores: TStore[];
  allUsers: User[];
  onUserUpdated: (user: User) => void;
  onUserDeleted: (userId: string) => void;
}

function EditUserDialog({ user, open, onOpenChange, allRoles, allStores, allUsers, onUserUpdated, onUserDeleted }: EditUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [selectedRole, setSelectedRole] = useState<string>(user.roleIds?.[0] || ''); // Changed to single role
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [designation, setDesignation] = useState(user.designation || '');
  const [storeId, setStoreId] = useState(user.storeId || '');
  const [reportingManagerId, setReportingManagerId] = useState(user.reportsTo || '');

  const handleUpdate = () => {
    startSubmitting(async () => {
      try {
        const result = await updateUser(user.id, {
          roleIds: [selectedRole], // Convert to array for backend
          designation,
          storeId: storeId === 'none' ? undefined : storeId,
          reportsTo: reportingManagerId === 'none' ? undefined : reportingManagerId,
        });

        if (result.success && result.updatedUser) {
          onUserUpdated(result.updatedUser);
          toast({
            title: 'User Updated',
            description: `${user.name} has been updated successfully.`,
          });
          onOpenChange(false);
        } else {
          throw new Error(result.message || 'Failed to update user');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || String(error),
        });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    startDeleting(async () => {
      try {
        const result = await deleteUser(user.id);
        if (result.success) {
          onUserDeleted(user.id);
          toast({
            title: 'User Deleted',
            description: `${user.name} has been deleted successfully.`,
          });
          onOpenChange(false);
        } else {
          throw new Error(result.message || 'Failed to delete user');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || String(error),
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit User</DialogTitle>
          <DialogDescription>
            Update user information, roles, and permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={name}
              disabled
              className="h-11 bg-muted"
            />
          </div>

          {/* Email - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              disabled
              className="h-11 bg-muted"
            />
          </div>

          {/* Role Selection - Single Select Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role *</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {allRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Designation */}
          <div className="space-y-2">
            <Label htmlFor="edit-designation">Designation</Label>
            <Input
              id="edit-designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Store */}
          <div className="space-y-2">
            <Label htmlFor="edit-storeId">Store</Label>
            <Select value={storeId || 'none'} onValueChange={setStoreId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Store</SelectItem>
                {allStores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reporting Manager */}
          <div className="space-y-2">
            <Label htmlFor="edit-reportingManagerId">Reporting Manager</Label>
            <Select value={reportingManagerId || 'none'} onValueChange={setReportingManagerId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select reporting manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {allUsers.filter(u => u.id !== user.id).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


