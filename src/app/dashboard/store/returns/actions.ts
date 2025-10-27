
'use server';

import { MOCK_ORDERS, MOCK_PRODUCTS, getCurrentUser } from '@/lib/mock-data/firestore';
import { assertUserPermission } from '@/lib/mock-data/rbac';
import type { Order } from '@/lib/mock-data/types';
import { revalidatePath } from 'next/cache';

export async function findOrderForReturn(orderNumber: string, storeId: string): Promise<Order | null> {
    // In a real app, this would be a database query scoped by storeId.
    const order = MOCK_ORDERS.find(o => o.orderNumber === orderNumber && o.storeId === storeId);
    return order || null;
}

export async function processReturn(
    orderId: string, 
    returnItems: { productId: string; quantity: number; action: 'return_to_inventory' | 'mark_as_damaged' }[]
): Promise<{ success: boolean; message?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Unauthenticated');
        // Ensure user can manage store inventory or manage stores
        await assertUserPermission(user.id, 'manage-store-inventory');

        const order = MOCK_ORDERS.find(o => o.id === orderId);
        if (!order) {
            throw new Error("Order not found.");
        }
        if (!order.storeId) {
            throw new Error("Cannot process return for an order with no associated store.");
        }

        for (const item of returnItems) {
            if (item.action === 'return_to_inventory') {
                // Find the specific product within the specific store's inventory.
                const productIndex = MOCK_PRODUCTS.findIndex(p => 
                    p.id === item.productId && 
                    p.inventoryType === 'Store' && 
                    p.storeId === order.storeId
                );
                
                if (productIndex > -1) {
                    MOCK_PRODUCTS[productIndex].quantity += item.quantity;
                } else {
                    // This case is unlikely if data is consistent but good to handle.
                    console.warn(`Product ${item.productId} not found in store inventory (Store ID: ${order.storeId}) for return.`);
                    // Even if not found, we don't block the return process itself.
                }
            }
            // If item is 'mark_as_damaged', we do nothing to the inventory count.
            // A real system might move it to a 'damaged' inventory location.
        }

        // In a real app, we would also create a credit note record and potentially adjust financials.
        console.log('Processed return for order:', orderId, returnItems);
        
        // Revalidate paths to ensure data freshness across the app
        revalidatePath('/dashboard/store/returns');
        revalidatePath('/dashboard/store/inventory');
        revalidatePath(`/dashboard/store/profile/${order.storeId}`);

        return { success: true };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}


