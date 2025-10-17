

'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Loader2, Filter, Edit, Trash2, Search, Presentation, Sparkles, Clock, CalendarClock, MessageSquare, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { addOpportunity, updateOpportunity, deleteOpportunity, updateOpportunityPriority, addCommunicationLog } from '../actions';
import { summarizeOpportunity, getKanbanData } from './actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Opportunity, Customer, User, CommunicationLog } from '@/lib/firebase/types';
import { Label } from '@/components/ui/label';
import { OpportunityFormDialog, opportunitySchema } from './opportunity-form-dialog';
import { cn } from '@/lib/utils';
import type { OpportunityFormValues } from './opportunity-form-dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';


const pipelineStages = [
    { id: 'Qualification', title: 'Qualification' },
    { id: 'Needs Analysis', title: 'Needs Analysis' },
    { id: 'Proposal', title: 'Proposal' },
    { id: 'Negotiation', title: 'Negotiation' },
    { id: 'Closed Won', title: 'Closed Won' },
    { id: 'Closed Lost', title: 'Closed Lost' },
];

function ClientOnly({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return null;
    }

    return children;
}


export default function OpportunitiesPage() {
    const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
    const [salesCustomers, setSalesCustomers] = useState<Customer[]>([]);
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [customerFilter, setCustomerFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const refetchData = async () => {
        setLoading(true);
        try {
            const { opportunities: opps, customers: custs } = await getKanbanData();
            setAllOpportunities(opps);
            setSalesCustomers(custs);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load pipeline data.'});
        } finally {
            setLoading(false);
        }
    }

     useEffect(() => {
        refetchData();
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);

    const customerMap = useMemo(() => new Map(salesCustomers.map(c => [c.id, c.name])), [salesCustomers]);

    const getCustomerName = (customerId: string) => {
        return customerMap.get(customerId) || 'Unknown Customer';
    };

    const filteredOpportunities = useMemo(() => {
        return allOpportunities.filter(opp => {
            const customerMatch = customerFilter === 'all' || opp.customerId === customerFilter;
            const searchMatch = !searchTerm || 
                                opp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                getCustomerName(opp.customerId).toLowerCase().includes(searchTerm.toLowerCase());
            return customerMatch && searchMatch;
        });
    }, [allOpportunities, customerFilter, searchTerm, getCustomerName]);


    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const startColId = source.droppableId;
        const endColId = destination.droppableId;

        startTransition(async () => {
            // Optimistic UI Update
            let movedOpp: Opportunity | undefined;
            const updatedOpps = allOpportunities.map(opp => {
                if (opp.id === draggableId) {
                    movedOpp = { ...opp, stage: endColId as Opportunity['stage'], stageLastChanged: new Date().toISOString() };
                    return movedOpp;
                }
                return opp;
            });
            
            const startColOpps = updatedOpps.filter(opp => opp.stage === startColId);
            const endColOpps = updatedOpps.filter(opp => opp.stage === endColId);

            if (startColId === endColId) {
                // Reordering in the same column
                const [reorderedItem] = endColOpps.splice(source.index, 1);
                endColOpps.splice(destination.index, 0, reorderedItem);

                const updates = endColOpps.map((opp, index) => ({ id: opp.id, priority: index }));

                const finalOpps = allOpportunities.map(opp => {
                    const update = updates.find(u => u.id === opp.id);
                    return update ? { ...opp, priority: update.priority } : opp;
                });
                setAllOpportunities(finalOpps);
                
                await updateOpportunityPriority(updates);
            } else {
                // Moving to a different column
                const startColUpdates = startColOpps.map((opp, index) => ({ id: opp.id, priority: index }));
                
                const [movedItem] = updatedOpps.filter(o => o.id === draggableId);
                endColOpps.splice(destination.index, 0, movedItem);
                const endColUpdates = endColOpps.map((opp, index) => ({ id: opp.id, priority: index }));

                const finalOpps = updatedOpps.map(opp => {
                    const startUpdate = startColUpdates.find(u => u.id === opp.id);
                    if (startUpdate) return { ...opp, priority: startUpdate.priority };
                    
                    const endUpdate = endColUpdates.find(u => u.id === opp.id);
                    if (endUpdate) return { ...opp, priority: endUpdate.priority };

                    return opp;
                });
                setAllOpportunities(finalOpps);

                await Promise.all([
                    updateOpportunity(draggableId, { stage: endColId as any }),
                    updateOpportunityPriority([...startColUpdates, ...endColUpdates])
                ]);
            }
            toast({ title: 'Opportunity Updated' });
        });
    };
    
    const handleAddOpportunity = async (newOpportunityData: OpportunityFormValues) => {
        await addOpportunity(newOpportunityData);
        toast({
            title: 'Opportunity Created',
            description: `${newOpportunityData.title} has been added to the pipeline.`,
        });
        await refetchData();
    };

    const handleUpdateOpportunity = async (id: string, data: OpportunityFormValues) => {
        await updateOpportunity(id, data);
        toast({ title: 'Opportunity Updated' });
        await refetchData();
    };

    const handleDeleteOpportunity = async (id: string) => {
        await deleteOpportunity(id);
        toast({ title: 'Opportunity Deleted' });
        setAllOpportunities(prev => prev.filter(opp => opp.id !== id));
    };


    return (
        <TooltipProvider>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
                        <p className="text-muted-foreground">Visualize and manage your deal flow.</p>
                    </div>
                    <OpportunityFormDialog
                        dialogTrigger={<Button>Add Opportunity</Button>}
                        formAction={handleAddOpportunity}
                        salesCustomers={salesCustomers}
                        formType="add"
                    />
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="search-opps">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="search-opps"
                                    placeholder="Search by title or customer..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="customer-filter">Customer</Label>
                            <Select value={customerFilter} onValueChange={setCustomerFilter}>
                                <SelectTrigger id="customer-filter">
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Customers</SelectItem>
                                    {salesCustomers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
                
                <ClientOnly>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 overflow-x-auto pb-4">
                            {pipelineStages.map(stage => (
                                <Droppable key={stage.id} droppableId={stage.id} isDropDisabled={isPending || loading}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex flex-col min-w-[300px]"
                                        >
                                            <div className="flex items-center justify-between p-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h2 className="font-semibold">{stage.title}</h2>
                                                    <span className="text-sm text-muted-foreground">
                                                        ({filteredOpportunities.filter(o => o.stage === stage.id).length})
                                                    </span>
                                                </div>
                                                <OpportunityFormDialog
                                                    dialogTrigger={
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                    <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Add new opportunity to this stage</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    }
                                                    formAction={handleAddOpportunity}
                                                    salesCustomers={salesCustomers}
                                                    formType="add"
                                                    defaultStage={stage.id as Opportunity['stage']}
                                                />
                                            </div>
                                            <div className={`flex-1 rounded-lg p-2 space-y-4 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-accent' : 'bg-muted/50'}`}>
                                                {loading ? <p>Loading...</p> : 
                                                    filteredOpportunities.filter(o => o.stage === stage.id).length > 0 ? (
                                                        filteredOpportunities
                                                            .filter(opp => opp.stage === stage.id)
                                                            .sort((a,b) => (a.priority || 0) - (b.priority || 0))
                                                            .map((opp, index) => (
                                                                <Draggable key={opp.id} draggableId={opp.id} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                        >
                                                                            <OpportunityCard 
                                                                                opportunity={opp}
                                                                                isDragging={snapshot.isDragging}
                                                                                customerName={getCustomerName(opp.customerId)}
                                                                                salesCustomers={salesCustomers}
                                                                                onUpdate={handleUpdateOpportunity}
                                                                                onDelete={handleDeleteOpportunity}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-full">
                                                            <Presentation className="h-8 w-8 mb-2" />
                                                            <p className="text-sm">No opportunities in this stage.</p>
                                                        </div>
                                                    )
                                                }
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    </DragDropContext>
                </ClientOnly>
            </div>
        </TooltipProvider>
    );
}

function OpportunityCard({
    opportunity,
    isDragging,
    customerName,
    salesCustomers,
    onUpdate,
    onDelete,
}: {
    opportunity: Opportunity;
    isDragging: boolean;
    customerName: string;
    salesCustomers: Customer[];
    onUpdate: (id: string, data: OpportunityFormValues) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const { stageLastChanged, closeDate } = opportunity;
    
    const daysInStage = stageLastChanged ? Math.floor((new Date().getTime() - new Date(stageLastChanged).getTime()) / (1000 * 3600 * 24)) : 0;
    const isStalled = daysInStage > 14;

    const isOverdue = new Date(closeDate) < new Date();

    return (
        <Card className={cn('bg-background', isDragging && 'ring-2 ring-primary')}>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{opportunity.title}</CardTitle>
                    <OpportunityCardActions
                        opportunity={opportunity}
                        salesCustomers={salesCustomers}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        customerName={customerName}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm font-bold">₹{opportunity.value.toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">{customerName}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <Tooltip>
                        <TooltipTrigger>
                            <div className="flex items-center gap-1">
                                <Clock className={cn('h-3.5 w-3.5', isStalled && 'text-yellow-500')} />
                                <span>{daysInStage}d in stage</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>This deal has been in the current stage for {daysInStage} day(s).</p>
                        </TooltipContent>
                    </Tooltip>
                    
                    {isOverdue && (
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-1 text-destructive">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    <span>Overdue</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Expected close date ({new Date(closeDate).toLocaleDateString()}) is in the past.</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


function OpportunityCardActions({ opportunity, salesCustomers, onUpdate, onDelete, customerName }: {
    opportunity: Opportunity;
    salesCustomers: Customer[];
    onUpdate: (id: string, data: OpportunityFormValues) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    customerName: string;
}) {
    const [isDeleting, startDeleteTransition] = useTransition();
    const [isSummarizing, startSummaryTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = () => {
        startDeleteTransition(async () => {
            await onDelete(opportunity.id);
        });
    }
    
    const handleSummarize = () => {
        startSummaryTransition(async () => {
            try {
                const result = await summarizeOpportunity({
                    title: opportunity.title,
                    customerName: customerName,
                    value: opportunity.value,
                    stage: opportunity.stage,
                    closeDate: opportunity.closeDate,
                });
                toast({
                    title: "AI Opportunity Summary",
                    description: result.summary,
                    duration: 15000,
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate summary.'})
            }
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0 text-muted-foreground"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                 <CommunicationLogDialog
                    customerId={opportunity.customerId}
                    associatedWith={`Opportunity: ${opportunity.title}`}
                 />
                <DropdownMenuItem onClick={handleSummarize} disabled={isSummarizing}>
                    {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    AI Summary
                </DropdownMenuItem>
                <OpportunityFormDialog
                    formType="edit"
                    dialogTrigger={
                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                    }
                    formAction={(data) => onUpdate(opportunity.id, data)}
                    salesCustomers={salesCustomers}
                    initialData={opportunity}
                />
                <DropdownMenuSeparator />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the opportunity "{opportunity.title}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="animate-spin" /> : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const logFormSchema = z.object({
  type: z.enum(['Call', 'Email', 'Meeting']),
  summary: z.string().min(10, "Summary must be at least 10 characters long."),
});
type LogFormValues = z.infer<typeof logFormSchema>;

function CommunicationLogDialog({ customerId, associatedWith }: { customerId: string; associatedWith: string; }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const form = useForm<LogFormValues>({
        resolver: zodResolver(logFormSchema),
        defaultValues: { type: 'Call', summary: '' },
    });

    const onSubmit = (values: LogFormValues) => {
        startSubmitting(async () => {
            
            const newLog = {
                customerId,
                associatedWith,
                type: values.type,
                summary: values.summary,
                date: new Date().toISOString(),
            };
            try {
                const result = await addCommunicationLog(newLog as any);
                if(result.success) {
                    toast({ title: 'Log Added', description: 'The communication has been logged.' });
                    setOpen(false);
                    form.reset();
                } else {
                    throw new Error("Failed to add log");
                }
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to add log.' });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Log Activity
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log Activity</DialogTitle>
                    <DialogDescription>Log a call, email, or meeting for this opportunity.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Activity Type</Label>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Call">Call</SelectItem>
                                            <SelectItem value="Email">Email</SelectItem>
                                            <SelectItem value="Meeting">Meeting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Summary</Label>
                                    <FormControl><Textarea placeholder="e.g., Discussed pricing and next steps..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Log
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
