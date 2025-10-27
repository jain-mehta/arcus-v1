import { getUserPermissions, userHasPermission, assertUserPermission } from '@/lib/mock-data/rbac';
import { addProduct } from '@/app/dashboard/inventory/actions';

async function run() {
  // RBAC core tests
  const adminPerms = await getUserPermissions('user-admin');
  console.log('admin perms length:', adminPerms.length);
  console.log('admin has manage-orders:', await userHasPermission('user-admin', 'manage-orders'));

  // Inventory action test (uses mock sessions internally) - call should return success for admin
  const res = await addProduct({ name: 'Test part', sku: 'TP-1', price: 10, quantity: 5, inventoryType: 'Factory' } as any);
  console.log('addProduct result (admin or mock):', res);

  // Negative test: try asserting a permission for a non-existent user
  try {
    await assertUserPermission('non-existent-user', 'manage-orders');
    console.error('Expected assertUserPermission to throw for non-existent user');
  } catch (err) {
    console.log('assertUserPermission correctly threw for non-existent user');
  }
}

run().catch(err => { console.error('permission-tests failed', err); process.exit(1); });


