
'use server';

import { MOCK_VENDORS, MOCK_ORGANIZATION_ID, MOCK_VENDOR_DOCUMENTS, createVendorInDb } from '@/lib/mock-data/firestore';
import { getUser, getUserPermissions, getSubordinates, assertUserPermission } from '@/lib/mock-data/rbac';
import type { Vendor, UserContext, VendorDocument } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../sales/actions';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

// MOCK: In a real app, this would get the logged-in user's ID from the session.
async function _getCurrentUserId(): Promise<string> {
    const user = await getCurrentUser();
    return user?.id || 'user-admin';
}

async function buildUserContext(userId: string): Promise<UserContext> {
    const [user, permissions, subordinates] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
        getSubordinates(userId)
    ]);

    if (!user) {
        throw new Error("User not found, cannot build user context.");
    }

    return {
        user,
        permissions,
        subordinates,
        orgId: user.orgId || MOCK_ORGANIZATION_ID,
    };
}


export async function createVendor(formData: FormData) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'create');

  const userId = await _getCurrentUserId();
  const userContext = await buildUserContext(userId);

  // Require 'manage-vendors' permission to onboard/create vendors.
  await assertUserPermission(userId, 'manage-vendors');

  // Extract text fields
  const data: { [key: string]: any } = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      data[key] = value;
    }
  }
  
  const newVendorId = `vendor-${Date.now()}`;

  // Process and "store" file uploads
  for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
          const docTypeMap = {
              visitingCard: 'Other',
              businessLicense: 'License',
              signedContract: 'Contract',
              bankProof: 'Other',
              otherDocuments: 'Other'
          };
          const docNameMap = {
              visitingCard: 'Visiting Card',
              businessLicense: 'Business License',
              signedContract: 'Signed Contract',
              bankProof: 'Bank Account Proof',
              otherDocuments: 'Other Supporting Document'
          }

          const docType = docTypeMap[key as keyof typeof docTypeMap] || 'Other';
          const docName = docNameMap[key as keyof typeof docNameMap] || value.name;
          
          const newDoc: VendorDocument = {
            id: `doc-${Date.now()}-${key}`,
            vendorId: newVendorId,
            name: docName,
            type: docType as VendorDocument['type'],
            uploadDate: new Date().toISOString(),
            status: 'Active',
            // In a real app, you would upload to a service like Firebase Storage
            // and store the URL and path here.
            fileUrl: '#', 
            filePath: `mock/${newVendorId}/${value.name}`
          };
          MOCK_VENDOR_DOCUMENTS.push(newDoc);
      }
  }


  const newVendor: Vendor = {
    id: newVendorId,
    name: data.businessName,
    category: data.vendorCategory,
    status: 'Pending Approval',
    onTimeDelivery: 0,
    qualityScore: 0,
    avgResponseTime: 'N/A',
    operationalRegion: data.operationalRegion,
    paymentTerms: data.paymentTerms,
    preferredPaymentMethod: data.preferredPaymentMethod,
    contact: {
      name: data.contactName,
      email: data.contactEmail,
      phone: data.contactPhone,
    },
    address: data.businessAddress,
    website: data.website,
    tax: {
      gstin: data.gstin,
      panNumber: data.panNumber,
    },
    banking: {
      bankName: data.bankName,
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
    },
  };

  // If running on the server with admin credentials available, persist via admin SDK.
  try {
    // createVendorInDb will throw if admin is not initialized; fall back to in-memory mock.
    const saved = await createVendorInDb({ ...newVendor, orgId: userContext.orgId || MOCK_ORGANIZATION_ID, ownerId: userId } as any);
    revalidatePath('/dashboard/vendor/list');
    revalidatePath('/dashboard/vendor/profile/*');
    redirect('/dashboard/vendor/list');
    return saved;
  } catch (err) {
    // fallback to mock for local/dev
  MOCK_VENDORS.push({ ...newVendor, orgId: userContext.orgId || MOCK_ORGANIZATION_ID, ownerId: userId } as any);
    revalidatePath('/dashboard/vendor/list');
    revalidatePath('/dashboard/vendor/profile/*');
    redirect('/dashboard/vendor/list');
  }
}


