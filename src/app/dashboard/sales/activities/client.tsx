
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Phone, Mail, Users, Calendar as CalendarIcon } from "lucide-react";
import type { CommunicationLog } from '@/lib/firebase/types';
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'Call': return <Phone className="h-4 w-4 text-muted-foreground" />;
        case 'Email': return <Mail className="h-4 w-4 text-muted-foreground" />;
        case 'Meeting': return <Users className="h-4 w-4 text-muted-foreground" />;
        default: return <History className="h-4 w-4 text-muted-foreground" />;
    }
}

interface SalesActivitiesClientProps {
    initialActivities: CommunicationLog[];
}

export function SalesActivitiesClient({ initialActivities }: SalesActivitiesClientProps) {
  const [salesActivities, setSalesActivities] = useState<CommunicationLog[]>(initialActivities);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();


  const filteredActivities = useMemo(() => {
    if (!dateRange?.from) return salesActivities;
    return salesActivities.filter(activity => {
      const activityDate = new Date(activity.date);
      const from = dateRange.from ? new Date(dateRange.from) : null;
      const to = dateRange.to ? new Date(dateRange.to) : null;

      if(from) from.setHours(0,0,0,0);
      if(to) to.setHours(23,59,59,999);

      let inRange = true;
      if (from) inRange = inRange && activityDate >= from;
      if (to) inRange = inRange && activityDate <= to;
      return inRange;
    });
  }, [salesActivities, dateRange]);


  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
            <History className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Sales Activities Log</h1>
        </div>
        <p className="text-muted-foreground">A complete log of all sales-related interactions.</p>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Filter Activities</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-4">
               <div className="grid w-full max-w-sm items-center gap-1.5">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
               </div>
                <Button variant="ghost" onClick={() => setDateRange(undefined)}>Clear</Button>
          </CardContent>
      </Card>

       <Card>
        <CardHeader>
            <CardTitle>Activity Stream</CardTitle>
            <CardDescription>A chronological list of all calls, emails, and meetings.</CardDescription>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Associated With</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map(activity => (
                        <TableRow key={activity.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {getActivityIcon(activity.type)}
                                    <span>{activity.type}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-sm">{activity.summary}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{activity.associatedWith || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>{activity.user}</TableCell>
                            <TableCell className="text-right">{new Date(activity.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No sales activities found for the selected criteria.
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
