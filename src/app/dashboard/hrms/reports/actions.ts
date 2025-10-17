

'use server';

import { MOCK_USERS, MOCK_LEAVE_REQUESTS, MOCK_ROLES } from '@/lib/firebase/firestore';
import type { LeaveType, LeaveRequest } from '@/lib/firebase/types';
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
  const totalEmployees = MOCK_USERS.length;
  const departments = new Set(MOCK_ROLES.map(r => r.name.replace(' Head', '').replace(' Executive', '').replace(' Supervisor', ''))).size;
  const monthlyAttrition = '1.2%'; // Mocked value as it requires historical data

  const kpis = [
    { title: 'Total Employees', value: totalEmployees.toString(), icon: 'Users' },
    { title: 'Departments', value: departments.toString(), icon: 'Briefcase' },
    { title: 'Monthly Attrition', value: monthlyAttrition, icon: 'UserX' },
  ];

  // --- Headcount by Department Chart ---
  const headcountByDept: Record<string, number> = {};
  MOCK_USERS.forEach(user => {
    const roleId = user.roleIds[0];
    const role = MOCK_ROLES.find(r => r.id === roleId);
    const dept = role ? role.name.replace(' Head', '').replace(' Executive', '').replace(' Supervisor', '') : 'Unassigned';
    headcountByDept[dept] = (headcountByDept[dept] || 0) + 1;
  });

  const headcountData = Object.entries(headcountByDept).map(([name, count]) => ({ name, count }));

  // --- Leave Consumption Chart ---
  const leaveConsumption = MOCK_LEAVE_REQUESTS.reduce((acc, req) => {
    if (req.status === 'Approved') {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const days = differenceInDays(end, start) + 1;
        acc[req.type] = (acc[req.type] || 0) + days;
    }
    return acc;
  }, {} as Record<LeaveType, number>);

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
      
      const filteredLeaves = MOCK_LEAVE_REQUESTS.filter(req => {
        const reqDate = new Date(req.startDate);
        return isWithinInterval(reqDate, { start: dateRange.from, end: dateRange.to });
      });

      rows = filteredLeaves.map(req => [
        req.staffName,
        req.type,
        new Date(req.startDate).toLocaleDateString(),
        new Date(req.endDate).toLocaleDateString(),
        (differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1).toString(),
        `"${req.reason.replace(/"/g, '""')}"`, // Escape quotes
        req.status,
        new Date(req.appliedOn).toLocaleDateString(),
      ]);
      break;
    
    // Future cases for other reports (payroll, etc.) can be added here
    default:
      throw new Error("Unsupported report type");
  }

  csvData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvData;
}
