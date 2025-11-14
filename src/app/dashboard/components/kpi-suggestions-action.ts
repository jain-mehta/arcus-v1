'use server';

import type {
  SuggestKpisBasedOnPerformanceInput,
  SuggestKpisBasedOnPerformanceOutput,
} from '@/ai/flows/suggest-kpis-based-on-performance';
import { getSupabaseServerClient } from '@/lib/supabase/client';

// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserContext {
  user: User;
  permissions: string[];
  subordinates: User[];
  orgId: string;
}

// Get current user from Supabase
async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return user;
}

// Get user permissions
async function getUserPermissions(userId: string): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  // Get user roles and permissions from database
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);

  if (!roles?.length) return [];

  const { data: permissions } = await supabase
    .from('role_permissions')
    .select('permission')
    .in('role_id', roles.map(r => r.role_id));

  return permissions?.map(p => p.permission) || [];
}

// Get subordinates
async function getSubordinates(userId: string): Promise<User[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: subordinates } = await supabase
    .from('users')
    .select('*')
    .eq('manager_id', userId);

  return subordinates || [];
}

async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user?.id || 'user-admin';
}

async function buildUserContext(userId: string): Promise<UserContext> {
  const [user, permissions, subordinates] = await Promise.all([
    getCurrentUser(),
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
    orgId: user.organization_id || '',
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