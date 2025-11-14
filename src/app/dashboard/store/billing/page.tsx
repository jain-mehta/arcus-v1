

import { BillingClient } from './client';
import { getSalesCustomers } from '@/app/dashboard/sales/actions';
import { getProducts } from '@/app/dashboard/inventory/data';
import { getCurrentUser } from '@/app/dashboard/sales/actions';
import { getUserPermissions } from '@/lib/auth';
import { getSubordinates } from '@/lib/rbac';
import type { UserContext } from '@/lib/types';
export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div>User not found. Cannot determine store inventory.</div>;
  }
  
  const [permissions, subordinates] = await Promise.all([
      getUserPermissions(user.id),
      getSubordinates(user.id, user.orgId || ''),
  ]);

  const userContext: UserContext = {
      user,
      permissions,
      subordinates,
      orgId: user.orgId || '',
  };

  const [productsResult, customersResult] = await Promise.all([
    getProducts(userContext),
    getSalesCustomers()
  ]);

  const storeProducts = productsResult || [];
  const customers = customersResult.success ? customersResult.data || [] : [];

  return (
    <BillingClient products={storeProducts} customers={customers} />
  );
}
