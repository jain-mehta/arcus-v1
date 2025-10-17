

import { getLeaveRequests, getLeavePolicies, getStaff } from '../actions';
import { LeavesClient } from './client';
import { getCurrentUser } from '@/lib/firebase/firestore';
import { getUserPermissions } from '@/lib/firebase/rbac';

export default async function HrmsLeavesPage() {
    const user = await getCurrentUser();
    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Loading user data...</p>
            </div>
        )
    }

    const permissions = await getUserPermissions(user.id);
    const isAdmin = permissions.includes('manage-users');

    // Pass the user context directly to the action
    const [requests, policies, staff] = await Promise.all([
        getLeaveRequests(user, permissions),
        getLeavePolicies(),
        getStaff(),
    ]);

    return (
        <LeavesClient
            initialRequests={requests}
            leavePolicies={policies}
            staffList={staff}
            currentUser={user}
            isAdmin={isAdmin}
        />
    );
}
