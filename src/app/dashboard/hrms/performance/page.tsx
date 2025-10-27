
'use client';

export const dynamic = 'force-dynamic';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Target, PlusCircle, Edit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { getPerformanceCycles, startNewPerformanceCycle } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for demonstration purposes
const mockKpis = [
  {
    id: 'kpi-1',
    name: 'Customer Satisfaction (CSAT)',
    target: '4.5 / 5',
    description: 'Average customer rating on post-interaction surveys.',
    department: 'Sales',
  },
  {
    id: 'kpi-2',
    name: 'On-Time Delivery Rate',
    target: '98%',
    description: 'Percentage of orders delivered on or before the promised date.',
    department: 'Supply Chain',
  },
  {
    id: 'kpi-3',
    name: 'Employee Turnover Rate',
    target: '< 10% Annually',
    description: 'Rate at which employees leave the company voluntarily.',
    department: 'HRMS',
  },
];

export default function HrmsPerformancePage() {
  const { toast } = useToast();
  const [isStartingCycle, startCycleTransition] = useTransition();
  const [reviewCycles, setReviewCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
        setLoading(true);
        const cycles = await getPerformanceCycles();
        setReviewCycles(cycles);
        setLoading(false);
    }
    loadData();
  }, []);
  
  const handleStartCycle = () => {
    startCycleTransition(async () => {
        const newCycle = {
            id: `cycle-${Date.now()}`,
            name: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()} Performance Review`,
            status: 'In Progress',
            startDate: new Date().toISOString(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
            participants: 150, // This would be dynamic in a real app
            completion: 0,
        };

        const result = await startNewPerformanceCycle(newCycle);
        if (result.success) {
            setReviewCycles(prev => [newCycle, ...prev]);
            toast({
                title: "Review Cycle Started",
                description: "A new performance review cycle has been initiated."
            });
        } else {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to start a new cycle.'});
        }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Target /> Performance Management
        </h1>
        <p className="text-muted-foreground">
          Define KPIs, manage review cycles, and track employee performance.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Key Performance Indicators (KPIs)</CardTitle>
            <CardDescription>
              A list of defined KPIs for tracking performance across departments.
            </CardDescription>
          </div>
          <Button disabled>
            <PlusCircle className="mr-2" /> Add New KPI
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">KPI Name</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockKpis.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell className="font-medium">{kpi.name}</TableCell>
                  <TableCell>{kpi.target}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{kpi.department}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-sm">
                    {kpi.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Performance Review Cycles</CardTitle>
            <CardDescription>
              Manage quarterly or annual performance review cycles for your team.
            </CardDescription>
          </div>
          <Button onClick={handleStartCycle} disabled={isStartingCycle}>
            {isStartingCycle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Start New Cycle
          </Button>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="w-[200px]">Completion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                     Array.from({length: 2}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className='h-8' /></TableCell></TableRow>)
                ) : reviewCycles.length > 0 ? (
                    reviewCycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">{cycle.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cycle.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                            <Progress value={cycle.completion} className="w-full" />
                            <span>{cycle.completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/hrms/performance/${cycle.id}`}>View Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No review cycles have been started yet.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

