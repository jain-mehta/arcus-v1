'use server';

import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';
import { getSupabaseServerClient } from '@/lib/supabase/client';

// --- Data Fetching ---

export async function getAnnouncements(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'announcements', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const { data: announcements } = await supabase
            .from('announcements')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org')
            .order('created_at', { ascending: false });

        await logUserAction(user, 'view', 'announcements', undefined, { count: announcements?.length || 0 });
        return createSuccessResponse(announcements || [], 'Announcements retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get announcements: ${error.message}`);
    }
}

export async function getPolicies(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'policies', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const { data: policies } = await supabase
            .from('policies')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org')
            .order('name');

        await logUserAction(user, 'view', 'policies', undefined, { count: policies?.length || 0 });
        return createSuccessResponse(policies || [], 'Policies retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get policies: ${error.message}`);
    }
}

export async function getCurrentUser(): Promise<ActionResponse> {
    try {
        const user = await getCurrentUserFromSession();
        if (!user) {
            return createErrorResponse('No user found in session');
        }
        return createSuccessResponse(user, 'User retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get current user: ${error.message}`);
    }
}

// --- Mutations ---

export async function createAnnouncement(data: {
    title: string;
    content: string;
}): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'announcements', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const newAnnouncement = {
            title: data.title,
            content: data.content,
            author_id: user.id,
            organization_id: user.orgId || 'default-org',
        };

        const { data: announcement, error } = await supabase
            .from('announcements')
            .insert(newAnnouncement)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        await logUserAction(user, 'create', 'announcement', announcement.id, data);
        revalidatePath('/dashboard/hrms/announcements');
        return createSuccessResponse(announcement, 'Announcement created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create announcement: ${error.message}`);
    }
}

export async function deleteAnnouncement(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'announcements', 'delete');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id)
            .eq('organization_id', user.orgId || 'default-org');

        if (error) {
            throw new Error(error.message);
        }

        await logUserAction(user, 'delete', 'announcement', id);
        revalidatePath('/dashboard/hrms/announcements');
        return createSuccessResponse(null, 'Announcement deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete announcement: ${error.message}`);
    }
}

export async function uploadPolicy(data: {
    name: string;
    version: string;
    file?: File;
}): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'policies', 'upload');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        // TODO: Implement file upload to storage
        const fileUrl = '#'; // Placeholder until storage is implemented

        const newPolicy = {
            name: data.name,
            version: data.version,
            file_name: data.file?.name || 'policy',
            file_url: fileUrl,
            organization_id: user.orgId || 'default-org',
        };

        const { data: policy, error } = await supabase
            .from('policies')
            .insert(newPolicy)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        await logUserAction(user, 'upload', 'policy', policy.id, { ...data });
        revalidatePath('/dashboard/hrms/announcements');
        return createSuccessResponse(policy, 'Policy uploaded successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to upload policy: ${error.message}`);
    }
}

export async function deletePolicy(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'policies', 'delete');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const { error } = await supabase
            .from('policies')
            .delete()
            .eq('id', id)
            .eq('organization_id', user.orgId || 'default-org');

        if (error) {
            throw new Error(error.message);
        }

        await logUserAction(user, 'delete', 'policy', id);
        revalidatePath('/dashboard/hrms/announcements');
        return createSuccessResponse(null, 'Policy deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete policy: ${error.message}`);
    }
}

export async function getUserPermissions(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'announcements', 'read');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const { data: permissions, error } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            throw new Error(error.message);
        }

        await logUserAction(user, 'read', 'user_permissions');
        return createSuccessResponse(permissions || [], 'User permissions retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get user permissions: ${error.message}`);
    }
}