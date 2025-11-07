
'use server';

import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getStoreShipments(storeId: string | undefined): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('store', 'receiving', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        if (!storeId) {
            return createSuccessResponse([], 'No store ID provided');
        }
        // In a real app, this would be a Firestore query.
        const shipments = [].filter(s => s.destinationStoreId === storeId && s.status === 'In Transit');
        await logUserAction(user, 'view', 'store_shipments', storeId);
        return createSuccessResponse(shipments, 'Store shipments retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get store shipments: ${error.message}`);
    }
}

export async function receiveShipment(shipmentId: string, receivedItems: { productId: string; name: string, sku: string; quantity: number }[], storeId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('store', 'receiving', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // This now contains the logic to update the mock database.
        for (const item of receivedItems) {
            // Find the store-specific product
            let productIndex = [].findIndex(p => p.sku === item.sku && p.inventoryType === 'Store' && p.storeId === storeId);

            if (productIndex > -1) {
                // If product exists in store, increment quantity
                [][productIndex].quantity += item.quantity;
            } else {
                // If product doesn't exist in the store, create it.
                // We need to find the master product details from the factory inventory.
                const factoryProduct = [].find(p => p.sku === item.sku.replace(/-S$/, '') && p.inventoryType === 'Factory');
                if (factoryProduct) {
                     const newStoreProduct = {
                        ...factoryProduct,
                        id: `prod-s-${Date.now()}-${Math.random()}`,
                        sku: item.sku,
                        name: item.name,
                        inventoryType: 'Store' as const,
                        storeId: storeId,
                        quantity: item.quantity
                    };
                    [].push(newStoreProduct);
                } else {
                    // This case should ideally not happen if data is consistent
                    console.error(`Master product details for ${item.name} (SKU: ${item.sku}) not found.`);
                    throw new Error(`Could not find master details for product ${item.name}.`);
                }
            }
        }

        // Mark the shipment as received in the mock data
        const shipmentIndex = [].findIndex(s => s.id === shipmentId);
        if (shipmentIndex > -1) {
            [].splice(shipmentIndex, 1); // Remove from active shipments
        }

        await logUserAction(user, 'create', 'shipment_received', shipmentId, { storeId, itemCount: receivedItems.length });
        revalidatePath('/dashboard/store/receiving');
        revalidatePath('/dashboard/store/inventory');
        revalidatePath(`/dashboard/store/profile/${storeId}`);

        return createSuccessResponse(null, 'Shipment received successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to receive shipment: ${error.message}`);
    }
}


\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n

// TODO: Replace with actual database queries
// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
