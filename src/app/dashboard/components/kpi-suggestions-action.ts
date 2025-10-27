
'use server';

import type {
  SuggestKpisBasedOnPerformanceInput,
  SuggestKpisBasedOnPerformanceOutput,
} from '@/ai/flows/suggest-kpis-based-on-performance';
import {
  MOCK_ORGANIZATION_ID,
  getCurrentUser,
} from '@/lib/mock-data/firestore';
import {
  getUser,
  getUserPermissions,
  getSubordinates,
} from '@/lib/mock-data/rbac';
import type { UserContext } from '@/lib/mock-data/types';

// MOCK: In a real app, this would get the logged-in user's ID from the session.
async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user?.id || 'user-admin';
}

async function buildUserContext(userId: string): Promise<UserContext> {
  const [user, permissions, subordinates] = await Promise.all([
    getUser(userId),
    getUserPermissions(userId),
    getSubordinates(userId),
  ]);

  if (!user) {
    throw new Error('User not found, cannot build user context.');
  }

  return {
    user,
    permissions,
    subordinates: subordinates,
    orgId: user.orgId || MOCK_ORGANIZATION_ID,
  };
}

export async function suggestKpis(
  input: SuggestKpisBasedOnPerformanceInput
): Promise<SuggestKpisBasedOnPerformanceOutput> {
  const userId = await getCurrentUserId();
  const userContext = await buildUserContext(userId);

  if (!userContext.permissions.includes('view-dashboard')) {
    throw new Error('You do not have permission to perform this action.');
  }

  // Dynamically import the AI flow implementation at runtime (server-side only)
  const { suggestKpisBasedOnPerformance } = await import('@/ai/flows/suggest-kpis-based-on-performance');
  return suggestKpisBasedOnPerformance(input);
}


