
import { getComplianceDocuments } from './actions';
import { HrmsComplianceClient } from './client';
import { getCurrentUser } from '@/lib/firebase/firestore';
import { getUserPermissions } from '@/lib/firebase/rbac';

export default async function HrmsDocumentsPage() {
    // In a real app, this would be a proper async data fetch.
    const [documents, user] = await Promise.all([
        getComplianceDocuments(),
        getCurrentUser()
    ]);

    let isAdmin = false;
    if (user) {
        const permissions = await getUserPermissions(user.id);
        isAdmin = permissions.includes('manage-users');
    }
    
    return <HrmsComplianceClient initialDocuments={documents} isAdmin={isAdmin} />;
}
