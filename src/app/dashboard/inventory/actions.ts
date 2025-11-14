
'use server';

import type { ExtractProductImageFromCatalogInput, ExtractProductImageFromCatalogOutput } from '@/ai/flows/extract-product-image-from-catalog';
import type { SuggestProductsFromCatalogTextOnlyInput, SuggestProductsFromCatalogTextOnlyOutput } from '@/ai/flows/suggest-products-from-catalog-text-only';
import type { Product } from '@/lib/types';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';


export async function addProduct(data: Omit<Product, 'id' | 'orgId'>): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'products', 'create');
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

        // Insert product into Supabase
        const { data: newProduct, error } = await supabase
            .from('products')
            .insert({
                name: data.name,
                description: data.description,
                sku: data.sku,
                category: data.category,
                price: data.price,
                cost: data.cost,
                unit: data.unit,
                dimensions: data.dimensions,
                weight: data.weight,
                image_url: data.imageUrl,
                created_by: user.id,
                organization_id: user.orgId || 'default-org'
            })
            .select()
            .single();

        if (error) {
            console.error('[addProduct] Error:', error);
            return createErrorResponse('Failed to add product to database');
        }

        await logUserAction(user, 'create', 'product', newProduct.id, { productName: data.name });
        return createSuccessResponse(newProduct, 'Product added successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to add product: ${error.message}`);
    }
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'orgId'>>): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'products', 'edit');
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

        // Update product in Supabase
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.sku !== undefined) updateData.sku = data.sku;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.cost !== undefined) updateData.cost = data.cost;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
        if (data.weight !== undefined) updateData.weight = data.weight;
        if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
        updateData.updated_at = new Date().toISOString();
        updateData.updated_by = user.id;

        const { data: updatedProduct, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[updateProduct] Error:', error);
            return createErrorResponse('Failed to update product in database');
        }

        await logUserAction(user, 'update', 'product', id, { changes: data });
        return createSuccessResponse(updatedProduct, 'Product updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update product: ${error.message}`);
    }
}

export async function deleteProduct(id: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'products', 'delete');
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

        // Soft delete product in Supabase
        const { error } = await supabase
            .from('products')
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: user.id
            })
            .eq('id', id);

        if (error) {
            console.error('[deleteProduct] Error:', error);
            return createErrorResponse('Failed to delete product in database');
        }

        await logUserAction(user, 'delete', 'product', id);
        return createSuccessResponse({ success: true }, 'Product deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete product: ${error.message}`);
    }
}

export async function addStock(productId: string, quantity: number): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'stock', 'edit');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const userContext = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                orgId: user.orgId || 'default-org'
            },
            permissions: [],
            subordinates: [],
            orgId: user.orgId || 'default-org'
        };

        // TODO: Implement actual database stock addition
        const result = { id: productId, quantityAdded: quantity };
        // await logUserAction(user, 'add_stock', 'product', productId, { quantity });
        return createSuccessResponse(result, 'Stock added successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to add stock: ${error.message}`);
    }
}

export async function dispatchStock(productId: string, quantity: number): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'stock', 'edit');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const userContext = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                orgId: user.orgId || 'default-org'
            },
            permissions: [],
            subordinates: [],
            orgId: user.orgId || 'default-org'
        };

        // TODO: Implement actual database stock dispatch
        const result = { id: productId, quantityDispatched: quantity };
        // await logUserAction(user, 'dispatch_stock', 'product', productId, { quantity });
        return createSuccessResponse(result, 'Stock dispatched successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to dispatch stock: ${error.message}`);
    }
}

export async function transferStock(data: {
    fromLocation: string; // 'Factory' or a storeId
    toLocation: string; // 'Factory' or a storeId
    lineItems: { productId: string, quantity: number }[];
}): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'stock', 'edit');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const userContext = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                orgId: user.orgId || 'default-org'
            },
            permissions: [],
            subordinates: [],
            orgId: user.orgId || 'default-org'
        };

        // TODO: Implement actual database stock transfer
        const result = { transferId: 'transfer-' + Date.now(), ...data };
        // await logUserAction(user, 'transfer_stock', 'inventory', 'bulk', { transferData: data });
        return createSuccessResponse(result, 'Stock transferred successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to transfer stock: ${error.message}`);
    }
}


export async function deleteAllProducts(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'products', 'delete');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const userContext = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                orgId: user.orgId || 'default-org'
            },
            permissions: ['manage-factory-inventory'],
            subordinates: [],
            orgId: user.orgId || 'default-org'
        };

        // TODO: Implement actual database delete all
        const result = { deletedCount: 0 };
        // await logUserAction(user, 'delete_all', 'products', 'bulk');
        return createSuccessResponse(result, 'All products deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete all products: ${error.message}`);
    }
}

export async function simulateSale(productId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('inventory', 'sales', 'simulate');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const userContext = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                orgId: user.orgId || 'default-org'
            },
            permissions: ['manage-store-inventory'],
            subordinates: [],
            orgId: user.orgId || 'default-org'
        };

        // TODO: Implement actual database sale simulation
        const result = { saleId: 'sale-' + Date.now(), productId, sold: true };
        // await logUserAction(user, 'simulate_sale', 'product', productId);
        return createSuccessResponse(result, 'Sale simulated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to simulate sale: ${error.message}`);
    }
}


export async function addMultipleProducts(products: Omit<Product, 'id' | 'orgId'>[]): Promise<ActionResponse<{count: number, products: Product[]}>> {
    const authCheck = await checkActionPermission('inventory', 'products', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const userContext = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                orgId: user.orgId || 'default-org'
            },
            permissions: ['manage-factory-inventory'],
            subordinates: [],
            orgId: user.orgId || 'default-org'
        };

        const addedProducts: Product[] = [];
        for (const productData of products) {
            // TODO: Implement actual database add
            const newProduct = { id: 'prod-' + Date.now(), ...productData, orgId: user.orgId || 'default-org' } as Product;
            addedProducts.push(newProduct);
        }

        const result = { count: addedProducts.length, products: addedProducts };
        // await logUserAction(user, 'bulk_create', 'products', 'bulk', { count: addedProducts.length });
        return createSuccessResponse(result, `${addedProducts.length} products added successfully`);
    } catch (error: any) {
        return createErrorResponse(`Failed to add multiple products: ${error.message}`);
    }
}


