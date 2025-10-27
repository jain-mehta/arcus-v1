
import { getVendors, getCommunicationLogs } from '@/lib/mock-data/firestore';
import { CommunicationLogClient } from './client';
import type { CommunicationLog, Vendor, UserContext } from '@/lib/mock-data/types';
import { getUser, getUserPermissions, getSubordinates } from '@/lib/mock-data/rbac';
import { getCurrentUser } from '../../sales/actions';


interface LogWithVendorName extends CommunicationLog {
    vendorName: string;
}

export default async function CommunicationLogPage() {
    const user = await getCurrentUser();
    let allLogs: CommunicationLog[] = [];
    
    // **FIX:** Build UserContext and pass it to the data fetching function to enforce RBAC.
    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id),
        ]);

        const userContext: UserContext = {
            user,
            permissions,
            subordinates,
            orgId: user.orgId,
        };
        allLogs = await getCommunicationLogs(userContext)
    }
    
    const vendors = await getVendors();

    const vendorMap = new Map(vendors.map(v => [v.id, v.name]));

    const logsWithVendorNames: LogWithVendorName[] = allLogs.map(log => ({
        ...log,
        vendorName: vendorMap.get(log.vendorId!) || 'N/A'
    }));
    
    return (
        <CommunicationLogClient initialLogs={logsWithVendorNames} vendors={vendors} />
    );
}



