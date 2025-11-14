'use server';

import { getSupabaseServerClient } from '@/lib/supabase/client';
import type { Order, Customer } from '@/lib/types/domain';

const supabase = getSupabaseServerClient();

/**
 * Fetch all orders for a store
 */
export async function fetchStoreOrders(storeId: string, limit: number = 50, offset: number = 0): Promise<{ orders: Order[]; total: number }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Orders] Error fetching:', error);
      return { orders: [], total: 0 };
    }

    return { orders: data || [], total: count || 0 };
  } catch (error) {
    console.error('[Orders] Exception:', error);
    return { orders: [], total: 0 };
  }
}

/**
 * Fetch order by ID
 */
export async function fetchOrder(orderId: string): Promise<Order | null> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('[Orders] Error fetching order:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Orders] Exception:', error);
    return null;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('[Orders] Error updating order:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Orders] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch customer by ID
 */
export async function fetchCustomer(customerId: string): Promise<Customer | null> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('[Customers] Error fetching:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Customers] Exception:', error);
    return null;
  }
}

/**
 * Fetch all customers for a tenant
 */
export async function fetchCustomers(tenantId: string, limit: number = 100, offset: number = 0): Promise<{ customers: Customer[]; total: number }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Customers] Error fetching:', error);
      return { customers: [], total: 0 };
    }

    return { customers: data || [], total: count || 0 };
  } catch (error) {
    console.error('[Customers] Exception:', error);
    return { customers: [], total: 0 };
  }
}

/**
 * Create a new order
 */
export async function createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) {
      console.error('[Orders] Error creating order:', error);
      return { success: false, error: error.message };
    }

    return { success: true, order: data };
  } catch (error) {
    console.error('[Orders] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
