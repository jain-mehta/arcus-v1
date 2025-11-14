'use server';

import { getSupabaseServerClient } from '@/lib/supabase/client';
import type { Store } from '@/lib/types/domain';

const supabase = getSupabaseServerClient();

/**
 * Fetch all stores for a tenant
 */
export async function fetchStores(tenantId: string): Promise<Store[]> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('[Stores] Error fetching:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Stores] Exception:', error);
    return [];
  }
}

/**
 * Fetch store by ID
 */
export async function fetchStore(storeId: string): Promise<Store | null> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) {
      console.error('[Stores] Error fetching store:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Stores] Exception:', error);
    return null;
  }
}

/**
 * Update store
 */
export async function updateStore(storeId: string, updates: Partial<Store>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', storeId);

    if (error) {
      console.error('[Stores] Error updating store:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Stores] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new store
 */
export async function createStore(store: Omit<Store, 'id' | 'created_at'>): Promise<{ success: boolean; store?: Store; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('stores')
      .insert(store)
      .select()
      .single();

    if (error) {
      console.error('[Stores] Error creating store:', error);
      return { success: false, error: error.message };
    }

    return { success: true, store: data };
  } catch (error) {
    console.error('[Stores] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a store (soft delete via status)
 */
export async function deleteStore(storeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('stores')
      .update({ status: 'inactive' as const })
      .eq('id', storeId);

    if (error) {
      console.error('[Stores] Error deleting store:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Stores] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
