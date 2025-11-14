
import { getAllRoles } from './actions';
import { RolesNewClient } from './roles-new-client';
import { getAllUsers } from '../actions';

export default async function RolesPage() {
  const rolesResult = await getAllRoles();
  const users = await getAllUsers();
  
  const roles = rolesResult.success ? rolesResult.data || [] : [];

  return <RolesNewClient 
            initialRoles={roles as any}
            allUsers={users as any}
          />;
}

