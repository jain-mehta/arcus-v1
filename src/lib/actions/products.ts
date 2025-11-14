'use server';

import { getSupabaseServerClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/types/domain';

const supabase = getSupabaseServerClient();

/**
 * Fetch all products for a tenant
 */
export async function fetchProducts(tenantId: string, limit: number = 100, offset: number = 0): Promise<{ products: Product[]; total: number }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Products] Error fetching:', error);
      return { products: [], total: 0 };
    }

    return { products: data || [], total: count || 0 };
  } catch (error) {
    console.error('[Products] Exception:', error);
    return { products: [], total: 0 };
  }
}

/**
 * Fetch product by ID
 */
export async function fetchProduct(productId: string): Promise<Product | null> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('[Products] Error fetching product:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Products] Exception:', error);
    return null;
  }
}

/**
 * Update product
 */
export async function updateProduct(productId: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId);

    if (error) {
      console.error('[Products] Error updating product:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Products] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update product stock
 */
export async function updateProductStock(productId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: quantity })
      .eq('id', productId);

    if (error) {
      console.error('[Products] Error updating stock:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Products] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error('[Products] Error creating product:', error);
      return { success: false, error: error.message };
    }

    return { success: true, product: data };
  } catch (error) {
    console.error('[Products] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
