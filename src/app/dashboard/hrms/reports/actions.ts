

'use server';

import { differenceInDays, isWithinInterval } from 'date-fns';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

// Wrapper: call the sales implementation so this module exports an async function (required in 'use server' files).
import { generateMonthlySnapshot as salesGenerateMonthlySnapshot } from '@/app/dashboard/sales/reports/actions';

export async function generateMonthlySnapshot() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

  return salesGenerateMonthlySnapshot();
}

export async function getHrmsReportData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

  // --- KPI Cards Data ---
  const totalEmployees = 0;
  const departments = 0;
  const monthlyAttrition = '1.2%'; // Mocked value as it requires historical data

  const kpis = [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: 'Users' },
    { title: 'Departments', value: departments.toString(), icon: 'Briefcase' },
    { title: 'Monthly Attrition', value: monthlyAttrition, icon: 'UserX' },
  ];

  // --- Headcount by Department Chart ---
  const headcountByDept: Record<string, number> = {};
  
  const headcountData = Object.entries(headcountByDept).map(([name, count]) => ({ name, count }));

  // --- Leave Consumption Chart ---
  const leaveConsumption = {} as Record<string, number>;

  const leaveData = Object.entries(leaveConsumption)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  return { kpis, headcountData, leaveData };
}

type ReportType = 'leave_report';

export async function generateHrmsReport(
  reportType: ReportType,
  dateRange: { from: Date, to: Date }
): Promise<string> {
  let csvData = '';
  let headers: string[] = [];
  let rows: string[][] = [];

  switch (reportType) {
    case 'leave_report':
      headers = ['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Duration (Days)', 'Reason', 'Status', 'Applied On'];
      rows = [];
      break;
    
    // Future cases for other reports (payroll, etc.) can be added here
    default:
      throw new Error("Unsupported report type");
  }

  csvData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvData;
}

