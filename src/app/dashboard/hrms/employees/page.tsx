

import { getStaff, getAllStores, getAllUsers } from '../actions';
import { getCurrentUser } from '@/lib/mock-data/firestore';
import { getUserPermissions } from '@/lib/mock-data/rbac';
import { EmployeesClient } from './client';
import { getAllRoles } from '../../users/roles/actions';

export default async function HrmsEmployeesPage() {
    const user = await getCurrentUser();
    if (!user) {
        return <div>Loading...</div>; // Or a proper error state
    }

    const permissions = await getUserPermissions(user.id);
    const isAdmin = permissions.includes('manage-users');

    // For admins, we fetch all staff initially.
    // For non-admins, we only fetch staff for their specific store.
    const [initialStaff, allStores, allUsers, allRoles] = await Promise.all([
        getStaff(isAdmin ? undefined : user.storeId),
        getAllStores(),
        getAllUsers(),
        getAllRoles(),
    ]);

    return (
        <EmployeesClient 
            initialStaff={initialStaff}
            allStores={allStores}
            allUsers={allUsers}
            allRoles={allRoles}
            isAdmin={isAdmin}
            currentUserStoreId={user.storeId}
        />
    );
}


