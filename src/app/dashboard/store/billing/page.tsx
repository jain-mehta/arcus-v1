

import { BillingClient } from './client';
import { getSalesCustomers } from '@/app/dashboard/sales/actions';
import { getCurrentUser } from '@/lib/mock-data/firestore';
import { getProducts } from '@/app/dashboard/inventory/data';
import { getUser, getUserPermissions, getSubordinates } from '@/lib/mock-data/rbac';
import { MOCK_ORGANIZATION_ID } from '@/lib/mock-data/firestore';
import type { UserContext } from '@/lib/mock-data/types';


export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>User not found. Cannot determine store inventory.</div>;
  }
  
  const [permissions, subordinates] = await Promise.all([
      getUserPermissions(user.id),
      getSubordinates(user.id),
  ]);

  const userContext: UserContext = {
      user,
      permissions,
      subordinates,
      orgId: user.orgId || MOCK_ORGANIZATION_ID,
  };

  const [storeProducts, { customers }] = await Promise.all([
    getProducts(userContext),
    getSalesCustomers()
  ]);

  return (
    <BillingClient products={storeProducts} customers={customers} />
  );
}


