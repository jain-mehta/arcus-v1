

'use server';

import { MOCK_USERS, MOCK_SALARY_STRUCTURES, MOCK_PAYSLIPS } from '@/lib/firebase/firestore';
import { getCurrentUser as getCurrentUserFromDb } from '@/lib/firebase/firestore';
import { assertUserPermission } from '@/lib/firebase/rbac';
import type { SalaryStructure, Payslip, Customer } from '@/lib/firebase/types';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getPayrollPageData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'payroll');

  // In a real app, these would be database queries.
  const users = MOCK_USERS;
  const salaryStructures = MOCK_SALARY_STRUCTURES;
  return { users, salaryStructures };
}

export async function createSalaryStructure(data: Omit<SalaryStructure, 'id'>): Promise<{ success: boolean, newStructure?: SalaryStructure }> {
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false, newStructure: undefined };
    try { await assertUserPermission(currentUser.id, 'manage-payroll'); } catch (err) { return { success: false, newStructure: undefined } }

    const newStructure: SalaryStructure = { ...data, id: `struct-${Date.now()}`};
    MOCK_SALARY_STRUCTURES.push(newStructure);
    revalidatePath('/dashboard/hrms/payroll');
    return { success: true, newStructure };
}

export async function updateSalaryStructure(id: string, data: Partial<SalaryStructure>): Promise<{ success: boolean; updatedStructure?: SalaryStructure, message?: string }> {
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false };
    try { await assertUserPermission(currentUser.id, 'manage-payroll'); } catch (err) { return { success: false, message: 'Forbidden' } }

    const index = MOCK_SALARY_STRUCTURES.findIndex(s => s.id === id);
    if (index > -1) {
        MOCK_SALARY_STRUCTURES[index] = { ...MOCK_SALARY_STRUCTURES[index], ...data };
        revalidatePath('/dashboard/hrms/payroll');
        return { success: true, updatedStructure: MOCK_SALARY_STRUCTURES[index] };
    }
    return { success: false, message: 'Structure not found.' };
}

export async function deleteSalaryStructure(id: string): Promise<{ success: boolean; message?: string }> {
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false, message: 'Permission denied.' };
    try { await assertUserPermission(currentUser.id, 'manage-payroll'); } catch (err) { return { success: false, message: 'Forbidden' } }

    const index = MOCK_SALARY_STRUCTURES.findIndex(s => s.id === id);
    if (index > -1) {
        MOCK_SALARY_STRUCTURES.splice(index, 1);
        revalidatePath('/dashboard/hrms/payroll');
        return { success: true };
    }
    return { success: false, message: 'Structure not found.' };
}


export async function runPayroll(month: string, staffId?: string): Promise<{ success: boolean; payslips: Payslip[]; message?: string }> {
    const currentUser = await getCurrentUserFromDb();
    if (!currentUser) return { success: false, payslips: [], message: 'Permission denied.' };
    try { await assertUserPermission(currentUser.id, 'manage-payroll'); } catch (err) { return { success: false, payslips: [], message: 'Forbidden' } }

    try {
        const staffToProcess = staffId 
            ? MOCK_USERS.filter(u => u.id === staffId)
            : MOCK_USERS.filter(u => u.roleIds.length > 0 && u.designation);

        if (staffToProcess.length === 0) {
            return { success: true, payslips: [], message: 'No staff found to run payroll for.' };
        }
        
        const payslips: Payslip[] = staffToProcess.map(staff => {
            const baseStructure = MOCK_SALARY_STRUCTURES.find(s => s.id === 'struct-standard') || MOCK_SALARY_STRUCTURES[0];
            if (!baseStructure) {
                throw new Error("Default salary structure not found.");
            }
            
            const grossEarnings = baseStructure.components
                .filter(c => c.type === 'Earning')
                .reduce((sum, c) => sum + c.value, 0);

            const totalDeductions = baseStructure.components
                .filter(c => c.type === 'Deduction')
                .reduce((sum, c) => {
                    const deductionValue = c.calculationType === 'Fixed' 
                        ? c.value 
                        : grossEarnings * (c.value / 100);
                    return sum + deductionValue;
                }, 0);

            const netSalary = grossEarnings - totalDeductions;

            return {
                id: `payslip-${staff.id}-${month.replace(' ', '-')}`,
                staffId: staff.id,
                staffName: staff.name,
                month: month,
                grossSalary: grossEarnings,
                deductions: totalDeductions,
                netSalary: netSalary,
                status: 'Paid',
                components: baseStructure.components,
            }
        });
        
        // Simulate saving to DB
        payslips.forEach(p => {
            const index = MOCK_PAYSLIPS.findIndex(mp => mp.id === p.id);
            if (index > -1) {
                MOCK_PAYSLIPS[index] = p;
            } else {
                MOCK_PAYSLIPS.push(p);
            }
        });

        return { success: true, payslips };
    } catch (error: any) {
        return { success: false, payslips: [], message: error.message };
    }
}

export async function getSalaryStructures(): Promise<SalaryStructure[]> {
    return MOCK_SALARY_STRUCTURES;
}
