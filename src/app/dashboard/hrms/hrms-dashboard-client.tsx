

'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Users,
    UserCheck,
    UserX,
    CalendarClock,
    Cake,
    Sparkles
} from 'lucide-react';
import { HrmsAttendanceChart } from "./attendance-chart";
import type { getHrmsDashboardData } from './actions';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const iconMap: { [key: string]: React.ElementType } = {
    Users,
    UserCheck,
    UserX,
    CalendarClock,
};

type DashboardData = Awaited<ReturnType<typeof getHrmsDashboardData>>;

interface HrmsDashboardClientProps {
    dashboardData: DashboardData;
}

export function HrmsDashboardClient({ dashboardData }: HrmsDashboardClientProps) {
  const { kpis, upcomingEvents } = dashboardData;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HRMS Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your organization's human resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const KpiIcon = iconMap[kpi.icon as keyof typeof iconMap] || Users;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <KpiIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Birthdays &amp; Anniversaries</CardTitle>
            <CardDescription>Events in the next 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                    {upcomingEvents.map((event: any, index: number) => (
                        <div key={event.id + index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                             <Avatar>
                                <AvatarImage src={`https://picsum.photos/seed/${event.id}/40/40`} data-ai-hint="person" />
                                <AvatarFallback>{event.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-medium">{event.name}</p>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                   {event.type === 'Birthday' ? (
                                        <Cake className="h-4 w-4 text-pink-500" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <span>
                                        {event.type} {event.type === 'Anniversary' && `(${event.years} years)`}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-right">
                                {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="flex items-center justify-center h-[350px]">
                    <p className="text-muted-foreground">No upcoming events in the next 30 days.</p>
                </div>
            )}
          </CardContent>
        </Card>
       </div>
    </div>
  );
}
