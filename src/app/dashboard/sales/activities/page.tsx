

import { getCommunicationLogs } from "@/lib/firebase/firestore";
import { SalesActivitiesClient } from "./client";
import { getCurrentUser } from "../actions";
import { getUserPermissions, getSubordinates } from "@/lib/firebase/rbac";
import type { UserContext, CommunicationLog } from "@/lib/firebase/types";
import { MOCK_ORGANIZATION_ID } from "@/lib/firebase/firestore";

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
