'use server';

import { getSupabaseServerClient } from '@/lib/supabase/client';
import type { Employee } from '@/lib/types/domain';

const supabase = getSupabaseServerClient();

/**
 * Fetch all employees for a tenant
 */
export async function fetchEmployees(tenantId: string, limit: number = 50, offset: number = 0, department?: string): Promise<{ employees: Employee[]; total: number }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('[Employees] Error fetching:', error);
      return { employees: [], total: 0 };
    }

    return { employees: data || [], total: count || 0 };
  } catch (error) {
    console.error('[Employees] Exception:', error);
    return { employees: [], total: 0 };
  }
}

/**
 * Fetch employee by ID
 */
export async function fetchEmployee(employeeId: string): Promise<Employee | null> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) {
      console.error('[Employees] Error fetching employee:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Employees] Exception:', error);
    return null;
  }
}

/**
 * Update employee
 */
export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId);

    if (error) {
      console.error('[Employees] Error updating employee:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Employees] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a new employee
 */
export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();

    if (error) {
      console.error('[Employees] Error creating employee:', error);
      return { success: false, error: error.message };
    }

    return { success: true, employee: data };
  } catch (error) {
    console.error('[Employees] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete employee (soft delete via status)
 */
export async function deleteEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('employees')
      .update({ status: 'inactive' as const })
      .eq('id', employeeId);

    if (error) {
      console.error('[Employees] Error deleting employee:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Employees] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
