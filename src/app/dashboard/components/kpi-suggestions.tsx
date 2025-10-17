
'use client';

import { useState } from 'react';
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
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Lightbulb } from 'lucide-react';
import type { SuggestKpisBasedOnPerformanceOutput } from '@/ai/flows/suggest-kpis-based-on-performance';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
// Use a client->server API instead of importing server-only code to avoid bundling server libs
async function suggestKpisApi(values: any): Promise<SuggestKpisBasedOnPerformanceOutput> {
  const res = await fetch('/api/ai/suggest-kpis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to generate suggestions');
  }
  return res.json();
}


const formSchema = z.object({
  moduleName: z.string().min(1, 'Please select a module.'),
  currentPerformanceData: z.string().min(1, 'Current performance data is required.'),
  pastKpiPerformance: z.string().optional(),
  externalData: z.string().optional(),
});

const moduleOptions = [
  'Vendor Management', 'Inventory Management', 'Sales Management', 
  'HRMS', 'Supply Chain Management'
];

const placeholders = {
  currentPerformanceData: 'e.g., {"monthly_sales": 120000, "customer_churn_rate": 0.05, "avg_resolution_time": "24h"}',
  pastKpiPerformance: 'e.g., {"q1_revenue_growth": 0.1, "q1_customer_satisfaction": 4.2}',
  externalData: 'e.g., {"market_trends": "Increased demand for sustainable products", "competitor_pricing": "10% lower"}',
};

export function KpiSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestKpisBasedOnPerformanceOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleName: 'Sales Management',
      currentPerformanceData: '{"monthly_sales": 150000, "customer_acquisition_cost": 120, "avg_deal_size": 2500, "lead_conversion_rate": 0.15}',
      pastKpiPerformance: '{"q1_revenue_growth": 0.08, "q1_conversion_rate": 0.22}',
      externalData: '{"market_trends": "Growing adoption of cloud services", "competitor_activity": "Launch of a new pricing model"}',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const apiValues = {
        ...values,
        pastKpiPerformance: values.pastKpiPerformance || '{}',
        externalData: values.externalData || '{}',
      };
  const result = await suggestKpisApi(apiValues);
      setSuggestions(result);
      if(result.length === 0){
        toast({
            title: 'No Suggestions Found',
            description: 'The AI could not generate suggestions based on the provided data. Try providing more context.',
        });
      }
    } catch (error) {
      setSuggestions(null);
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate KPI suggestions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="text-accent" />
          AI-Powered KPI Suggestions
        </CardTitle>
        <CardDescription>
          Get intelligent KPI recommendations based on your module's performance data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="moduleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a module" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {moduleOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPerformanceData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Performance (JSON)</FormLabel>
                  <FormControl>
                    <Textarea placeholder={placeholders.currentPerformanceData} {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="pastKpiPerformance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Past KPI Performance (JSON, Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder={placeholders.pastKpiPerformance} {...field} rows={2}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="externalData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External Data (JSON, Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder={placeholders.externalData} {...field} rows={2}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Suggestions'}
            </Button>
          </form>
        </Form>

        {isLoading && (
            <div className="mt-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">The AI is analyzing your data...</p>
            </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Suggested KPIs</h3>
            <ScrollArea className="h-96 pr-4 -mr-4">
              <div className="space-y-4">
                {suggestions.map((kpi, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardHeader className='p-4'>
                      <CardTitle className="text-base">{kpi.kpiName}</CardTitle>
                      <CardDescription>Target: {kpi.target}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 p-4 pt-0">
                      <p><strong className="font-medium text-muted-foreground">Description:</strong> {kpi.description}</p>
                      <p><strong className="font-medium text-muted-foreground">Rationale:</strong> {kpi.rationale}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
