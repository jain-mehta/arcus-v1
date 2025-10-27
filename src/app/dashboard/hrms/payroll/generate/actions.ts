
'use server';

import { getStaff, getAllStores } from '../../../hrms/actions';
import { getSalaryStructures, runPayroll as runPayrollServerAction } from '../actions';
import { getPayrollFormats } from '../formats/actions';
import type { User, Store, SalaryStructure } from '@/lib/mock-data/types';
import type { PayslipLayout } from '../formats/actions';

export async function getPageData(): Promise<{
    staffList: User[];
    stores: Store[];
    salaryStructures: SalaryStructure[];
    payslipLayouts: PayslipLayout[];
}> {
    const [staffList, stores, salaryStructures, payslipLayouts] = await Promise.all([
        getStaff(),
        getAllStores(),
        getSalaryStructures(),
        getPayrollFormats(),
    ]);
    return { staffList, stores, salaryStructures, payslipLayouts };
}

export { runPayrollServerAction as runPayroll };


