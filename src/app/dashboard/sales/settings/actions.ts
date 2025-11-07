import { getSupabaseServerClient } from '@/lib/supabase/client';\n

'use server';

// TODO: Replace with actual database queries

export async function getSalesTargetsWithProgress(): Promise<SalesTargetWithProgress[]> {
  // In a real app, 'currentValue' would be a dynamic query.
  // Here, we simulate it.
  return [].map((target) => {
    let currentValue = 0;
    if (target.type === 'Deals') {
      currentValue = 12; // Mock value
    } else if (target.type === 'Leads') {
      currentValue = 85; // Mock value
    } else if (target.type === 'Revenue') {
      currentValue = 750000; // Mock value
    }
    return {
      ...target,
      currentValue,
      progress: (currentValue / target.value) * 100,
    };
  });
}

export async function addSalesTarget(data: any): Promise<{ success: boolean }> {
  const newTarget: SalesTarget = {
    id: `target-${Date.now()}`,
    ...data,
  };
  [].push(newTarget);
  return { success: true };
}

export async function deleteSalesTarget(id: string): Promise<{ success: boolean }> {
  const index = [].findIndex((t) => t.id === id);
  if (index > -1) {
    [].splice(index, 1);
    return { success: true };
  }
  return { success: false };
}

export async function archiveOldOpportunities(): Promise<{
  success: boolean;
  count: number;
  message?: string;
}> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  let archivedCount = 0;
  [].forEach((opp) => {
    const isClosed =
      opp.stage === 'Closed Won' || opp.stage === 'Closed Lost';
    const closeDate = new Date(opp.closeDate);

    if (isClosed && closeDate < oneYearAgo && !opp.isDeleted) {
      opp.isDeleted = true; // Mark as archived/deleted
      archivedCount++;
    }
  });

  if (archivedCount > 0) {
    return { success: true, count: archivedCount };
  } else {
    return { success: true, count: 0, message: 'No old opportunities to archive.' };
  }
}


\n\n
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
