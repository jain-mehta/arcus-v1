

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

        // In a real app, these would be database queries.
        const users = [];
        const salaryStructures = MOCK_SALARY_STRUCTURES;

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
        MOCK_SALARY_STRUCTURES.push(newStructure);
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
        const index = MOCK_SALARY_STRUCTURES.findIndex(s => s.id === id);
        if (index === -1) {
            return createErrorResponse('Salary structure not found');
        }

        MOCK_SALARY_STRUCTURES[index] = { ...MOCK_SALARY_STRUCTURES[index], ...data };
        await logUserAction(user, 'update', 'salary_structure', id, { changes: data });
        revalidatePath('/dashboard/hrms/payroll');
        return createSuccessResponse(MOCK_SALARY_STRUCTURES[index], 'Salary structure updated successfully');
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
        const index = MOCK_SALARY_STRUCTURES.findIndex(s => s.id === id);
        if (index === -1) {
            return createErrorResponse('Salary structure not found');
        }

        MOCK_SALARY_STRUCTURES.splice(index, 1);
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
        const staffToProcess = staffId 
            ? [].filter(u => u.id === staffId)
            : [].filter(u => u.roleIds.length > 0 && u.designation);

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
        await logUserAction(user, 'view', 'salary_structures');
        return createSuccessResponse(MOCK_SALARY_STRUCTURES, 'Salary structures retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get salary structures: ${error.message}`);
    }
}


\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n

// TODO: Replace with actual database queries
// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

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
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
