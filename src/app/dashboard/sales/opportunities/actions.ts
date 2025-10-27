
'use server';

import type { SummarizeOpportunityInput, SummarizeOpportunityOutput } from '@/ai/flows/summarize-opportunity';
import { MOCK_ORGANIZATION_ID } from '@/lib/mock-data/firestore';
import { getUser, getUserPermissions, getSubordinates } from '@/lib/mock-data/rbac';
import type { UserContext } from '@/lib/mock-data/types';
import { getOpportunities, getSalesCustomers } from '../actions';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

async function buildUserContext(userId: string): Promise<UserContext> {
    const [user, permissions, subordinates] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
        getSubordinates(userId)
    ]);

    if (!user) {
        throw new Error("User not found, cannot build user context.");
    }

    return {
        user,
        permissions,
        subordinates,
        orgId: user.orgId || MOCK_ORGANIZATION_ID,
    };
}

async function getCurrentUserId(): Promise<string> {
    return 'user-admin'; 
}

export async function summarizeOpportunity(input: SummarizeOpportunityInput): Promise<SummarizeOpportunityOutput> {
    const userId = await getCurrentUserId();
    await buildUserContext(userId);
    // In a real app, you might use the user context to check for permissions
    // before calling the AI flow.
    const { summarizeOpportunity: callSummarizeOpportunity } = await import('@/ai/flows/summarize-opportunity');
    return callSummarizeOpportunity(input);
}


export async function getKanbanData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const [opportunities, { customers }] = await Promise.all([
        getOpportunities(),
        getSalesCustomers()
    ]);
    return { opportunities, customers };
}


