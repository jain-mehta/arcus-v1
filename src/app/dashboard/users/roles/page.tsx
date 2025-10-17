
import { getAllRoles } from './actions';
import { RolesNewClient } from './roles-new-client';
import { getAllUsers } from '../actions';

export default async function RolesPage() {
  const [roles, users] = await Promise.all([
    getAllRoles(),
    getAllUsers(),
  ]);

  return <RolesNewClient 
            initialRoles={roles} 
            allUsers={users}
          />;
}
