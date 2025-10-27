
'use server';

import { MOCK_USERS, MOCK_OPPORTUNITIES } from '@/lib/mock-data/firestore';
import type { User, Opportunity } from '@/lib/mock-data/types';
import { MOCK_ORGANIZATION_ID } from '@/lib/mock-data/firestore';
import { getUser, getUserPermissions, getSubordinates } from '@/lib/mock-data/rbac';

interface LeaderboardEntry {
    user: User;
    revenueGenerated: number;
    dealsClosed: number;
}

export async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
    const [allUsers, allOpportunities] = await Promise.all([
        Promise.resolve(MOCK_USERS),
        Promise.resolve(MOCK_OPPORTUNITIES)
    ]);

    // Filter for users who are sales reps
    const salesReps = allUsers.filter(u => u.roleIds.includes('sales-exec') || u.roleIds.includes('regional-head'));

    const leaderboardData = salesReps.map(rep => {
        const closedWonOpps = allOpportunities.filter(
            (opp: Opportunity) => opp.ownerId === rep.id && opp.stage === 'Closed Won'
        );

        const revenueGenerated = closedWonOpps.reduce((total: number, opp: Opportunity) => total + opp.value, 0);
        const dealsClosed = closedWonOpps.length;

        return {
            user: rep,
            revenueGenerated,
            dealsClosed,
        };
    });

    // Sort by revenue generated in descending order
    leaderboardData.sort((a, b) => b.revenueGenerated - a.revenueGenerated);

    return leaderboardData;
}


