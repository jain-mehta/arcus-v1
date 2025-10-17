'use server';

import type { GenerateQuotationOutput } from '@/ai/flows/generate-quotation-flow';
import { MOCK_ORGANIZATION_ID } from '@/lib/firebase/firestore';
import { getUser, getUserPermissions, getSubordinates } from '@/lib/firebase/rbac';
import type { UserContext } from '@/lib/firebase/types';

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

export async function generateQuotation(customerId: string, prompt: string): Promise<GenerateQuotationOutput> {
    const userId = await getCurrentUserId();
    await buildUserContext(userId);
    // In a real app, you might use the user context to check for permissions
    // before calling the AI flow.
    const { generateQuotation: callGenerateQuotation } = await import('@/ai/flows/generate-quotation-flow');
    return callGenerateQuotation({ customerId, prompt });
}
