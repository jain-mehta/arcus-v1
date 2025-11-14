

import { getPayrollPageData } from './actions';
import { PayrollClient } from './client';
export default async function HrmsPayrollPage() {
  const response = await getPayrollPageData();
  const { users, salaryStructures } = (response?.success && response.data) ? response.data : { users: [], salaryStructures: [] };

  // For the payslip header, we'll use a master store format. In a real app, this might be org-level data.
  const masterStore = { id: 'master', name: 'Bobs Bath Fittings Pvt Ltd', address: 'Etah, UP'};

  return <PayrollClient 
            initialUsers={users} 
            initialSalaryStructures={salaryStructures} 
            store={masterStore}
        />;
}
