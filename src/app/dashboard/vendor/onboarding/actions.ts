
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

// Database types for Vendor module - using Supabase tables
interface Vendor {
  id: string;
  name: string;
  category?: string;
  status: string;
  on_time_delivery?: number;
  quality_score?: number;
  avg_response_time?: string;
  operational_region?: string;
  payment_terms?: string;
  preferred_payment_method?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  gstin?: string;
  pan_number?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  organization_id?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface VendorDocument {
  id: string;
  vendor_id: string;
  name: string;
  type: 'License' | 'Contract' | 'Other';
  upload_date: string;
  status: string;
  file_url?: string;
  file_path?: string;
  organization_id?: string;
}



export async function createVendor(formData: FormData): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'onboarding', 'create');
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

        // Extract text fields from FormData
        const data: { [key: string]: any } = {};
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') {
                data[key] = value;
            }
        }

        // Create vendor record in Supabase
        const { data: newVendor, error } = await supabase
            .from('vendors')
            .insert({
                name: data.businessName,
                category: data.vendorCategory,
                status: 'Pending',
                on_time_delivery: 0,
                quality_score: 0,
                avg_response_time: 'N/A',
                operational_region: data.operationalRegion,
                payment_terms: data.paymentTerms,
                preferred_payment_method: data.preferredPaymentMethod,
                contact_name: data.contactName,
                contact_email: data.contactEmail,
                contact_phone: data.contactPhone,
                address: data.businessAddress,
                website: data.website,
                gstin: data.gstin,
                pan_number: data.panNumber,
                bank_name: data.bankName,
                account_holder_name: data.accountHolderName,
                account_number: data.accountNumber,
                ifsc_code: data.ifscCode,
                organization_id: user.orgId || 'default-org',
                owner_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('[createVendor] Error:', error);
            return createErrorResponse('Failed to create vendor in database');
        }

        // Process and store file uploads as vendor documents
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
                };

                const docType = docTypeMap[key as keyof typeof docTypeMap] || 'Other';
                const docName = docNameMap[key as keyof typeof docNameMap] || value.name;

                // Store document record in Supabase
                const { error: docError } = await supabase
                    .from('vendor_documents')
                    .insert({
                        vendor_id: newVendor.id,
                        name: docName,
                        type: docType as VendorDocument['type'],
                        upload_date: new Date().toISOString(),
                        status: 'Active',
                        // In a real app, you would upload to a file storage service
                        // and store the actual URL and path here.
                        file_url: '#', // TODO: Implement file upload to storage
                        file_path: `vendors/${newVendor.id}/${value.name}`,
                        organization_id: user.orgId || 'default-org'
                    });

                if (docError) {
                    console.error('[createVendor] Document upload error:', docError);
                    // Continue processing even if document upload fails
                }
            }
        }

        await logUserAction(user, 'create', 'vendor', newVendor.id, { vendorName: newVendor.name });
        revalidatePath('/dashboard/vendor/list');
        revalidatePath('/dashboard/vendor/profile/*');
        redirect('/dashboard/vendor/list');
        return createSuccessResponse(newVendor, 'Vendor created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create vendor: ${error.message}`);
    }
}


