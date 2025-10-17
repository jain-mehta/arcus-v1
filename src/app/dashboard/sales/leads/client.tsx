

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Lightbulb, Loader2, UserPlus, ArrowRight, MoreHorizontal, Edit, Trash2, Sparkles, ArrowDown, ArrowUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { addLead, convertLeadToCustomer, updateLead, deleteLead } from "../actions";
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';
import type { Lead, User } from '@/lib/firebase/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from "@/components/ui/label";

const leadSchema = z.object({
    name: z.string().min(2, "Lead name is required."),
    company: z.string().min(2, "Company name is required."),
    stage: z.enum(['New', 'Contacted', 'Qualified', 'Lost']),
    source: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const convertLeadSchema = z.object({
    createOpportunity: z.boolean().default(false),
    opportunityValue: z.coerce.number().optional(),
});
type ConvertLeadFormValues = z.infer<typeof convertLeadSchema>;

interface LeadsClientProps {
    initialLeads: Lead[];
    users: User[];
}

export function LeadsClient({ initialLeads, users }: LeadsClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const stageFilter = searchParams.get('stage') || 'all';
  const assignedToFilter = searchParams.get('assignedTo') || 'all';
  const leadScoreFilter = searchParams.get('leadScore') || 'all';
  const sortBy = searchParams.get('sortBy') || 'created';
  const sortDirection = searchParams.get('sortDirection') || 'desc';

  const onLeadAdded = (newLead: Lead) => {
    // For simplicity, just refetch all to ensure sorting and filtering is correct
    router.refresh();
  };

  const onLeadUpdated = (updatedLead: Lead) => {
    router.refresh();
  }

  const onLeadDeleted = (deletedLeadId: string) => {
    router.refresh();
  }
  
  const getScoreBadgeVariant = (score?: 'High' | 'Medium' | 'Low') => {
    switch (score) {
        case 'High': return 'destructive';
        case 'Medium': return 'secondary';
        case 'Low':
        default:
            return 'outline';
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === 'all') {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/dashboard/sales/leads${query}`);
  };

  const handleSortChange = (column: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const currentSortBy = current.get('sortBy');
    const currentSortDirection = current.get('sortDirection');
    
    if (currentSortBy === column && currentSortDirection === 'asc') {
      current.set('sortDirection', 'desc');
    } else {
      current.set('sortBy', column);
      current.set('sortDirection', 'asc');
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/dashboard/sales/leads${query}`);
  }

  const SortableHeader = ({ column, label }: { column: string, label: string }) => {
    const isActive = sortBy === column;
    const isAsc = sortDirection === 'asc';
    return (
      <TableHead>
        <Button variant="ghost" onClick={() => handleSortChange(column)} className="px-2">
          {label}
          {isActive && (isAsc ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
        </Button>
      </TableHead>
    )
  }
  
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between">
        <div>
            <div className="flex items-center gap-2">
                <Lightbulb className="h-7 w-7 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
            </div>
            <p className="text-muted-foreground">Capture, track, and convert new business leads.</p>
        </div>
        <AddLeadDialog onLeadAdded={onLeadAdded} />
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
              <div className="grid w-full max-w-xs items-center gap-1.5">
                  <Label>Stage</Label>
                  <Select value={stageFilter} onValueChange={(val) => handleFilterChange('stage', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Stages</SelectItem>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Qualified">Qualified</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
               <div className="grid w-full max-w-xs items-center gap-1.5">
                  <Label>Assigned To</Label>
                  <Select value={assignedToFilter} onValueChange={(val) => handleFilterChange('assignedTo', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          {users.map(user => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid w-full max-w-xs items-center gap-1.5">
                  <Label>Priority</Label>
                  <Select value={leadScoreFilter} onValueChange={(val) => handleFilterChange('leadScore', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>All Leads</CardTitle>
            <CardDescription>A list of all incoming leads.</CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <SortableHeader column="name" label="Lead Name" />
                        <SortableHeader column="company" label="Company" />
                        <TableHead>Priority</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <SortableHeader column="created" label="Created Date" />
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialLeads.map(lead => (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>{lead.company}</TableCell>
                             <TableCell>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant={getScoreBadgeVariant(lead.leadScore)}>
                                            <div className="flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                {lead.leadScore || 'N/A'}
                                            </div>
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{lead.leadScoreReasoning || 'Not yet scored.'}</p>
                                    </TooltipContent>
                                </Tooltip>
                             </TableCell>
                            <TableCell>
                                <InlineStageUpdate lead={lead} onLeadUpdated={onLeadUpdated} />
                            </TableCell>
                            <TableCell>{lead.source || 'N/A'}</TableCell>
                            <TableCell>{lead.assignedTo}</TableCell>
                            <TableCell className="text-muted-foreground">{lead.lastActivity}</TableCell>
                            <TableCell>{new Date(lead.created).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                               <LeadActions lead={lead} onLeadUpdated={onLeadUpdated} onLeadDeleted={onLeadDeleted} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function InlineStageUpdate({ lead, onLeadUpdated }: { lead: Lead; onLeadUpdated: (lead: Lead) => void; }) {
    const { toast } = useToast();
    const [isUpdating, startTransition] = useTransition();

    const handleStageChange = (newStage: Lead['stage']) => {
        startTransition(async () => {
            const result = await updateLead(lead.id, { stage: newStage });
            if (result.success && result.updatedLead) {
                onLeadUpdated(result.updatedLead);
                toast({ title: 'Stage Updated' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    }

    const getStageBadgeVariant = (stage: Lead['stage']) => {
        return stage === 'New' ? 'secondary' : stage === 'Lost' ? 'destructive' : 'outline';
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : (
                        <Badge variant={getStageBadgeVariant(lead.stage)} className="cursor-pointer">
                            {lead.stage}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {['New', 'Contacted', 'Qualified', 'Lost'].map(stage => (
                    <DropdownMenuItem 
                        key={stage} 
                        onSelect={() => handleStageChange(stage as Lead['stage'])}
                        disabled={lead.stage === stage}
                    >
                        {stage}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function AddLeadDialog({ onLeadAdded }: { onLeadAdded: (newLead: Lead) => void}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", company: "", stage: "New", source: "Manual Entry" },
  });

  const onSubmit = (values: LeadFormValues) => {
    startTransition(async () => {
        const result = await addLead(values);
        if (result.success && result.newLead) {
            onLeadAdded(result.newLead);
            toast({
                title: "Lead Added",
                description: `${values.name} from ${values.company} has been assigned to ${result.newLead.assignedTo}.`,
            });
            setOpen(false);
            form.reset();
        } else {
            toast({
                variant: 'destructive',
                title: "Error",
                description: result.message || "An unknown error occurred.",
            });
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Lead
            </Button>
        </DialogTrigger>
         <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Fill in the details for the new lead.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Lead Name</FormLabel><FormControl><Input {...field} placeholder="Aarav Sharma" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="company" render={({ field }) => (
                        <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} placeholder="Innovate Solutions" /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="stage" render={({ field }) => (
                         <FormItem>
                            <FormLabel>Lead Stage</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="New">New</SelectItem>
                                    <SelectItem value="Contacted">Contacted</SelectItem>
                                    <SelectItem value="Qualified">Qualified</SelectItem>
                                    <SelectItem value="Lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                         </FormItem>
                     )} />
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lead Source</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Website">Website</SelectItem>
                                        <SelectItem value="Referral">Referral</SelectItem>
                                        <SelectItem value="Trade Show">Trade Show</SelectItem>
                                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                                        <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Lead
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

function LeadActions({ lead, onLeadUpdated, onLeadDeleted }: { lead: Lead; onLeadUpdated: (lead: Lead) => void; onLeadDeleted: (id: string) => void; }) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteLead(lead.id);
      if (result.success) {
        onLeadDeleted(lead.id);
        toast({ title: 'Lead Deleted' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <ConvertLeadDialog lead={lead} onLeadConverted={onLeadDeleted} />
        <EditLeadDialog lead={lead} onLeadUpdated={onLeadUpdated} />
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the lead "{lead.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={cn(isDeleting && "opacity-50")}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function ConvertLeadDialog({ lead, onLeadConverted }: { lead: Lead; onLeadConverted: (id: string) => void; }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isConverting, startTransition] = useTransition();
    
    const form = useForm<ConvertLeadFormValues>({
        resolver: zodResolver(convertLeadSchema),
        defaultValues: { createOpportunity: true, opportunityValue: 100000 },
    });

    const createOpportunity = form.watch('createOpportunity');

    const handleConvert = (values: ConvertLeadFormValues) => {
        startTransition(async () => {
            const result = await convertLeadToCustomer(lead.id, values.createOpportunity ? values.opportunityValue || 0 : 0);

            if (result.success) {
                onLeadConverted(lead.id);
                toast({
                    title: 'Lead Converted!',
                    description: (
                        <div>
                            <p>{lead.name} is now a customer.</p>
                            <div className="mt-4 flex flex-col gap-2">
                               {result.customerId && <Button variant="outline" size="sm" asChild><Link href={`/dashboard/sales/customers/${result.customerId}`}>View Customer <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
                               {result.opportunityId && <Button variant="outline" size="sm" asChild><Link href={`/dashboard/sales/opportunities`}>View Opportunity <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
                            </div>
                        </div>
                    )
                });
                setOpen(false);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convert Lead
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Convert Lead: {lead.name}</DialogTitle>
                    <DialogDescription>Convert this lead into a customer and create a new sales opportunity.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleConvert)} className="space-y-6">
                        <div className="py-4 space-y-4 border-t border-b">
                             <FormField
                                control={form.control}
                                name="createOpportunity"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Create a new sales opportunity for this customer
                                        </FormLabel>
                    <p className="text-sm text-muted-foreground">This will add a new card to the sales pipeline.</p>
                                    </div>
                                    </FormItem>
                                )}
                            />
                            {createOpportunity && (
                                <FormField
                                    control={form.control}
                                    name="opportunityValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Initial Opportunity Value (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="e.g., 50000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        <DialogFooter>
                             <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isConverting}>
                                {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <UserPlus className="mr-2 h-4 w-4" />
                                Convert to Customer
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function EditLeadDialog({ lead, onLeadUpdated }: { lead: Lead; onLeadUpdated: (lead: Lead) => void; }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead.name,
      company: lead.company,
      stage: lead.stage,
      source: lead.source || 'Manual Entry',
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    startTransition(async () => {
      const result = await updateLead(lead.id, values);
      if (result.success && result.updatedLead) {
        onLeadUpdated(result.updatedLead);
        toast({ title: 'Lead Updated' });
        setOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Lead
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Lead Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="stage" render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Website">Website</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Trade Show">Trade Show</SelectItem>
                                <SelectItem value="Cold Call">Cold Call</SelectItem>
                                <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


    
