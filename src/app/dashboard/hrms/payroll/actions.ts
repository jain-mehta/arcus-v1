

'use server';

import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getPayrollPageData(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'payroll', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {

        // TODO: Implement actual database queries
        const users: any[] = [];
        const salaryStructures: SalaryStructure[] = [];

        await logUserAction(user, 'view', 'payroll_data');
        return createSuccessResponse({ users, salaryStructures }, 'Payroll data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get payroll data: ${error.message}`);
    }
}

export async function createSalaryStructure(data: Omit<SalaryStructure, 'id'>): Promise<ActionResponse<SalaryStructure>> {
    const authCheck = await checkActionPermission('hrms', 'payroll', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const newStructure: SalaryStructure = { ...data, id: `struct-${Date.now()}`};
        // TODO: Save to database
        await logUserAction(user, 'create', 'salary_structure', newStructure.id, { structureName: newStructure.name });
        revalidatePath('/dashboard/hrms/payroll');
        return createSuccessResponse(newStructure, 'Salary structure created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create salary structure: ${error.message}`);
    }
}

export async function updateSalaryStructure(id: string, data: Partial<SalaryStructure>): Promise<ActionResponse<SalaryStructure>> {
    const authCheck = await checkActionPermission('hrms', 'payroll', 'edit');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // TODO: Find and update in database
        const existingStructure: any = null; // TODO: Query database by id
        if (!existingStructure) {
            return createErrorResponse('Salary structure not found');
        }

        const updatedStructure = { ...existingStructure, ...data };
        // TODO: Update in database
        await logUserAction(user, 'update', 'salary_structure', id, { changes: data });
        revalidatePath('/dashboard/hrms/payroll');
        return createSuccessResponse(updatedStructure, 'Salary structure updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update salary structure: ${error.message}`);
    }
}

export async function deleteSalaryStructure(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'payroll', 'delete');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // TODO: Find in database
        const existingStructure = null; // TODO: Query database by id
        if (!existingStructure) {
            return createErrorResponse('Salary structure not found');
        }

        // TODO: Delete from database
        await logUserAction(user, 'delete', 'salary_structure', id);
        revalidatePath('/dashboard/hrms/payroll');
        return createSuccessResponse(null, 'Salary structure deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete salary structure: ${error.message}`);
    }
}


export async function runPayroll(month: string, staffId?: string): Promise<ActionResponse<{ payslips: Payslip[] }>> {
    const authCheck = await checkActionPermission('hrms', 'payroll', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // TODO: Implement staff query from database
        const staffToProcess: any[] = []; // TODO: Query staff from database based on staffId or all eligible staff

        if (staffToProcess.length === 0) {
            return createSuccessResponse({ payslips: [] }, 'No staff found to run payroll for.');
        }

        const payslips: Payslip[] = staffToProcess.map(staff => {
            // TODO: Query salary structure from database
            const baseStructure: any = null; // TODO: Get salary structure from database
            if (!baseStructure) {
                throw new Error("Default salary structure not found.");
            }
            
            const grossEarnings = baseStructure.components
                .filter((c: any) => c.type === 'Earning')
                .reduce((sum: any, c: any) => sum + c.value, 0);

            const totalDeductions = baseStructure.components
                .filter((c: any) => c.type === 'Deduction')
                .reduce((sum: any, c: any) => {
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

        // TODO: Save payslips to database

        await logUserAction(user, 'create', 'payroll_run', 'bulk', { month, staffCount: payslips.length });
        return createSuccessResponse({ payslips }, `Payroll run completed for ${payslips.length} staff members`);
    } catch (error: any) {
        return createErrorResponse(`Failed to run payroll: ${error.message}`);
    }
}

export async function getSalaryStructures(): Promise<ActionResponse<SalaryStructure[]>> {
    const authCheck = await checkActionPermission('hrms', 'payroll', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // TODO: Query salary structures from database
        const salaryStructures: SalaryStructure[] = [];
        await logUserAction(user, 'view', 'salary_structures');
        return createSuccessResponse(salaryStructures, 'Salary structures retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get salary structures: ${error.message}`);
    }
}



// TODO: Define proper types and implement database queries
interface SalaryStructure {
  id: string;
  name: string;
  components: { type: string; calculationType: string; value: number }[];
}

interface Payslip {
  id: string;
  staffId: string;
  staffName: string;
  month: string;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  status: string;
  components: { type: string; calculationType: string; value: number }[];
}
