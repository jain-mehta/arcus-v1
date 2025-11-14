'use server';

import { revalidatePath } from "next/cache";
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getUserProfile(): Promise<ActionResponse<User | null>> {
    const authCheck = await checkActionPermission('settings', 'profile', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const profile = await getCurrentUser();
        await logUserAction(user, 'view', 'user_profile');
        return createSuccessResponse(profile, 'User profile retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get user profile: ${error.message}`);
    }
}

export async function getActiveSessionsForCurrentUser(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('settings', 'profile', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return createErrorResponse('Current user not found');
        }
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', currentUser.id);

        if (error) return createErrorResponse('Failed to retrieve sessions');

        await logUserAction(user, 'view', 'active_sessions');
        return createSuccessResponse(sessions ?? [], 'Active sessions retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get active sessions: ${error.message}`);
    }
}

export async function revokeSessionById(sessionId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('settings', 'profile', 'update');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        
        const { error } = await supabase.from('user_sessions').delete().eq('id', sessionId);
        if (error) return createErrorResponse('Failed to revoke session');
        
        await logUserAction(user, 'delete', 'session', sessionId, {});
        return createSuccessResponse(null, 'Session revoked successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to revoke session: ${error.message}`);
    }
}

export async function updateCurrentUserProfile(data: Partial<User>): Promise<ActionResponse<User>> {
    const authCheck = await checkActionPermission('settings', 'profile', 'update');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        
        const { data: updatedUser, error } = await supabase.from('users').update(data).eq('id', user.id).select().single();
        if (error) return createErrorResponse('Failed to update profile');
        
        await logUserAction(user, 'update', 'user_profile', user.id, { changes: data });
        revalidatePath('/dashboard/settings/profile');
        return createSuccessResponse(updatedUser as User, 'Profile updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update profile: ${error.message}`);
    }
}

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

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
  
  if (error) return null;
  
  return user as User;
}

