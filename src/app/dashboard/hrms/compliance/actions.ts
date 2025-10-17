
'use server';

import { MOCK_COMPLIANCE_DOCS } from "@/lib/firebase/firestore";
import { revalidatePath } from "next/cache";
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';


export async function getComplianceDocuments() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    // In a real app, you would apply user-specific filtering here.
    return MOCK_COMPLIANCE_DOCS;
}

export async function uploadComplianceDocument(
    docData: { name: string; category: string },
    fileBase64: string
): Promise<{ success: boolean; newDoc?: any; message?: string }> {
    try {
        const newDoc = {
            id: `doc-${Date.now()}`,
            name: docData.name,
            category: docData.category,
            uploadDate: new Date().toISOString(),
            fileName: 'mock_file.pdf',
            fileUrl: '#', // In a real app, this would be a download URL from storage
            filePath: `mock/compliance/${Date.now()}_mock_file.pdf`,
        };
        MOCK_COMPLIANCE_DOCS.unshift(newDoc);
        revalidatePath('/dashboard/hrms/compliance');
        return { success: true, newDoc };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteComplianceDocument(
    docId: string,
    filePath: string
): Promise<{ success: boolean; message?: string }> {
    const index = MOCK_COMPLIANCE_DOCS.findIndex(doc => doc.id === docId);
    if (index > -1) {
        MOCK_COMPLIANCE_DOCS.splice(index, 1);
        revalidatePath('/dashboard/hrms/compliance');
        // In a real app, you would also delete the file from storage using the filePath
        console.log(`(Simulated) Deleting file from storage at: ${filePath}`);
        return { success: true };
    }
    return { success: false, message: 'Document not found.' };
}
