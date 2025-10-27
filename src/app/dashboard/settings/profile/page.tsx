
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/mock-data/types';
import { getUserProfile, updateCurrentUserProfile, getActiveSessionsForCurrentUser, revokeSessionById } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Edit, Loader2, Mail, Phone, Briefcase, MapPin } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  phone: z.string().min(10, "A valid phone number is required."),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getUserProfile();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not load user profile. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const onProfileUpdated = (updatedUser: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">View and manage your personal information.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className='flex items-center gap-4'>
                 <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://picsum.photos/seed/${user.id}/80/80`} data-ai-hint="person" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
            </div>
            <EditProfileDialog user={user} onProfileUpdated={onProfileUpdated} />
        </CardHeader>
        <CardContent>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Role</p>
                        <p className="font-medium">{user.roleIds.join(', ')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                     <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{(user as any).phone || 'Not Provided'}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                     <div>
                        <p className="text-muted-foreground">Address</p>
                        <p className="font-medium">{(user as any).address || 'Not Provided'}</p>
                    </div>
                </div>
            </div>
      <Separator className="my-6" />
      <div>
        <h3 className="text-lg font-semibold mb-2">Active Sessions</h3>
        <UserSessionsPanel />
      </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserSessionsPanel() {
  const [sessions, setSessions] = useState<any[] | null>(null);
  const { toast } = useToast();
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getActiveSessionsForCurrentUser();
        setSessions(data || []);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load sessions' });
        setSessions([]);
      }
    }
    load();
  }, []);

  async function confirmRevoke() {
    if (!pendingRevokeId) return;
    try {
      const res = await revokeSessionById(pendingRevokeId);
      if (!res.success) throw new Error(res.message || 'Failed');
      toast({ title: 'Session revoked' });
      const data = await getActiveSessionsForCurrentUser();
      setSessions(data || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to revoke session' });
    } finally {
      setDialogOpen(false);
      setPendingRevokeId(null);
    }
  }

  if (sessions === null) return <div>Loading sessions...</div>;
  if (sessions.length === 0) return <div className="text-sm text-muted-foreground">No other active sessions.</div>;

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} className="flex items-center justify-between p-2 border rounded">
          <div>
            <div className="font-medium">{s.deviceInfo || 'web'}</div>
            <div className="text-sm text-muted-foreground">{s.id}  Created {new Date(s.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <Button variant="ghost" onClick={() => { setPendingRevokeId(s.id); setDialogOpen(true); }}>Revoke</Button>
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Session</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to revoke this session? This will sign it out immediately.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setDialogOpen(false); setPendingRevokeId(null); }}>Cancel</Button>
            <Button onClick={confirmRevoke}>Revoke Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditProfileDialog({ user, onProfileUpdated }: { user: User, onProfileUpdated: (data: Partial<User>) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSaving, startSaving] = useTransition();
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            phone: (user as any).phone || '',
            address: (user as any).address || '',
        }
    });

    const onSubmit = (values: ProfileFormValues) => {
        startSaving(async () => {
            try {
                const result = await updateCurrentUserProfile(values);
                if (result.success) {
                    onProfileUpdated(values);
                    toast({ title: "Profile Updated" });
                    setOpen(false);
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update profile.' });
            }
        });
    };

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                             <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                             <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                             </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function ProfileSkeleton() {
    return (
         <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-7 w-40" />
                             <Skeleton className="h-5 w-52" />
                        </div>
                    </div>
                     <Skeleton className="h-10 w-32" />
                </CardHeader>
                <CardContent>
                    <Separator className="my-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10 md:col-span-2" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


