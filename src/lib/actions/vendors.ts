'use server';

import { getSupabaseServerClient } from '@/lib/supabase/client';
import type { Vendor, PurchaseOrder } from '@/lib/types/domain';

const supabase = getSupabaseServerClient();

/**
 * Fetch all vendors for a tenant
 */
export async function fetchVendors(tenantId: string): Promise<Vendor[]> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('[Vendors] Error fetching:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Vendors] Exception:', error);
    return [];
  }
}

/**
 * Fetch vendor by ID
 */
export async function fetchVendor(vendorId: string): Promise<Vendor | null> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (error) {
      console.error('[Vendors] Error fetching vendor:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Vendors] Exception:', error);
    return null;
  }
}

/**
 * Update vendor
 */
export async function updateVendor(vendorId: string, updates: Partial<Vendor>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId);

    if (error) {
      console.error('[Vendors] Error updating vendor:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Vendors] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch purchase orders for a vendor
 */
export async function fetchVendorPurchaseOrders(vendorId: string): Promise<PurchaseOrder[]> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('[Vendors] Error fetching purchase orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Vendors] Exception:', error);
    return [];
  }
}

/**
 * Create a new vendor
 */
export async function createVendor(vendor: Omit<Vendor, 'id' | 'created_at'>): Promise<{ success: boolean; vendor?: Vendor; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single();

    if (error) {
      console.error('[Vendors] Error creating vendor:', error);
      return { success: false, error: error.message };
    }

    return { success: true, vendor: data };
  } catch (error) {
    console.error('[Vendors] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
