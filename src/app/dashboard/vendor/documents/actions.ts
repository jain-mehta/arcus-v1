
'use server';

import { getVendorDocuments as getVendorDocumentsFromDb, MOCK_VENDOR_DOCUMENTS, MOCK_VENDORS } from '@/lib/firebase/firestore';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getVendors() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

    return MOCK_VENDORS;
}

export async function getDocumentsForVendor(vendorId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  return await getVendorDocumentsFromDb(vendorId);
}

export async function uploadDocument(vendorId: string, docData: any, fileBase64: string, fileName: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  console.log('Mock uploadDocument:', vendorId, docData, fileName);
  const newDoc = {
      id: `doc-${Date.now()}`,
      vendorId,
      ...docData,
      uploadDate: new Date().toISOString(),
      status: 'Active',
      fileName: fileName,
      fileUrl: fileBase64, // Using base64 for mock display
      filePath: `mock/${fileName}`
  }
  MOCK_VENDOR_DOCUMENTS.push(newDoc);
  revalidatePath(`/dashboard/vendor/documents`);
  revalidatePath(`/dashboard/vendor/profile/${vendorId}`);
  return newDoc;
}
export async function deleteVendorDocument(docId: string, filePath: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  console.log('Mock deleteVendorDocument:', docId, filePath);
  const index = MOCK_VENDOR_DOCUMENTS.findIndex(d => d.id === docId);
  if(index > -1) {
    MOCK_VENDOR_DOCUMENTS.splice(index, 1);
  }
  revalidatePath('/dashboard/vendor/documents');
  revalidatePath('/dashboard/vendor/profile/*');
  return { success: true };
}
