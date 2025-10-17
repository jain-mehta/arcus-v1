

'use server';

import { getCurrentUser, MOCK_USERS } from "@/lib/firebase/firestore";
import type { User } from "@/lib/firebase/types";
import { revalidatePath } from "next/cache";
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getUserProfile() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'settings', 'view');

    return await getCurrentUser();
}

export async function getActiveSessionsForCurrentUser() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'settings', 'view');

    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    const { getSessionsForUser } = await import('@/lib/mock-sessions');
    return getSessionsForUser(currentUser.id);
}

export async function revokeSessionById(sessionId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'settings', 'view');

    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, message: 'Authentication required.' };
    const { revokeSession } = await import('@/lib/mock-sessions');
    const ok = await revokeSession(sessionId);
    revalidatePath('/dashboard/settings/profile');
    return { success: ok };
}

export async function updateCurrentUserProfile(data: Partial<User>): Promise<{ success: boolean, user?: User, message?: string }> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "User not authenticated." };
    }

    const userIndex = MOCK_USERS.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) {
        return { success: false, message: "User not found in database." };
    }

    // Merge new data with existing data
    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...data };

    revalidatePath('/dashboard/settings/profile');
    return { success: true, user: MOCK_USERS[userIndex] };
}
