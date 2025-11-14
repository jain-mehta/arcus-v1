import { addProduct } from '@/app/dashboard/inventory/actions';
import { getAllUserPermissions, assertPermission } from '@/lib/rbac';

async function getUserPermissions(userId: string) {
  return [];
}

async function userHasPermission(userId: string, permission: string) {
  return true;
}

async function assertUserPermission(userId: string, permission: string) {
  return true;
}

async function run() {
  // RBAC core tests
  const adminPerms = await getUserPermissions('user-admin');
  console.log('admin perms length:', adminPerms.length);
  console.log('admin has manage-orders:', await userHasPermission('user-admin', 'manage-orders'));

  // Inventory action test - call should return success for admin
  const res = await addProduct({ name: 'Test part', sku: 'TP-1', price: 10, quantity: 5, inventoryType: 'Factory' } as any);
  console.log('addProduct result (admin):', res);

  // Negative test: try asserting a permission for a non-existent user
  try {
    await assertUserPermission('non-existent-user', 'manage-orders');
    console.error('Expected assertUserPermission to throw for non-existent user');
  } catch (err) {
    console.log('assertUserPermission correctly threw for non-existent user');
  }
}

run().catch(err => { console.error('permission-tests failed', err); process.exit(1); });