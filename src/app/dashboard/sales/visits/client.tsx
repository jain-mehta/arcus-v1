
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MapPin, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Visit } from '@/lib/firebase/types';
import { logVisit } from '../actions';
import { useRouter } from 'next/navigation';

const visitSchema = z.object({
  dealerId: z.string().min(1, 'Please select a dealer.'),
  visitDate: z.date({
    required_error: 'A visit date is required.',
  }),
  purpose: z
    .enum([
      'Relationship',
      'New Business',
      'Complaint',
      'Payment Collection',
      'Other',
    ])
    .refine((val) => val !== undefined, 'Please select a purpose.'),
  outcome: z.string().min(10, 'Please provide a brief outcome of the visit.'),
  feedback: z.string().optional(),
  nextFollowUpDate: z.date().optional(),
});

type VisitFormValues = z.infer<typeof visitSchema>;

interface VisitLoggingClientProps {
  dealers: { id: string; name: string }[];
  initialVisits: Visit[];
}

export function VisitLoggingClient({ dealers, initialVisits }: VisitLoggingClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [visits, setVisits] = useState<Visit[]>(initialVisits);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      dealerId: '',
      visitDate: new Date(),
      outcome: '',
      feedback: '',
    },
  });

  async function onSubmit(values: VisitFormValues) {
    startTransition(async () => {
        const dealerName = dealers.find(d => d.id === values.dealerId)?.name || '';
        const submissionData = {
            ...values,
            dealerName: dealerName,
            visitDate: values.visitDate.toISOString(),
            nextFollowUpDate: values.nextFollowUpDate?.toISOString(),
        };

        try {
            const result = await logVisit(submissionData);
            if (result.success && 'visit' in result && result.visit) {
                toast({
                    title: 'Visit Logged!',
                    description: `Your visit with ${dealerName} has been recorded.`,
                });
                setVisits(prev => [result.visit, ...prev]);
                form.reset();
                 form.setValue('visitDate', new Date());
            } else {
                const msg = (result as any).message || 'Failed to log visit.';
                throw new Error(msg);
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to log visit. Please try again.',
            });
        }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Log a Dealer Visit</h1>
        </div>
        <p className="text-muted-foreground">
          Record your interactions and outcomes from on-site dealer visits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Visit Entry</CardTitle>
          <CardDescription>
            Fill in the details of your visit. Fields marked with an asterisk
            are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="dealerId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Dealer *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select the dealer you visited" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {dealers.map((dealer) => (
                                    <SelectItem key={dealer.id} value={dealer.id}>
                                    {dealer.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="visitDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Visit Date *</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={'outline'}
                                    className={cn(
                                        'pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, 'PPP')
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date > new Date() || date < new Date('1900-01-01')
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                 <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Purpose of Visit *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select the main purpose of your visit" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Relationship">Relationship Building</SelectItem>
                                <SelectItem value="New Business">New Business/Pitch</SelectItem>
                                <SelectItem value="Complaint">Complaint Resolution</SelectItem>
                                <SelectItem value="Payment Collection">Payment Collection</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Outcome *</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Briefly describe the outcome of the visit, actions taken, or decisions made."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Dealer Feedback (Optional)</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Any specific feedback, complaints, or suggestions from the dealer."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="nextFollowUpDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col max-w-sm">
                        <FormLabel>Next Follow-up Date (Optional)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn(
                                    'pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                )}
                                >
                                {field.value ? (
                                    format(field.value, 'PPP')
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log Visit
                </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Recent Visit History</CardTitle>
            <CardDescription>Your most recently logged dealer visits.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Dealer</TableHead>
                        <TableHead>Visit Date</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Next Follow-up</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visits.length > 0 ? (
                        visits.map(visit => (
                            <TableRow key={visit.id}>
                                <TableCell className='font-medium'>{visit.dealerName}</TableCell>
                                <TableCell>{new Date(visit.visitDate).toLocaleDateString()}</TableCell>
                                <TableCell>{visit.purpose}</TableCell>
                                <TableCell className='text-muted-foreground max-w-xs'>{visit.outcome}</TableCell>
                                <TableCell>{visit.nextFollowUpDate ? new Date(visit.nextFollowUpDate).toLocaleDateString() : 'N/A'}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">No visits logged yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
