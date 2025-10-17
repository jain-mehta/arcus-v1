
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { BarChart2, Users, Briefcase, UserX } from 'lucide-react';
import { getHrmsReportData } from "./actions";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HeadcountChart, LeaveChart } from "./charts";
import { CustomReportGenerator } from "./custom-report-generator";

const iconMap = {
    Users,
    Briefcase,
    UserX,
};

async function HrmsReports() {
    const { kpis, headcountData, leaveData } = await getHrmsReportData();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart2 /> Reports & Analytics
                </h1>
                <p className="text-muted-foreground">
                Analyze workforce data and gain insights into HR metrics.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi) => {
                    const KpiIcon = iconMap[kpi.icon as keyof typeof iconMap] || BarChart2;
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
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                <CardHeader>
                    <CardTitle>Headcount by Department</CardTitle>
                    <CardDescription>Current employee distribution across departments.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <HeadcountChart data={headcountData} />
                </CardContent>
                </Card>
                <Card>
                <CardHeader>
                    <CardTitle>Leave Consumption Analysis</CardTitle>
                    <CardDescription>Breakdown of approved leave days taken by type.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                    <LeaveChart data={leaveData} />
                </CardContent>
                </Card>
            </div>

            <CustomReportGenerator />
            </div>
    )
}


function ReportsSkeleton() {
    return (
         <div className="space-y-8">
            <Skeleton className="h-12 w-1/3" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-48" />
        </div>
    )
}

export default function HrmsReportsPage() {
    return (
        <Suspense fallback={<ReportsSkeleton />}>
            <HrmsReports />
        </Suspense>
    )
}
