


'use server';

import { MOCK_USERS, MOCK_LEAVE_REQUESTS, MOCK_ORGANIZATION_ID, MOCK_LEAVE_POLICIES, MOCK_JOB_OPENINGS, MOCK_APPLICANTS, MOCK_COMPLIANCE_DOCS, getCurrentUser as getCurrentUserFromDb, MOCK_SHIFT_LOGS, MOCK_STORES, MOCK_ROLES, getStaffMember as getStaffMemberFromDb } from '@/lib/firebase/firestore';
import type { Store, User, LeaveRequest, LeavePolicy, JobOpening, Applicant, Shift, Role } from '@/lib/firebase/types';
import { revalidatePath } from 'next/cache';
import { getUserPermissions, assertUserPermission } from '@/lib/firebase/rbac';
import { startOfToday, differenceInDays } from 'date-fns';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getHrmsDashboardData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    const activeEmployees = MOCK_USERS.filter(s => (s as any).status === 'Clocked In').length;
    const absentToday = MOCK_USERS.length - activeEmployees;

    const kpis = [
        { title: 'Total Employees', value: MOCK_USERS.length, icon: 'Users' },
        { title: 'Active Employees', value: activeEmployees, icon: 'UserCheck' },
        { title: 'Absent Today', value: absentToday.toString(), icon: 'UserX' },
        { title: 'Pending Approvals', value: MOCK_LEAVE_REQUESTS.filter(r => r.status === 'Pending').length, icon: 'CalendarClock' },
    ];

    const today = new Date();
    const todayStart = startOfToday();
    const upcomingPeriod = new Date();
    upcomingPeriod.setDate(today.getDate() + 30);

    const upcomingEvents = MOCK_USERS
        .map(user => {
            const events = [];
            // Birthday
            if (user.dateOfBirth) {
                const dob = new Date(user.dateOfBirth);
                dob.setFullYear(today.getFullYear());
                if (dob < todayStart) { // If birthday this year has passed, check next year
                    dob.setFullYear(today.getFullYear() + 1);
                }
                if (dob >= today && dob <= upcomingPeriod) {
                    events.push({ type: 'Birthday', date: dob.toISOString(), name: user.name, id: user.id });
                }
            }
            // Work Anniversary
            if (user.hireDate) {
                const hireDate = new Date(user.hireDate);
                const currentYear = today.getFullYear();
                
                let nextAnniversary = new Date(hireDate.getTime());
                nextAnniversary.setFullYear(currentYear);

                if (nextAnniversary < todayStart) { 
                    nextAnniversary.setFullYear(currentYear + 1);
                }

                if (nextAnniversary >= today && nextAnniversary <= upcomingPeriod) {
                    const yearsOfService = nextAnniversary.getFullYear() - hireDate.getFullYear();
                    events.push({ type: 'Anniversary', date: nextAnniversary.toISOString(), name: user.name, id: user.id, years: yearsOfService });
                }
            }
            return events;
        })
        .flat()
        .sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime());


    return { kpis, upcomingEvents };
}

export async function getStaff(storeId?: string): Promise<User[]> {
    const user = await getCurrentUserFromDb();
    if (!user) return [];
    
    const permissions = await getUserPermissions(user.id);
    const isAdmin = permissions.includes('manage-users');

    if (isAdmin) {
        // Admins can see all staff, optionally filtered by store
        if (storeId && storeId !== 'all') {
            return MOCK_USERS.filter(u => u.storeId === storeId);
        }
        return MOCK_USERS;
    }

    // Non-admins can only see staff in their own store
    if (user.storeId) {
        return MOCK_USERS.filter(u => u.storeId === user.storeId);
    }

    return [];
}

export async function getAllStores(): Promise<Store[]> {
    return MOCK_STORES;
}

export async function getAllUsers(): Promise<User[]> {
    return MOCK_USERS;
}

export async function addStaffMember(data: { name: string; designation: string; email: string; phone: string; storeId?: string; reportsTo?: string; }): Promise<{ success: boolean, newUser?: User, message?: string }> {
    const user = await getCurrentUserFromDb();
    if (!user) return { success: false, message: 'Permission denied.'};
    try { await assertUserPermission(user.id, 'manage-employees'); } catch (err) { return { success: false, message: 'You do not have permission to add new staff.' }; }
    
    const role = MOCK_ROLES.find(r => r.name === data.designation);

    const newUser: User = {
        id: `user-staff-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        orgId: MOCK_ORGANIZATION_ID,
        roleIds: role ? [role.id] : [],
        storeId: data.storeId,
        reportsTo: data.reportsTo,
        designation: data.designation,
        status: 'Active',
    };
    MOCK_USERS.push(newUser);

    revalidatePath('/dashboard/hrms/employees');
    return { success: true, newUser };
}


export async function updateStaffMember(staffId: string, data: Partial<User>): Promise<{ success: boolean; message?: string, updatedUser?: User }> {
     const user = await getCurrentUserFromDb();
    if (!user) return { success: false, message: 'Permission denied.'};
    try { await assertUserPermission(user.id, 'manage-employees'); } catch (err) { return { success: false, message: 'You do not have permission to update staff.' }; }

    const userIndex = MOCK_USERS.findIndex(u => u.id === staffId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    
    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...data };

    revalidatePath('/dashboard/hrms/employees');
    revalidatePath(`/dashboard/hrms/employees/${staffId}`);
    return { success: true, updatedUser: MOCK_USERS[userIndex] };
}

export async function deleteStaffMember(staffId: string): Promise<{ success: boolean; message?: string }> {
    // Require permission to delete staff
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false, message: 'Permission denied.' };
    try { await assertUserPermission(currentUser.id, 'manage-employees'); } catch (err) { return { success: false, message: 'Forbidden' }; }

    const userIndex = MOCK_USERS.findIndex(u => u.id === staffId);
    if (userIndex > -1) {
        MOCK_USERS.splice(userIndex, 1);
        revalidatePath('/dashboard/hrms/employees');
        return { success: true };
    }
    return { success: false, message: 'Staff not found.' };
}

export async function logShiftActivity(data: { staffId: string; type: 'Clock In' | 'Clock Out' | 'On Break' }): Promise<{ success: boolean }> {
    const userIndex = MOCK_USERS.findIndex(s => s.id === data.staffId);
    if (userIndex > -1) {
        (MOCK_USERS as any)[userIndex].status = data.type === 'On Break' ? 'On Break' : data.type === 'Clock In' ? 'Clocked In' : 'Clocked Out';
    }
    
    const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...data,
    };
    MOCK_SHIFT_LOGS.unshift(newLog);
    
    revalidatePath('/dashboard/hrms/employees');
    revalidatePath(`/dashboard/hrms/employees/${data.staffId}`);
    revalidatePath('/dashboard/hrms/attendance'); // Revalidate the attendance page
    
    return { success: true };
}


// --- Leave Management Actions (Rebuilt) ---

export async function getLeavePolicies(): Promise<LeavePolicy[]> {
    return Promise.resolve(MOCK_LEAVE_POLICIES);
}

export async function getLeaveRequests(user: User, permissions: string[]): Promise<(LeaveRequest & { duration: number })[]> {
    let requests: LeaveRequest[] = [];
    if (permissions.includes('manage-users')) { // Admin can see all
        requests = MOCK_LEAVE_REQUESTS;
    } else {
        // Non-admins see their own requests. Manager logic can be added later.
        requests = MOCK_LEAVE_REQUESTS.filter(req => req.staffId === user.id);
    }

    // Calculate duration on the server to avoid client-side date issues
    return requests.map(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const duration = isNaN(start.getTime()) || isNaN(end.getTime()) ? 0 : differenceInDays(end, start) + 1;
        return { ...req, duration };
    }).sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
}

export async function addLeaveRequest(data: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn' | 'staffName'>, user: User): Promise<{success: boolean; newRequest?: LeaveRequest & { duration: number }}> {
    if (!user) return { success: false };

    const newRequest: LeaveRequest = {
        id: `leave-${Date.now()}`,
        staffName: user.name,
        status: 'Pending',
        appliedOn: new Date().toISOString(),
        ...data,
    };
    MOCK_LEAVE_REQUESTS.unshift(newRequest);
    revalidatePath('/dashboard/hrms/leaves');
    
    const duration = differenceInDays(new Date(newRequest.endDate), new Date(newRequest.startDate)) + 1;
    return { success: true, newRequest: { ...newRequest, duration } };
}

export async function updateLeaveRequestStatus(requestId: string, status: 'Approved' | 'Rejected', managerComments: string): Promise<{ success: boolean }> {
    // Require approval permission
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false };
    try { await assertUserPermission(currentUser.id, 'approve-leave'); } catch (err) { return { success: false } }

    const index = MOCK_LEAVE_REQUESTS.findIndex(req => req.id === requestId);
    if (index > -1) {
        MOCK_LEAVE_REQUESTS[index].status = status;
        MOCK_LEAVE_REQUESTS[index].managerComments = managerComments;
        revalidatePath('/dashboard/hrms/leaves');
        return { success: true };
    }
    return { success: false };
}


// --- Recruitment Actions ---

export async function getJobOpenings(): Promise<JobOpening[]> {
    return Promise.resolve(MOCK_JOB_OPENINGS);
}

export async function createJobOpening(data: Omit<JobOpening, 'id' | 'datePosted'>): Promise<{ success: boolean; newJob?: JobOpening; message?: string }> {
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false, message: 'Permission denied.' };
    try { await assertUserPermission(currentUser.id, 'manage-employees'); } catch (err) { return { success: false, message: 'Forbidden' }; }

    const newJob: JobOpening = {
        id: `job-${Date.now()}`,
        datePosted: new Date().toISOString(),
        ...data,
    };
    MOCK_JOB_OPENINGS.unshift(newJob);
    revalidatePath('/dashboard/hrms/recruitment');
    return { success: true, newJob };
}

export async function updateJobOpening(jobId: string, data: Partial<Omit<JobOpening, 'id' | 'datePosted'>>): Promise<{ success: boolean; updatedJob?: JobOpening; message?: string }> {
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false, message: 'Permission denied.' };
    try { await assertUserPermission(currentUser.id, 'manage-employees'); } catch (err) { return { success: false, message: 'Forbidden' }; }

    const index = MOCK_JOB_OPENINGS.findIndex(job => job.id === jobId);
    if (index === -1) {
        return { success: false, message: 'Job opening not found.' };
    }
    const updatedJob = { ...MOCK_JOB_OPENINGS[index], ...data };
    MOCK_JOB_OPENINGS[index] = updatedJob;
    revalidatePath('/dashboard/hrms/recruitment');
    return { success: true, updatedJob };
}

export async function getApplicants(jobId: string): Promise<Applicant[]> {
    return MOCK_APPLICANTS.filter(a => a.jobId === jobId);
}

export async function addApplicant(data: Omit<Applicant, 'id' | 'stage' | 'resumeUrl' | 'phone'> & { phone?: string }): Promise<{ success: boolean; newApplicant?: Applicant, message?: string }> {
    const currentUser = await getCurrentUserFromDb();
    // Allow any authenticated user to add an applicant (e.g., portal)
    if (!currentUser) return { success: false, message: 'Permission denied.' };

    const newApplicant: Applicant = {
        id: `applicant-${Date.now()}`,
        stage: 'Applied',
        resumeUrl: '#',
        // Ensure phone is always a string (empty string if not provided) to match Applicant type
        ...data,
        phone: data.phone ?? ''
    };
    MOCK_APPLICANTS.push(newApplicant);
    revalidatePath('/dashboard/hrms/recruitment');
    return { success: true, newApplicant };
}

export async function updateApplicantStage(applicantId: string, newStage: Applicant['stage']): Promise<{ success: boolean; message?: string }> {
    const applicantIndex = MOCK_APPLICANTS.findIndex(a => a.id === applicantId);
    if (applicantIndex === -1) {
        return { success: false, message: 'Applicant not found.' };
    }

    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false, message: 'Permission denied.' };
    try { await assertUserPermission(currentUser.id, 'manage-employees'); } catch (err) { return { success: false, message: 'Forbidden' }; }

    MOCK_APPLICANTS[applicantIndex].stage = newStage;

    if (newStage === 'Hired') {
        const applicant = MOCK_APPLICANTS[applicantIndex];
        
        // Create a User record
        const newUser: User = {
            id: `user-hired-${applicant.id}`,
            name: applicant.name,
            email: applicant.email,
            phone: applicant.phone,
            orgId: MOCK_ORGANIZATION_ID,
            roleIds: ['sales-exec'], // Assign a default role
            designation: 'Sales Executive', // Assign a default designation
            hireDate: new Date().toISOString(),
            status: 'Active',
            storeId: 'store-1', // Assign to a default store, should be dynamic in a real app
        };
        MOCK_USERS.push(newUser);

        // (Simulated) Generate an Offer Letter document
        const offerLetter = {
            id: `doc-offer-${newUser.id}`,
            name: `Offer Letter - ${applicant.name}`,
            category: 'Offer Letter',
            uploadDate: new Date().toISOString(),
            fileName: `Offer_Letter_${applicant.name.replace(' ', '_')}.pdf`,
            fileUrl: '#',
            filePath: `mock/offers/${newUser.id}.pdf`,
        };
        MOCK_COMPLIANCE_DOCS.push(offerLetter);
    }
    
    revalidatePath('/dashboard/hrms/recruitment');
    revalidatePath('/dashboard/hrms/employees');
    revalidatePath('/dashboard/hrms/compliance');
    return { success: true };
}


// --- Attendance & Shifts Actions ---

export async function getAttendanceData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    const shifts: Shift[] = [];
    
    const todayEnd = new Date();
    const todayStart = startOfToday();

    const todaysLogs = MOCK_SHIFT_LOGS.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= todayStart && logDate <= todayEnd;
    });

    const attendanceStatus = MOCK_USERS.map(user => {
        const lastLog = todaysLogs.filter(l => l.staffId === user.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        let status: string = (user as any).status || 'Clocked Out';
        if (lastLog) {
            status = lastLog.type === 'On Break' ? 'On Break' : lastLog.type === 'Clock In' ? 'Clocked In' : 'Clocked Out';
        }
        
        return {
            staffId: user.id,
            name: user.name,
            status: status as any
        }
    });

    return { shifts: shifts, attendance: attendanceStatus };
}
