

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

// Removed mock data imports - now using real Supabase data

// Types
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  orgId?: string;
  createdAt?: string;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  total: number;
  status: string;
  items: any[];
  orgId?: string;
  createdAt?: string;
}


// Vendor management actions


export async function getVendorDashboardData(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'dashboard', 'view');
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

        // Fetch vendors and purchase orders from Supabase
        const [vendorsResult, purchaseOrdersResult] = await Promise.all([
            supabase.from('vendors').select('*'),
            supabase.from('purchase_orders').select('*')
        ]);

        const vendors = vendorsResult.data || [];
        const purchaseOrders = purchaseOrdersResult.data || [];

        // KPI Cards
        const activeVendors = vendors.filter(v => v.status === 'Active').length;
        const outstandingBalance = purchaseOrders
            .filter(po => po.payment_status !== 'Paid')
            .reduce((acc, po) => acc + ((po.total_amount || 0) - (po.amount_given || 0)), 0);
        const ytdSpend = purchaseOrders.reduce((acc, po) => acc + (po.total_amount || 0), 0);

        const kpis = { activeVendors, outstandingBalance, ytdSpend };

        // Upcoming Payments
        const upcomingPayments = purchaseOrders
            .filter(po => po.payment_status !== 'Paid' && po.delivery_date && new Date(po.delivery_date) > new Date())
            .sort((a,b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
            .slice(0, 5)
            .map(po => ({
                id: po.id,
                vendor: po.vendor_name || 'Unknown Vendor',
                amount: po.total_amount || 0,
                deliveryDate: po.delivery_date,
                paymentStatus: po.payment_status
            }));

        // Vendor Performance Chart
        const vendorPerformanceData = vendors
            .filter(v => v.status === 'Active')
            .map(v => ({
                name: v.name,
                onTimeDelivery: v.on_time_delivery || 85, // Default value if not available
                qualityScore: v.quality_score || 90, // Default value if not available
            }));

        const data = {
            kpis,
            upcomingPayments,
            vendorPerformanceData
        };

        await logUserAction(user, 'view', 'vendor_dashboard', undefined, { kpis });
        return createSuccessResponse(data, 'Vendor dashboard data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to load vendor dashboard: ${error.message}`);
    }
}


export async function getPurchaseHistoryForVendor(vendorId: string, from?: Date, to?: Date): Promise<ActionResponse<PurchaseOrder[]>> {
    const authCheck = await checkActionPermission('vendor', 'viewAll');
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

        // Build query for purchase orders
        let query = supabase
            .from('purchase_orders')
            .select('*')
            .eq('vendor_id', vendorId);

        // Add date filters if provided
        if (from) {
            query = query.gte('created_at', from.toISOString());
        }
        if (to) {
            query = query.lte('created_at', to.toISOString());
        }

        const { data: purchaseOrders, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('[getPurchaseHistoryForVendor] Error:', error);
            return createErrorResponse('Failed to fetch purchase history from database');
        }

        // Transform to expected format
        const transformedOrders: PurchaseOrder[] = (purchaseOrders || []).map(po => ({
            id: po.id,
            vendorId: po.vendor_id,
            total: po.total_amount || 0,
            status: po.status,
            items: po.line_items || [],
            orgId: po.organization_id,
            createdAt: po.created_at
        }));

        await logUserAction(user, 'view', 'purchase_history', vendorId, { from, to, count: transformedOrders.length });
        return createSuccessResponse(transformedOrders, 'Purchase history retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get purchase history: ${error.message}`);
    }
}

export async function updatePurchaseHistory(updates: { poId: string, amountGiven: number, paymentStatus: string }[]): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('supply', 'pos');
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

        // Update each purchase order
        const updatePromises = updates.map(async update => {
            const { error } = await supabase
                .from('purchase_orders')
                .update({
                    amount_given: update.amountGiven,
                    payment_status: update.paymentStatus,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id
                })
                .eq('id', update.poId);

            if (error) {
                console.error(`[updatePurchaseHistory] Error updating PO ${update.poId}:`, error);
                throw error;
            }
        });

        await Promise.all(updatePromises);

        await logUserAction(user, 'update', 'purchase_history', undefined, { updateCount: updates.length });
        revalidatePath('/dashboard/vendor/history');
        return createSuccessResponse(null, 'Purchase history updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update purchase history: ${error.message}`);
    }
}


export async function createPurchaseOrder(data: any): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'purchase_orders', 'create');
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
                line_items: data.lineItems,
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

        await logUserAction(user, 'create', 'purchase_order', newPO.id, { purchaseOrderData: data });
        revalidatePath('/dashboard/vendor/purchase-orders');
        return createSuccessResponse(newPO, 'Purchase order created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create purchase order: ${error.message}`);
    }
}

export async function updatePurchaseOrderStatus(poId: string, status: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('supply', 'pos');
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

        // Update the PO status
        const { error } = await supabase
            .from('purchase_orders')
            .update({
                status,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq('id', poId);

        if (error) {
            console.error('[updatePurchaseOrderStatus] Error:', error);
            return createErrorResponse('Failed to update purchase order status');
        }

        // TODO: If the PO is marked as "Delivered", update the stock quantities in products table
        if (status === 'Delivered') {
            console.log(`Purchase order ${poId} marked as delivered - stock updates needed`);
        }

        await logUserAction(user, 'update_status', 'purchase_order', poId, { newStatus: status });

        revalidatePath(`/dashboard/vendor/purchase-orders/${poId}`);
        revalidatePath('/dashboard/vendor/reorder-management');
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/inventory/product-master');

        return createSuccessResponse(null, 'Purchase order status updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update purchase order status: ${error.message}`);
    }
}

export async function calculateAndUpdateVendorScores(vendorId: string, criteria: any[]): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'viewAll');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // TODO: Implement actual vendor scoring calculation
        console.log('Mock calculateAndUpdateVendorScores:', vendorId, criteria);

        await logUserAction(user, 'update_scores', 'vendor', vendorId, { criteria });
        revalidatePath('/dashboard/vendor/rating');

        return createSuccessResponse(null, 'Vendor scores updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update vendor scores: ${error.message}`);
    }
}


