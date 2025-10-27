
'use server';

import type { ExtractProductImageFromCatalogInput, ExtractProductImageFromCatalogOutput } from '@/ai/flows/extract-product-image-from-catalog';
import type { SuggestProductsFromCatalogTextOnlyInput, SuggestProductsFromCatalogTextOnlyOutput } from '@/ai/flows/suggest-products-from-catalog-text-only';
import {
  MOCK_ORGANIZATION_ID,
  addProduct as addProductToDb,
  updateProduct as updateProductInDb,
  deleteProduct as deleteProductFromDb,
  addStock as addStockToDb,
  deleteAllProducts as deleteAllProductsFromDb,
  simulateSale as simulateSaleInDb,
  dispatchStock as dispatchStockInDb,
  transferStock as transferStockInDb,
  getCurrentUser
} from '@/lib/mock-data/firestore';
import { assertUserPermission } from '@/lib/mock-data/rbac';
import { getUser, getSubordinates, getUserPermissions } from '@/lib/mock-data/rbac';
import type { Product, UserContext } from '@/lib/mock-data/types';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

/**
 * A helper function to build the full user context required for data access calls.
 */
async function buildUserContext(userId: string | null): Promise<UserContext | null> {
    if (!userId) return null;

    const [user, permissions, subordinates] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
        getSubordinates(userId)
    ]);

    if (!user) {
        console.warn("User not found, cannot build user context.");
        return null;
    }

    return {
        user,
        permissions,
        subordinates,
        orgId: user.orgId || MOCK_ORGANIZATION_ID,
    };
}

// MOCK: In a real app, this would get the logged-in user's ID from the session.
async function getCurrentUserId(): Promise<string | null> {
    const user = await getCurrentUser();
    return user ? user.id : null;
}

export async function addProduct(data: Omit<Product, 'id' | 'orgId'>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
      return { success: false, message: 'You do not have permission to add products.' };
    }

    // Enforce RBAC: require either manage-factory-inventory or manage-store-inventory
    try {
        await assertUserPermission(userContext.user.id, 'manage-factory-inventory');
    } catch (err) {
        // Try store permission as alternative
        try { await assertUserPermission(userContext.user.id, 'manage-store-inventory'); } catch (err2) {
            return { success: false, message: 'You do not have permission to add products.' };
        }
    }

    const newProduct = await addProductToDb(data, userContext);
    return { success: true, product: newProduct };
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'orgId'>>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
      return { success: false, message: 'You do not have permission to update products.' };
    }

    try {
        await assertUserPermission(userContext.user.id, 'manage-factory-inventory');
    } catch (err) {
        try { await assertUserPermission(userContext.user.id, 'manage-store-inventory'); } catch (err2) {
            return { success: false, message: 'You do not have permission to update products.' };
        }
    }

    // In a real app, we might add logic here to check if a shop owner is trying
    // to edit a product outside their store. The firestore.ts layer currently handles this.

    const result = await updateProductInDb(id, data, userContext);
    return result;
}

export async function deleteProduct(id: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
      return { success: false, message: 'You do not have permission to delete products.' };
    }

    try {
        await assertUserPermission(userContext.user.id, 'manage-factory-inventory');
    } catch (err) {
        try { await assertUserPermission(userContext.user.id, 'manage-store-inventory'); } catch (err2) {
            return { success: false, message: 'You do not have permission to delete products.' };
        }
    }
    
    const result = await deleteProductFromDb(id, userContext);
    return result;
}

export async function addStock(productId: string, quantity: number) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
      return { success: false, message: 'You do not have permission to add stock.' };
    }

    try {
        await assertUserPermission(userContext.user.id, 'manage-factory-inventory');
    } catch (err) {
        try { await assertUserPermission(userContext.user.id, 'manage-store-inventory'); } catch (err2) {
            return { success: false, message: 'You do not have permission to add stock.' };
        }
    }

    const result = await addStockToDb(productId, quantity, userContext);
    return result;
}

export async function dispatchStock(productId: string, quantity: number) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
      return { success: false, message: 'You do not have permission to dispatch stock.' };
    }

    try {
        await assertUserPermission(userContext.user.id, 'manage-factory-inventory');
    } catch (err) {
        try { await assertUserPermission(userContext.user.id, 'manage-store-inventory'); } catch (err2) {
            return { success: false, message: 'You do not have permission to dispatch stock.' };
        }
    }

    return dispatchStockInDb(productId, quantity, userContext);
}

export async function transferStock(data: {
    fromLocation: string; // 'Factory' or a storeId
    toLocation: string; // 'Factory' or a storeId
    lineItems: { productId: string, quantity: number }[];
}) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
      return { success: false, message: 'You do not have permission to transfer stock.' };
    }

    try { await assertUserPermission(userContext.user.id, 'manage-factory-inventory'); } catch (err) {
        return { success: false, message: 'You do not have permission to transfer stock.' };
    }
    
    return transferStockInDb(data, userContext);
}


export async function deleteAllProducts() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

  const userId = await getCurrentUserId();
  const userContext = await buildUserContext(userId);
  if (!userContext) {
      return { success: false, message: 'You do not have permission to delete all products.' };
  }

  const canDelete = userContext.permissions.includes('manage-factory-inventory');
   if (!canDelete) {
        return { success: false, message: 'You do not have permission to delete all products.' };
    }
  return deleteAllProductsFromDb(userContext);
}

export async function simulateSale(productId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);

    if (!userContext) {
        return { success: false, message: 'You do not have permission to simulate sales.' };
    }

    const canSimulateSale = userContext.permissions.includes('manage-store-inventory');
    if (!canSimulateSale) {
        return { success: false, message: 'You do not have permission to simulate sales.' };
    }
    return simulateSaleInDb(productId, userContext);
}


export async function addMultipleProducts(products: Omit<Product, 'id' | 'orgId'>[]) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'inventory', 'viewStock');

    const userId = await getCurrentUserId();
    const userContext = await buildUserContext(userId);
    if (!userContext) {
        return { success: false, message: "Permission denied." };
    }

    const canAdd = userContext.permissions.includes('manage-factory-inventory');
    if (!canAdd) {
        return { success: false, message: "You do not have permission to add products." };
    }

    const addedProducts: Product[] = [];
    for (const productData of products) {
        const newProduct = await addProductToDb(productData, userContext);
        addedProducts.push(newProduct);
    }
    
    return { success: true, count: addedProducts.length };
}


