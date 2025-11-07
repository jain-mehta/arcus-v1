'use server';

import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

// Database types for Material Mapping and Volume Discount - using Supabase tables
interface MaterialMapping {
  id: string;
  vendor_id: string;
  product_id: string;
  vendor_product_name?: string;
  vendor_price: number;
  discount_percentage?: number;
  final_price: number;
  active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface VolumeDiscount {
  id: string;
  mapping_id: string;
  min_quantity: number;
  max_quantity?: number;
  discount_percentage: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getMaterialMappings(vendorId: string): Promise<ActionResponse<MaterialMapping[]>> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'view');
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

        const { data: mappings, error } = await supabase
            .from('material_mappings')
            .select('*')
            .eq('vendor_id', vendorId)
            .eq('organization_id', user.orgId || 'default-org')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getMaterialMappings] Error:', error);
            return createErrorResponse('Failed to fetch material mappings from database');
        }

        await logUserAction(user, 'view', 'material_mappings', vendorId, { count: mappings?.length });
        return createSuccessResponse(mappings || [], 'Material mappings retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get material mappings: ${error.message}`);
    }
}

export async function getVolumeDiscounts(mappingId: string): Promise<ActionResponse<VolumeDiscount[]>> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'view');
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

        const { data: discounts, error } = await supabase
            .from('volume_discounts')
            .select('*')
            .eq('mapping_id', mappingId)
            .eq('organization_id', user.orgId || 'default-org')
            .order('min_quantity', { ascending: true });

        if (error) {
            console.error('[getVolumeDiscounts] Error:', error);
            return createErrorResponse('Failed to fetch volume discounts from database');
        }

        await logUserAction(user, 'view', 'volume_discounts', mappingId, { count: discounts?.length });
        return createSuccessResponse(discounts || [], 'Volume discounts retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get volume discounts: ${error.message}`);
    }
}

export async function addMaterialMapping(
    vendorId: string,
    data: Omit<MaterialMapping, 'id' | 'vendor_id' | 'active' | 'organization_id' | 'created_at' | 'updated_at'>
): Promise<ActionResponse<{ id: string }>> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'create');
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

        const { data: newMapping, error } = await supabase
            .from('material_mappings')
            .insert({
                vendor_id: vendorId,
                product_id: data.product_id,
                vendor_product_name: data.vendor_product_name,
                vendor_price: data.vendor_price,
                discount_percentage: data.discount_percentage || 0,
                final_price: data.final_price,
                active: true,
                organization_id: user.orgId || 'default-org'
            })
            .select()
            .single();

        if (error) {
            console.error('[addMaterialMapping] Error:', error);
            return createErrorResponse('Failed to create material mapping in database');
        }

        await logUserAction(user, 'create', 'material_mapping', newMapping.id, {
            vendorId,
            productId: data.product_id
        });
        revalidatePath('/dashboard/vendor/material-mapping');
        return createSuccessResponse({ id: newMapping.id }, 'Material mapping created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create material mapping: ${error.message}`);
    }
}

export async function updateMaterialMappings(mappings: Partial<MaterialMapping>[]): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'edit');
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

        // Update each mapping
        const updatePromises = mappings.map(async (update) => {
            if (!update.id) return;

            const { error } = await supabase
                .from('material_mappings')
                .update({
                    vendor_product_name: update.vendor_product_name,
                    vendor_price: update.vendor_price,
                    discount_percentage: update.discount_percentage,
                    final_price: update.final_price,
                    active: update.active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', update.id)
                .eq('organization_id', user.orgId || 'default-org');

            if (error) {
                console.error(`[updateMaterialMappings] Error updating mapping ${update.id}:`, error);
                throw error;
            }
        });

        await Promise.all(updatePromises);

        await logUserAction(user, 'update', 'material_mappings', 'bulk', { count: mappings.length });
        revalidatePath('/dashboard/vendor/material-mapping');
        return createSuccessResponse(null, 'Material mappings updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update material mappings: ${error.message}`);
    }
}

export async function deleteMaterialMapping(mappingId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'delete');
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

        // Soft delete by setting active to false
        const { error } = await supabase
            .from('material_mappings')
            .update({
                active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', mappingId)
            .eq('organization_id', user.orgId || 'default-org');

        if (error) {
            console.error('[deleteMaterialMapping] Error:', error);
            return createErrorResponse('Failed to delete material mapping in database');
        }

        await logUserAction(user, 'delete', 'material_mapping', mappingId);
        revalidatePath('/dashboard/vendor/material-mapping');
        return createSuccessResponse(null, 'Material mapping deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete material mapping: ${error.message}`);
    }
}

export async function addVolumeDiscount(
    data: Omit<VolumeDiscount, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
): Promise<ActionResponse<{ id: string }>> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'create');
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

        const { data: newDiscount, error } = await supabase
            .from('volume_discounts')
            .insert({
                mapping_id: data.mapping_id,
                min_quantity: data.min_quantity,
                max_quantity: data.max_quantity,
                discount_percentage: data.discount_percentage,
                organization_id: user.orgId || 'default-org'
            })
            .select()
            .single();

        if (error) {
            console.error('[addVolumeDiscount] Error:', error);
            return createErrorResponse('Failed to create volume discount in database');
        }

        await logUserAction(user, 'create', 'volume_discount', newDiscount.id, {
            mappingId: data.mapping_id
        });
        revalidatePath('/dashboard/vendor/material-mapping');
        return createSuccessResponse({ id: newDiscount.id }, 'Volume discount created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create volume discount: ${error.message}`);
    }
}

export async function updateVolumeDiscounts(discounts: Partial<VolumeDiscount>[]): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'edit');
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

        // Update each discount
        const updatePromises = discounts.map(async (update) => {
            if (!update.id) return;

            const { error } = await supabase
                .from('volume_discounts')
                .update({
                    min_quantity: update.min_quantity,
                    max_quantity: update.max_quantity,
                    discount_percentage: update.discount_percentage,
                    updated_at: new Date().toISOString()
                })
                .eq('id', update.id)
                .eq('organization_id', user.orgId || 'default-org');

            if (error) {
                console.error(`[updateVolumeDiscounts] Error updating discount ${update.id}:`, error);
                throw error;
            }
        });

        await Promise.all(updatePromises);

        await logUserAction(user, 'update', 'volume_discounts', 'bulk', { count: discounts.length });
        revalidatePath('/dashboard/vendor/material-mapping');
        return createSuccessResponse(null, 'Volume discounts updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update volume discounts: ${error.message}`);
    }
}

export async function deleteVolumeDiscount(discountId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'material-mapping', 'delete');
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

        // Hard delete for volume discounts
        const { error } = await supabase
            .from('volume_discounts')
            .delete()
            .eq('id', discountId)
            .eq('organization_id', user.orgId || 'default-org');

        if (error) {
            console.error('[deleteVolumeDiscount] Error:', error);
            return createErrorResponse('Failed to delete volume discount in database');
        }

        await logUserAction(user, 'delete', 'volume_discount', discountId);
        revalidatePath('/dashboard/vendor/material-mapping');
        return createSuccessResponse(null, 'Volume discount deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete volume discount: ${error.message}`);
    }
}