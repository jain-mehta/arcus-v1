
'use server';

import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

// Database types for Material Mapping and Purchase Order - using Supabase tables
interface MaterialMapping {
  id: string;
  vendor_id: string;
  product_id: string;
  vendor_product_name?: string;
  vendor_price: number;
  discount_percentage?: number;
  final_price: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  vendor_id: string;
  vendor_name?: string;
  total_amount: number;
  line_items: any[];
  delivery_date?: string;
  status: string;
  payment_status?: string;
  organization_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getMaterialMappings(vendorId: string): Promise<ActionResponse<MaterialMapping[]>> {
    const authCheck = await checkActionPermission('vendor', 'purchase-orders', 'view');
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

        // Fetch material mappings from Supabase
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

export async function createPurchaseOrder(data: any): Promise<ActionResponse<PurchaseOrder>> {
    const authCheck = await checkActionPermission('vendor', 'purchase-orders', 'create');
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

        // Create purchase order in Supabase
        const { data: newPO, error } = await supabase
            .from('purchase_orders')
            .insert({
                vendor_id: data.vendorId,
                vendor_name: data.vendorName,
                total_amount: data.totalAmount,
                line_items: data.lineItems || [],
                delivery_date: data.deliveryDate,
                status: 'Pending',
                payment_status: 'Pending',
                organization_id: user.orgId || 'default-org',
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('[createPurchaseOrder] Error:', error);
            return createErrorResponse('Failed to create purchase order in database');
        }

        await logUserAction(user, 'create', 'purchase_order', newPO.id, { vendorId: data.vendorId });
        revalidatePath('/dashboard/vendor/purchase-orders');
        return createSuccessResponse(newPO, 'Purchase order created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create purchase order: ${error.message}`);
    }
}


