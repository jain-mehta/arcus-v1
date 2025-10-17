
'use server';

import { MOCK_PRODUCTS, MOCK_SHIPMENTS, getCurrentUser } from '@/lib/firebase/firestore';
import type { UserContext } from '@/lib/firebase/types';
import { assertUserPermission } from '@/lib/firebase/rbac';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getStoreShipments(storeId: string | undefined) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

    if (!storeId) return [];
    // In a real app, this would be a Firestore query.
    return MOCK_SHIPMENTS.filter(s => s.destinationStoreId === storeId && s.status === 'In Transit');
}

export async function receiveShipment(shipmentId: string, receivedItems: { productId: string; name: string, sku: string; quantity: number }[], storeId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'store', 'bills');

    // This now contains the logic to update the mock database.
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Unauthenticated');
        await assertUserPermission(user.id, 'manage-store-inventory');
        for (const item of receivedItems) {
            // Find the store-specific product
            let productIndex = MOCK_PRODUCTS.findIndex(p => p.sku === item.sku && p.inventoryType === 'Store' && p.storeId === storeId);

            if (productIndex > -1) {
                // If product exists in store, increment quantity
                MOCK_PRODUCTS[productIndex].quantity += item.quantity;
            } else {
                // If product doesn't exist in the store, create it.
                // We need to find the master product details from the factory inventory.
                const factoryProduct = MOCK_PRODUCTS.find(p => p.sku === item.sku.replace(/-S$/, '') && p.inventoryType === 'Factory');
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
                    MOCK_PRODUCTS.push(newStoreProduct);
                } else {
                    // This case should ideally not happen if data is consistent
                    console.error(`Master product details for ${item.name} (SKU: ${item.sku}) not found.`);
                    throw new Error(`Could not find master details for product ${item.name}.`);
                }
            }
        }
        
        // Mark the shipment as received in the mock data
        const shipmentIndex = MOCK_SHIPMENTS.findIndex(s => s.id === shipmentId);
        if (shipmentIndex > -1) {
            MOCK_SHIPMENTS.splice(shipmentIndex, 1); // Remove from active shipments
        }

        revalidatePath('/dashboard/store/receiving');
        revalidatePath('/dashboard/store/inventory');
        revalidatePath(`/dashboard/store/profile/${storeId}`);

        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
