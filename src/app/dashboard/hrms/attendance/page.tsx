

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock, UserCheck, UserX, PowerOff } from 'lucide-react';
import { getAttendanceData } from '../actions';
import { Badge } from '@/components/ui/badge';
import type { Staff, Shift } from '@/lib/mock-data/types';
import { Suspense, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const shiftTypes = ['Morning', 'Evening', 'Night'];

function AttendanceDashboard() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getAttendanceData();
      setShifts(data.shifts);
      setAttendance(data.attendance);
      setLoading(false);
    }
    loadData();
  }, []);
  
  const getStatusIcon = (status: Staff['status'] | 'Not Clocked In') => {
    switch (status) {
        case 'Clocked In': return <UserCheck className='h-4 w-4 text-green-500' />;
        case 'On Break': return <Clock className='h-4 w-4 text-yellow-500' />;
        case 'Clocked Out': return <UserX className='h-4 w-4 text-red-500' />;
        default: return <PowerOff className='h-4 w-4 text-muted-foreground' />;
    }
  }

  const handleShiftChange = (employeeId: string, day: string, newShift: string) => {
    // This is a placeholder for a future server action to update the shift
    console.log(`Updating shift for ${employeeId} on ${day} to ${newShift}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar /> Attendance &amp; Shifts
        </h1>
        <p className="text-muted-foreground">
          Manage weekly shift schedules and track employee attendance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Shift Schedule</CardTitle>
          <CardDescription>
            A visual overview of the upcoming week's shift roster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 font-semibold text-left">Employee</th>
                  {daysOfWeek.map(day => (
                    <th key={day} className="p-2 font-semibold text-center min-w-[120px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* This will be empty initially as we have no staff */}
              </tbody>
            </table>
          </div>
            <div className="text-center text-muted-foreground p-8">
                <p>Add employees in the HRMS Employee Directory to manage their shifts here.</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Live Attendance</CardTitle>
          <CardDescription>
            Live status of employee attendance for today.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16" />) :
             attendance.length > 0 ? attendance.map(emp => (
                <div key={emp.staffId} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getStatusIcon(emp.status)}
                    <div>
                        <p className="font-medium">{emp.name}</p>
                        <Badge variant={emp.status === 'Clocked In' ? 'default' : 'secondary'} className='text-xs'>{emp.status}</Badge>
                    </div>
                </div>
            )) : <p className="text-muted-foreground col-span-3 text-center p-8">No attendance data for today yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
        </div>
    )
}

export default function HrmsAttendancePage() {
    return (
        <Suspense fallback={<AttendanceSkeleton />}>
            <AttendanceDashboard />
        </Suspense>
    )
}


