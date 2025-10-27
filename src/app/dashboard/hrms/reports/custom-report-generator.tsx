

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, Download, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { generateHrmsReport } from './actions';

const reportSchema = z.object({
  reportType: z.enum(['leave_report']),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function CustomReportGenerator() {
  const { toast } = useToast();
  const [isGenerating, startGeneration] = useTransition();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: 'leave_report',
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
  });

  const onSubmit = (values: ReportFormValues) => {
    startGeneration(async () => {
      try {
        const csvData = await generateHrmsReport(values.reportType, values.dateRange);
        
        // Create a blob and trigger download
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${values.reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Report Generated",
            description: "Your report has been downloaded successfully."
        });

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to generate the report.',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Report Generator</CardTitle>
        <CardDescription>
          Generate and download custom HR reports in CSV format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row items-end gap-4">
             <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className='w-full md:w-48'><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="leave_report">Leave Report</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Range</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={'outline'} className={cn('w-full md:w-[300px] justify-start text-left font-normal', !field.value.from && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (field.value.to ? (<>{format(field.value.from, 'PPP')} - {format(field.value.to, 'PPP')}</>) : (format(field.value.from, 'PPP'))) : (<span>Pick a date range</span>)}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar initialFocus mode="range" numberOfMonths={2} defaultMonth={field.value.from} selected={field.value} onSelect={field.onChange} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Generate & Download CSV
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    
