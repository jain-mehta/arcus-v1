

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Target, Trash2, Loader2, Archive } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { addSalesTarget, deleteSalesTarget, getSalesTargetsWithProgress, archiveOldOpportunities } from './actions';
import type { SalesTargetWithProgress } from '@/lib/firebase/types';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const targetSchema = z.object({
  type: z.enum(['Revenue', 'Leads', 'Deals']),
  value: z.coerce.number().min(1, 'Target value is required.'),
  month: z.string().min(1, 'Month is required.'),
});

type TargetFormValues = z.infer<typeof targetSchema>;


export default function SalesSettingsPage() {
  const { toast } = useToast();
  const [targets, setTargets] = useState<SalesTargetWithProgress[]>([]);
  const [isSubmitting, startFormTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isArchiving, startArchiving] = useTransition();
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    async function loadTargets() {
        setLoading(true);
        try {
            const targetsWithProgress = await getSalesTargetsWithProgress();
            setTargets(targetsWithProgress);
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to load sales targets.' });
        } finally {
            setLoading(false);
        }
    }
    loadTargets();
  }, [toast]);

  const defaultMonth = new Date().toLocaleString('en-CA', { year: 'numeric', month: 'long' }).replace(' ', ' ');
  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      type: 'Revenue',
      value: 1000000,
      month: defaultMonth,
    },
  });

  async function onSubmit(data: TargetFormValues) {
    startFormTransition(async () => {
        try {
            await addSalesTarget(data);
            const updatedTargets = await getSalesTargetsWithProgress();
            setTargets(updatedTargets);
            toast({
                title: 'Target Set!',
                description: `${data.type} target for ${data.month} has been set to ${data.value}.`,
            });
            form.reset();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to set target.' });
        }
    });
  }

  async function handleRemoveTarget(id: string) {
    startDeleteTransition(async () => {
        try {
            await deleteSalesTarget(id);
            setTargets((prev) => prev.filter((t) => t.id !== id));
            toast({
                title: 'Target Removed',
                description: 'The sales target has been removed.',
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove target.' });
        }
    });
  };

  const handleArchive = () => {
    startArchiving(async () => {
      try {
        const result = await archiveOldOpportunities();
        if (result.success) {
          toast({
            title: 'Archiving Complete',
            description: `${result.count} old opportunities have been archived.`
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Archiving Failed',
            description: result.message
          });
        }
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An unexpected error occurred during archiving.'
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Target className="h-7 w-7" />
          <h1 className="text-3xl font-bold tracking-tight">Sales Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Set monthly sales targets and manage data retention policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Sales Targets</CardTitle>
              <CardDescription>
                An overview of the current sales targets for this period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Goal / Current</TableHead>
                    <TableHead className="w-[150px]">Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                     Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-8" /></TableCell>
                        </TableRow>
                     ))
                  ) : targets.length > 0 ? (
                    targets.map((target) => (
                      <TableRow key={target.id}>
                        <TableCell className="font-medium">
                          {target.type}
                        </TableCell>
                        <TableCell>{target.month}</TableCell>
                        <TableCell>
                          {target.type === 'Revenue' ? `₹${target.currentValue.toLocaleString('en-IN')}` : target.currentValue}
                           / {target.type === 'Revenue' ? `₹${target.value.toLocaleString('en-IN')}` : target.value}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={target.progress} className="w-full" />
                            <span className="text-xs text-muted-foreground">
                              {target.progress.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTarget(target.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center"
                      >
                        No sales targets set yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
            <Card>
            <CardHeader>
                <CardTitle>Set New Target</CardTitle>
                <CardDescription>
                Define a new target for the sales team.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Target Type</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Revenue">Revenue</SelectItem>
                            <SelectItem value="Leads">Leads Generated</SelectItem>
                            <SelectItem value="Deals">Deals Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Target Value</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Month</FormLabel>
                        <FormControl>
                            <Input type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Set Target
                    </Button>
                </CardFooter>
                </form>
            </Form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>
                        Manage data retention and archiving policies.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Archive opportunities that were closed (won or lost) over a year ago. This helps keep the main pipeline view clean and performant.
                    </p>
                    <Button variant="outline" onClick={handleArchive} disabled={isArchiving}>
                        {isArchiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                        Archive Old Opportunities
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
