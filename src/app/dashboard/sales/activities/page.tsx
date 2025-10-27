

import { getCommunicationLogs } from "@/lib/mock-data/firestore";
import { SalesActivitiesClient } from "./client";
import { getCurrentUser } from "../actions";
import { getUserPermissions, getSubordinates } from "@/lib/mock-data/rbac";
import type { UserContext, CommunicationLog } from "@/lib/mock-data/types";
import { MOCK_ORGANIZATION_ID } from "@/lib/mock-data/firestore";

export default async function SalesActivitiesPage() {
    // Build user context to pass to data fetching
    const user = await getCurrentUser();
    let activities: CommunicationLog[] = [];
    
    if (user) {
        const [permissions, subordinates] = await Promise.all([
            getUserPermissions(user.id),
            getSubordinates(user.id),
        ]);

        const userContext: UserContext = {
            user,
            permissions,
            subordinates,
            orgId: user.orgId || MOCK_ORGANIZATION_ID,
        };
        activities = await getCommunicationLogs(userContext);
    }


    return <SalesActivitiesClient initialActivities={activities} />;
}


