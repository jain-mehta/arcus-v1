import { getUserPermissions, userHasPermission } from '@/lib/firebase/rbac';

async function smoke() {
  const perms = await getUserPermissions('user-admin');
  console.log('admin perms', perms.join(','));
  const ok = await userHasPermission('user-admin', 'manage-purchase-orders');
  console.log('admin has manage-purchase-orders?', ok);
}

smoke().catch(err => {
  console.error('RBAC smoke failed', err);
  process.exit(1);
});
