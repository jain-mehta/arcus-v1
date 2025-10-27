
import { getAllUsers, getAllRoles, getAllPermissions, getAllStores } from './actions';
import { ImprovedUsersClient } from './improved-users-client';

export default async function UsersPage() {
  const [users, roles, permissions, stores] = await Promise.all([
    getAllUsers(),
    getAllRoles(),
    getAllPermissions(),
    getAllStores(),
  ]);

  return <ImprovedUsersClient initialUsers={users} allRoles={roles} allPermissions={permissions} allStores={stores} />;
}

