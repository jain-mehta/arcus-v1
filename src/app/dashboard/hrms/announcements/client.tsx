
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, FileText, Download, PlusCircle, Trash2, Loader2, Upload } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { createAnnouncement, deleteAnnouncement, uploadPolicy, deletePolicy } from './actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AnnouncementsClientProps {
  initialAnnouncements: any[];
  initialPolicies: any[];
  isAdmin: boolean;
}

export function AnnouncementsClient({ initialAnnouncements, initialPolicies, isAdmin }: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [policies, setPolicies] = useState(initialPolicies);

  const onAnnouncementCreated = (newAnnouncement: any) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };
  const onAnnouncementDeleted = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };
  const onPolicyUploaded = (newPolicy: any) => {
    setPolicies(prev => [newPolicy, ...prev]);
  };
  const onPolicyDeleted = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone /> Announcements & Policies
        </h1>
        <p className="text-muted-foreground">
          A central place for company-wide announcements and policy documents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Recent Announcements</CardTitle>
                <CardDescription>Latest news and updates from the company.</CardDescription>
            </div>
            {isAdmin && <CreateAnnouncementDialog onCreate={onAnnouncementCreated} />}
          </CardHeader>
          <CardContent className="space-y-6">
            {announcements.length > 0 ? announcements.map(announcement => (
              <div key={announcement.id} className="p-4 border rounded-lg bg-muted/50 relative group">
                <h3 className="font-semibold">{announcement.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">Posted by {announcement.author} on {new Date(announcement.date).toLocaleDateString()}</p>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                {isAdmin && <DeleteButton id={announcement.id} name={announcement.title} onDelete={deleteAnnouncement} onDeleted={onAnnouncementDeleted} type="Announcement" />}
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-8">No announcements posted yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Company Policy Library</CardTitle>
                <CardDescription>Important documents for all employees.</CardDescription>
            </div>
            {isAdmin && <UploadPolicyDialog onUpload={onPolicyUploaded} />}
          </CardHeader>
          <CardContent className="space-y-4">
            {policies.length > 0 ? policies.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg group">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Version: {doc.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={doc.fileUrl} download={doc.fileName}><Download className="mr-2 h-4 w-4" />Download</a>
                    </Button>
                    {isAdmin && <DeleteButton id={doc.id} name={doc.name} onDelete={deletePolicy} onDeleted={onPolicyDeleted} type="Policy" />}
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-8">No policy documents uploaded yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Dialogs & Components ---

const announcementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  content: z.string().min(10, "Content must be at least 10 characters."),
});
type AnnouncementFormValues = z.infer<typeof announcementSchema>;

function CreateAnnouncementDialog({ onCreate }: { onCreate: (newAnnouncement: any) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const form = useForm<AnnouncementFormValues>({ resolver: zodResolver(announcementSchema) });

  const handleSubmit = async (values: AnnouncementFormValues) => {
    startSubmitting(async () => {
      const result = await createAnnouncement(values);
      if (result.success && result.newAnnouncement) {
        toast({ title: "Announcement Posted" });
        onCreate(result.newAnnouncement);
        setOpen(false);
        form.reset();
      } else {
        toast({ variant: 'destructive', title: "Error", description: result.message });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2" /> New Announcement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 animate-spin" />}Post</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const policySchema = z.object({
    name: z.string().min(3, "Policy name is required."),
    version: z.string().min(1, "Version is required (e.g., 1.0)."),
    file: z.instanceof(File).refine(file => file.size > 0, 'A file is required.').refine(file => file.type === 'application/pdf', 'Only PDF files are allowed.'),
});
type PolicyFormValues = z.infer<typeof policySchema>;

function UploadPolicyDialog({ onUpload }: { onUpload: (newPolicy: any) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();
    const form = useForm<PolicyFormValues>({ resolver: zodResolver(policySchema) });

    const handleSubmit = async (values: PolicyFormValues) => {
        startSubmitting(async () => {
            const result = await uploadPolicy({ name: values.name, version: values.version }, values.file);
            if (result.success && result.newPolicy) {
                toast({ title: "Policy Uploaded" });
                onUpload(result.newPolicy);
                setOpen(false);
                form.reset();
            } else {
                toast({ variant: 'destructive', title: "Error", description: result.message });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline"><Upload className="mr-2" /> Upload Policy</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Upload New Policy Document</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Policy Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Work From Home Policy" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="version" render={({ field }) => (<FormItem><FormLabel>Version</FormLabel><FormControl><Input {...field} placeholder="e.g., 2.1" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="file" render={({ field }) => (<FormItem><FormLabel>Policy Document (PDF)</FormLabel><FormControl><Input type="file" accept="application/pdf" onChange={e => field.onChange(e.target.files?.[0])} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 animate-spin" />}Upload</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteButton({ id, name, onDelete, onDeleted, type }: { id: string, name: string, onDelete: (id: string) => Promise<{success: boolean, message?: string}>, onDeleted: (id: string) => void, type: 'Announcement' | 'Policy' }) {
    const { toast } = useToast();
    const [isDeleting, startDeleting] = useTransition();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action will permanently delete the {type.toLowerCase()} "{name}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => startDeleting(async () => {
                            const result = await onDelete(id);
                            if(result.success) {
                                onDeleted(id);
                                toast({title: `${type} Deleted`});
                            } else {
                                toast({variant: 'destructive', title: 'Error', description: result.message});
                            }
                        })}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

