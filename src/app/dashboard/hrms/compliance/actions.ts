'use server';

import { revalidatePath } from "next/cache";
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getComplianceDocuments(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'compliance', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // In a real app, you would apply user-specific filtering here.
        await logUserAction(user, 'view', 'compliance_documents');
        return createSuccessResponse([], 'Compliance documents retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get compliance documents: ${error.message}`);
    }
}

export async function uploadComplianceDocument(
    docData: { name: string; category: string },
    fileBase64: string
): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'compliance', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const newDoc = {
            id: `comp-doc-${Date.now()}`,
            ...docData,
            uploadDate: new Date().toISOString(),
            fileUrl: fileBase64,
            filePath: `compliance/${docData.name}`
        };
        
        // Insert document into database
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        
        const { error: insertError } = await supabase.from('compliance_documents').insert(newDoc);
        if (insertError) return createErrorResponse('Failed to upload document');
        
        await logUserAction(user, 'create', 'compliance_document', newDoc.id, { category: docData.category });
        revalidatePath('/dashboard/hrms/compliance');
        return createSuccessResponse(newDoc, 'Compliance document uploaded successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to upload compliance document: ${error.message}`);
    }
}

export async function deleteComplianceDocument(documentId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('hrms', 'compliance', 'delete');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Delete from storage
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        
const { error } = await supabase.from('compliance_documents').delete().eq('id', documentId);
if (error) return createErrorResponse('Failed to delete document');

await logUserAction(user, 'delete', 'compliance_document', documentId);
revalidatePath('/dashboard/hrms/compliance');
return createSuccessResponse(null, 'Compliance document deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete compliance document: ${error.message}`);
    }
}

import { getSupabaseServerClient } from '@/lib/supabase/client';
