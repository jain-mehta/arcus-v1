

import { getPayrollPageData } from './actions';
import { PayrollClient } from './client';
import { MOCK_STORES } from '@/lib/firebase/firestore';

export default async function HrmsPayrollPage() {
  const { users, salaryStructures } = await getPayrollPageData();

  // For the payslip header, we'll use a master store format. In a real app, this might be org-level data.
  const masterStore = MOCK_STORES.find(s => s.id === 'store-1') || MOCK_STORES[0] || { name: 'Bobs Bath Fittings Pvt Ltd', address: 'Etah, UP'};

  return <PayrollClient 
            initialUsers={users} 
            initialSalaryStructures={salaryStructures} 
            store={masterStore}
        />;
}
