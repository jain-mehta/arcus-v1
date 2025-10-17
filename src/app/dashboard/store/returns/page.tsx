

import { getCurrentUser } from '@/lib/firebase/firestore';
import { getUserPermissions } from '@/lib/firebase/rbac';
import { getStores } from '../manage/actions';
import { ReturnsClient } from './client';

export default async function ReturnsPage() {
    const user = await getCurrentUser();
    
    // In a real app with auth, you'd handle the case where user is null
    if (!user) {
        return <div>Loading user data...</div>
    }

    const [permissions, allStores] = await Promise.all([
        getUserPermissions(user.id),
        getStores(),
    ]);

    const isAdmin = permissions.includes('manage-stores');

    return (
        <ReturnsClient
            isAdmin={isAdmin}
            allStores={allStores}
            userStoreId={user.storeId}
        />
    );
}
