
'use server';

import { revalidatePath } from 'next/cache';
import { 
    checkActionPermission,
    createSuccessResponse,
    createErrorResponse,
    logUserAction,
    type ActionResponse
} from '@/lib/actions-utils';

export async function getAllRoles(): Promise<ActionResponse<any[]>> {
    const authCheck = await checkActionPermission('users', 'roles', 'read');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');

        const { data: roles, error } = await supabase
            .from('roles')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org');

        if (error) {
            throw new Error(error.message);
        }

        await logUserAction(user, 'read', 'roles');
        return createSuccessResponse(roles || [], 'Roles retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get roles: ${error.message}`);
    }
}
