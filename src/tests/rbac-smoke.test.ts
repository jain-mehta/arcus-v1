import { checkCasbin, getPermissionsForUser } from '@/lib/casbinClient';

async function smoke() {
  // Check permissions for admin user
  const perms = await getPermissionsForUser('user-admin', 'default-org');
  console.log('admin perms', perms.map(p => `${p.resource}:${p.action}`).join(','));
  
  // Check specific permission
  const ok = await checkCasbin({
    userId: 'user-admin',
    organizationId: 'default-org',
    resource: 'purchase-orders',
    action: 'manage'
  });
  console.log('admin has manage purchase-orders?', ok);
}

smoke().catch(err => {
  console.error('RBAC smoke failed', err);
  process.exit(1);
});


