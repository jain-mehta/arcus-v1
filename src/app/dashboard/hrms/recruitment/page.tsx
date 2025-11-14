

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, PlusCircle, Edit, UserPlus, GripVertical, View } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { JobOpening, Applicant, ApplicantStageName } from './actions';
import { JobDialog, type JobOpeningFormValues, JobDetailDialog } from './job-dialog';
import { useState, useEffect, useTransition, useCallback } from 'react';
import { createJobOpening, getJobOpenings, updateJobOpening, getApplicants, addApplicant, updateApplicantStage } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';


const initialColumns: Record<ApplicantStageName, { id: ApplicantStageName; title: string; applicants: Applicant[] }> = {
  Applied: { id: 'Applied', title: 'Applied', applicants: [] },
  Screening: { id: 'Screening', title: 'Screening', applicants: [] },
  Interview: { id: 'Interview', title: 'Interview', applicants: [] },
  Offer: { id: 'Offer', title: 'Offer', applicants: [] },
  Hired: { id: 'Hired', title: 'Hired', applicants: [] },
  Rejected: { id: 'Rejected', title: 'Rejected', applicants: [] },
  applied: { id: 'applied', title: 'Applied', applicants: [] },
  screening: { id: 'screening', title: 'Screening', applicants: [] },
  interview: { id: 'interview', title: 'Interview', applicants: [] },
  offer: { id: 'offer', title: 'Offer', applicants: [] },
  hired: { id: 'hired', title: 'Hired', applicants: [] },
  rejected: { id: 'rejected', title: 'Rejected', applicants: [] },
};

const pipelineStages = Object.values(initialColumns);

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


export default function HrmsRecruitmentPage() {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [columns, setColumns] = useState(initialColumns);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [isUpdating, startUpdating] = useTransition();

  const selectedJob = jobOpenings.find(j => j.id === selectedJobId);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const response = await getJobOpenings();
        const jobs = response.success && response.data ? response.data : [];
        setJobOpenings(jobs);
        if (jobs.length > 0 && !selectedJobId) {
            setSelectedJobId(jobs[0].id);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load job openings.' });
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [selectedJobId]);

  const fetchApplicants = useCallback(async () => {
    if (!selectedJobId) {
        setColumns(initialColumns);
        return;
    }
    setLoadingApplicants(true);
    try {
        const response = await getApplicants(selectedJobId);
        const allApplicants = response.success && response.data ? response.data : [];
        const newColumns: Record<string, { id: string; title: string; applicants: Applicant[] }> = JSON.parse(JSON.stringify(initialColumns));
        allApplicants.forEach((applicant: Applicant) => {
            if (applicant.stage && newColumns[applicant.stage.toLowerCase()]) {
                newColumns[applicant.stage.toLowerCase()].applicants.push(applicant);
            }
        });
        setColumns(newColumns as typeof initialColumns);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load applicants.' });
    } finally {
        setLoadingApplicants(false);
    }
  }, [selectedJobId, toast]);

  useEffect(() => {
    fetchApplicants();
  }, [selectedJobId, fetchApplicants]);
  
  const handleSaveJob = async (data: JobOpeningFormValues, jobId?: string): Promise<boolean> => {
    try {
      const transformedData = {
        ...data,
        responsibilities: data.responsibilities.map(r => r.value),
        qualifications: data.qualifications.map(q => q.value),
      };

      if (jobId) { // Edit mode
        const result = await updateJobOpening(jobId, transformedData);
        if (result.success && result.data) {
          setJobOpenings(prev => prev.map(job => job.id === jobId ? result.data as JobOpening : job));
          toast({ title: 'Job Updated' });
          return true;
        } else {
          throw new Error(result.message);
        }
      } else { // Add mode
        const result = await createJobOpening(transformedData);
        if (result.success && result.data) {
          setJobOpenings(prev => [result.data as JobOpening, ...prev]);
          toast({ title: 'Job Posted' });
          return true;
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save job opening.' });
      return false;
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
    }
    
    const startColKey = source.droppableId as unknown as ApplicantStageName;
    const endColKey = destination.droppableId as unknown as ApplicantStageName;
    const startCol = columns[startColKey];
    const endCol = columns[endColKey];

    if (!startCol || !endCol) return;

    const startApplicants = Array.from(startCol.applicants);
    const [movedApplicant] = startApplicants.splice(source.index, 1);
    
    if (!movedApplicant) return;

    const originalColumns = columns;
    
    // Create a new state object for optimistic update
    const newColumnsState = { ...columns };
    
    // Update source column
    newColumnsState[startColKey] = {
      ...startCol,
      applicants: startApplicants
    };

    // Update destination column
    const endApplicants = startCol.id === endCol.id ? startApplicants : Array.from(endCol.applicants);
    endApplicants.splice(destination.index, 0, { ...movedApplicant, stage: endColKey.toLowerCase() });
    newColumnsState[endColKey] = {
      ...endCol,
      applicants: endApplicants
    };
    
    // Optimistically update the UI
    setColumns(newColumnsState);

    startUpdating(async () => {
        try {
            const result = await updateApplicantStage(draggableId, destination.droppableId);
            if (!result.success) throw new Error(result.error || 'Failed to update');
            toast({ title: `Moved ${movedApplicant.name} to ${destination.droppableId}` });
        } catch (error: any) {
            setColumns(originalColumns); // Revert to the state before the optimistic update
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    });
};

  const handleApplicantAdded = (newApplicant: Applicant) => {
    setColumns(prev => {
        const newColumns = { ...prev };
        newColumns.Applied.applicants = [newApplicant, ...newColumns.Applied.applicants];
        return newColumns;
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban /> Recruitment &amp; ATS
          </h1>
          <p className="text-muted-foreground">
            Manage job openings and track applicants through the hiring pipeline.
          </p>
        </div>
        <JobDialog
            mode="add"
            onSave={handleSaveJob}
            triggerButton={
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Post New Job
                </Button>
            }
        />
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Applicant Tracking Board</CardTitle>
          <CardDescription>
            A Kanban board for visualizing the applicant pipeline. Select a job to view candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {loading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-28" />) :
                 jobOpenings.map(job => (
                    <Card key={job.id} onClick={() => setSelectedJobId(job.id)} className={`cursor-pointer ${selectedJobId === job.id ? 'border-primary ring-2 ring-primary' : 'hover:border-muted-foreground/50'}`}>
                        <CardHeader className="flex flex-row items-start justify-between">
                             <div>
                                <CardTitle className='text-lg'>{job.title}</CardTitle>
                                <CardDescription>{job.department} - {job.location}</CardDescription>
                             </div>
                             <div className="flex items-center">
                                {selectedJobId === job.id && (
                                     <JobDetailDialog job={job as any} triggerButton={
                                        <Button variant="ghost" size="icon" className='h-7 w-7' onClick={(e) => e.stopPropagation()}>
                                            <View className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    } />
                                )}
                                <JobDialog 
                                    mode="edit"
                                    job={job as any}
                                    onSave={handleSaveJob}
                                    triggerButton={
                                        <Button variant="ghost" size="icon" className='h-7 w-7' onClick={(e) => e.stopPropagation()}>
                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    }
                                />
                             </div>
                        </CardHeader>
                        <CardContent>
                             <Badge variant={job.status === 'open' || job.status === 'Open' ? 'default' : 'secondary'}>
                                {job.status}
                            </Badge>
                        </CardContent>
                    </Card>
                 ))}
                 {jobOpenings.length === 0 && !loading && <p className="text-muted-foreground col-span-3 text-center p-8">No job openings posted yet.</p>}
            </div>
            
            <ClientOnly>
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="flex gap-4 overflow-x-auto p-2 border rounded-lg bg-muted/50 min-h-[400px]">
                      {Object.values(columns).map((column: any) => (
                        <Droppable key={column.id} droppableId={column.id} isCombineEnabled={false} isDropDisabled={loadingApplicants || isUpdating}>
                          {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="w-72 flex-shrink-0"
                              >
                                  <div className="flex justify-between items-center mb-4">
                                      <h3 className="font-semibold">{column.title} <Badge variant="secondary" className="ml-2">{column.applicants.length}</Badge></h3>
                                      <AddApplicantDialog
                                        job={selectedJob}
                                        onApplicantAdded={handleApplicantAdded}
                                        triggerButton={
                                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!selectedJobId || column.id !== 'Applied'}>
                                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        }
                                      />
                                  </div>
                                  <div className="space-y-3">
                                      {loadingApplicants ? Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                                      : column.applicants.length > 0 ? column.applicants.map((applicant: Applicant, index: number) => (
                                          <Draggable key={applicant.id} draggableId={applicant.id} index={index}>
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                              >
                                                <Link href={`/dashboard/hrms/recruitment/applicants/${applicant.id}`}>
                                                    <Card className="p-3 bg-background hover:bg-accent transition-colors">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={`https://picsum.photos/seed/${applicant.id}/32/32`} data-ai-hint="person" />
                                                                    <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-semibold text-sm">{applicant.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{applicant.email}</p>
                                                                </div>
                                                            </div>
                                                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                                        </div>
                                                    </Card>
                                                </Link>
                                              </div>
                                            )}
                                          </Draggable>
                                      )) : <p className="text-xs text-muted-foreground text-center pt-8">No applicants</p>}
                                      {provided.placeholder}
                                  </div>
                              </div>
                          )}
                        </Droppable>
                      ))}
                  </div>
                </DragDropContext>
            </ClientOnly>
        </CardContent>
      </Card>
    </div>
  );
}

const applicantSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional(),
});
type ApplicantFormValues = z.infer<typeof applicantSchema>;

function AddApplicantDialog({ job, onApplicantAdded, triggerButton }: { job?: JobOpening | null, onApplicantAdded: (newApplicant: Applicant) => void, triggerButton: React.ReactNode }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startSubmitting] = useTransition();

    const form = useForm<ApplicantFormValues>({
        resolver: zodResolver(applicantSchema),
    });

    const handleSubmit = async (values: ApplicantFormValues) => {
        if (!job) return;
        startSubmitting(async () => {
            try {
                // construct payload and cast to the expected param type to avoid excess property errors
                const payload = { ...values, jobId: job.id } as unknown as Omit<Applicant, "id" | "organization_id" | "applied_at">;
                const result = await addApplicant(payload);
                if (result.success && result.data) {
                    onApplicantAdded(result.data as Applicant);
                    toast({ title: "Applicant Added" });
                    setOpen(false);
                    form.reset();
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Error", description: error.message });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Applicant</DialogTitle>
                    <DialogDescription>Manually add a new candidate for: {job?.title}</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                                Add Applicant
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


