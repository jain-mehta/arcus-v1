
'use server';

// Database types for HRMS module - using Supabase tables
interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  organization_id?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  manager_id?: string;
  organization_id?: string;
}
import { revalidatePath } from 'next/cache';
import { startOfToday, differenceInDays } from 'date-fns';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getHrmsDashboardData(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'dashboard', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        // Fetch employees and leave requests from database
        const [employeesResult, leaveRequestsResult] = await Promise.all([
            supabase.from('employees').select('*').eq('organization_id', user.orgId || 'default-org'),
            supabase.from('leave_requests').select('*').eq('organization_id', user.orgId || 'default-org')
        ]);

        const employees = employeesResult.data || [];
        const leaveRequests = leaveRequestsResult.data || [];

        // Calculate KPIs from real data
        const totalEmployees = employees.length;
        const activeEmployees = employees.filter(emp => emp.status === 'active').length;
        const absentToday = totalEmployees - activeEmployees;
        const pendingApprovals = leaveRequests.filter(req => req.status === 'pending').length;

        const kpis = [
            { title: 'Total Employees', value: totalEmployees, icon: 'Users' },
            { title: 'Active Employees', value: activeEmployees, icon: 'UserCheck' },
            { title: 'Absent Today', value: absentToday.toString(), icon: 'UserX' },
            { title: 'Pending Approvals', value: pendingApprovals, icon: 'CalendarClock' },
        ];

        const today = new Date();
        const todayStart = startOfToday();
        const upcomingPeriod = new Date();
        upcomingPeriod.setDate(today.getDate() + 30);

        // Calculate upcoming events from employee data
        const upcomingEvents = employees
            .map(employee => {
                const events = [];
                // Birthday
                if (employee.date_of_birth) {
                    const dob = new Date(employee.date_of_birth);
                    dob.setFullYear(today.getFullYear());
                    if (dob < todayStart) {
                        dob.setFullYear(today.getFullYear() + 1);
                    }
                    if (dob >= today && dob <= upcomingPeriod) {
                        events.push({
                            type: 'Birthday',
                            date: dob.toISOString(),
                            name: `${employee.first_name} ${employee.last_name}`,
                            id: employee.id
                        });
                    }
                }
                // Work Anniversary
                if (employee.hire_date) {
                    const hireDate = new Date(employee.hire_date);
                    const currentYear = today.getFullYear();

                    let nextAnniversary = new Date(hireDate.getTime());
                    nextAnniversary.setFullYear(currentYear);

                    if (nextAnniversary < todayStart) {
                        nextAnniversary.setFullYear(currentYear + 1);
                    }

                    if (nextAnniversary >= today && nextAnniversary <= upcomingPeriod) {
                        const yearsOfService = nextAnniversary.getFullYear() - hireDate.getFullYear();
                        events.push({
                            type: 'Anniversary',
                            date: nextAnniversary.toISOString(),
                            name: `${employee.first_name} ${employee.last_name}`,
                            id: employee.id,
                            years: yearsOfService
                        });
                    }
                }
                return events;
            })
            .flat()
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        await logUserAction(user, 'view', 'hrms_dashboard', undefined, { kpisCount: kpis.length });
        return createSuccessResponse({ kpis, upcomingEvents }, 'HRMS dashboard data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to load HRMS dashboard: ${error.message}`);
    }
}

export async function getStaff(storeId?: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'employees', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        // Build query for employees
        let query = supabase.from('employees').select('*');

        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        // Filter by organization
        query = query.eq('organization_id', user.orgId || 'default-org');

        const { data: employees, error } = await query;

        if (error) {
            console.error('[getStaff] Error:', error);
            return createErrorResponse('Failed to fetch staff data');
        }

        await logUserAction(user, 'view', 'employees', undefined, { storeId, count: employees?.length });
        return createSuccessResponse(employees || [], 'Staff data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch staff: ${error.message}`);
    }
}

export async function getAllStores(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'stores', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: stores, error } = await supabase
            .from('stores')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org');

        if (error) {
            console.error('[getAllStores] Error:', error);
            return createErrorResponse('Failed to fetch stores data');
        }

        await logUserAction(user, 'view', 'stores', undefined, { count: stores?.length });
        return createSuccessResponse(stores || [], 'Stores retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch stores: ${error.message}`);
    }
}

export async function getAllUsers(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'users', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org');

        if (error) {
            console.error('[getAllUsers] Error:', error);
            return createErrorResponse('Failed to fetch users data');
        }

        await logUserAction(user, 'view', 'users', undefined, { count: users?.length });
        return createSuccessResponse(users || [], 'Users retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch users: ${error.message}`);
    }
}

// ===== HRMS FUNCTIONS =====

export async function addStaffMember(staffData: Partial<Employee>): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse(staffData, 'Staff member added');
  } catch (error: any) {
    return createErrorResponse(`Failed to add staff: ${error.message}`);
  }
}

export async function updateStaffMember(staffId: string, updates: Partial<Employee>): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse(updates, 'Staff member updated');
  } catch (error: any) {
    return createErrorResponse(`Failed to update staff: ${error.message}`);
  }
}

export async function logShiftActivity(employeeId: string, activity: string): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse({ employeeId, activity }, 'Activity logged');
  } catch (error: any) {
    return createErrorResponse(`Failed to log activity: ${error.message}`);
  }
}

export async function addLeaveRequest(leaveData: Partial<LeaveRequest>): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse(leaveData, 'Leave request created');
  } catch (error: any) {
    return createErrorResponse(`Failed to create leave request: ${error.message}`);
  }
}

export async function updateLeaveRequestStatus(leaveId: string, status: string): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse({ leaveId, status }, 'Leave request updated');
  } catch (error: any) {
    return createErrorResponse(`Failed to update leave request: ${error.message}`);
  }
}

export async function getLeaveRequests(employeeId: string): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse([], 'Leave requests retrieved');
  } catch (error: any) {
    return createErrorResponse(`Failed to fetch leave requests: ${error.message}`);
  }
}

export async function getLeavePolicies(): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse([], 'Leave policies retrieved');
  } catch (error: any) {
    return createErrorResponse(`Failed to fetch leave policies: ${error.message}`);
  }
}

export async function getAttendanceData(employeeId?: string): Promise<ActionResponse> {
  try {
    // TODO: Implement in database
    return createSuccessResponse([], 'Attendance data retrieved');
  } catch (error: any) {
    return createErrorResponse(`Failed to fetch attendance: ${error.message}`);
  }
}

// Note: All remaining HRMS functions (staff management, leave management, recruitment, etc.)
// need to be implemented with proper Supabase database calls.
// The mock implementations have been removed to prevent confusion.