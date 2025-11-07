
'use server';

// Removed mock data imports - now using real Supabase data
import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getVendors(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'list', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        // Fetch vendors from Supabase
        const { data: vendors, error } = await supabase
            .from('vendors')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getVendors] Error:', error);
            return createErrorResponse('Failed to fetch vendors from database');
        }

        await logUserAction(user, 'view', 'vendor_list');
        return createSuccessResponse(vendors || [], 'Vendors retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get vendors: ${error.message}`);
    }
}

export async function approveVendor(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'list', 'approve');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        // Update vendor status to approved
        const { error } = await supabase
            .from('vendors')
            .update({
                status: 'Active',
                approved_at: new Date().toISOString(),
                approved_by: user.id
            })
            .eq('id', id);

        if (error) {
            console.error('[approveVendor] Error:', error);
            return createErrorResponse('Failed to approve vendor in database');
        }

        await logUserAction(user, 'approve', 'vendor', id);
        revalidatePath('/dashboard/vendor/list');
        revalidatePath(`/dashboard/vendor/profile/${id}`);
        return createSuccessResponse({ success: true }, 'Vendor approved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to approve vendor: ${error.message}`);
    }
}

export async function rejectVendor(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'list', 'reject');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        // Update vendor status to rejected
        const { error } = await supabase
            .from('vendors')
            .update({
                status: 'Rejected',
                rejected_at: new Date().toISOString(),
                rejected_by: user.id
            })
            .eq('id', id);

        if (error) {
            console.error('[rejectVendor] Error:', error);
            return createErrorResponse('Failed to reject vendor in database');
        }

        await logUserAction(user, 'reject', 'vendor', id);
        revalidatePath('/dashboard/vendor/list');
        revalidatePath(`/dashboard/vendor/profile/${id}`);
        return createSuccessResponse({ success: true }, 'Vendor rejected successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to reject vendor: ${error.message}`);
    }
}

export async function deleteVendor(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'list', 'delete');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        // Soft delete vendor by updating status and setting deleted_at
        const { error } = await supabase
            .from('vendors')
            .update({
                status: 'Deleted',
                deleted_at: new Date().toISOString(),
                deleted_by: user.id
            })
            .eq('id', id);

        if (error) {
            console.error('[deleteVendor] Error:', error);
            return createErrorResponse('Failed to delete vendor in database');
        }

        await logUserAction(user, 'delete', 'vendor', id);
        revalidatePath('/dashboard/vendor/list');
        return createSuccessResponse({ success: true }, 'Vendor deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete vendor: ${error.message}`);
    }
}


