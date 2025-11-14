

import { getLeaveRequests, getLeavePolicies, getStaff } from '../actions';
import { LeavesClient } from './client';
import { getSupabaseServerClient } from '@/lib/supabase/client';
import { getSessionClaims } from '@/lib/session';

async function getCurrentUser() {
    const claims = await getSessionClaims();
    if (!claims?.uid) return null;
    
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', claims.uid)
        .single();
    
    return error ? null : data;
}

async function getUserPermissions(userId: string): Promise<string[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];
    
    const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)
        .single();
    
    if (error || !userRole) return [];
    
    const { data: role } = await supabase
        .from('roles')
        .select('permissions')
        .eq('id', userRole.role_id)
        .single();
    
    if (!role || !role.permissions) return [];
    
    // Handle both array and JSON string formats
    const perms = Array.isArray(role.permissions) ? role.permissions : 
                  typeof role.permissions === 'string' ? JSON.parse(role.permissions) : [];
    return perms;
}

export default async function HrmsLeavesPage() {
    const user = await getCurrentUser();
    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Loading user data...</p>
            </div>
        )
    }

    const permissions = await getUserPermissions(user.id);
    const isAdmin = permissions.includes('manage-users');

    // Pass the user context directly to the action
    const [requestsResp, policiesResp, staffResp] = await Promise.all([
        getLeaveRequests(user.id),
        getLeavePolicies(),
        getStaff(),
    ]);

    // Unwrap ActionResponse results
    const requests = (requestsResp?.success && Array.isArray(requestsResp.data)) ? requestsResp.data : [];
    const policies = (policiesResp?.success && Array.isArray(policiesResp.data)) ? policiesResp.data : [];
    const staff = (staffResp?.success && Array.isArray(staffResp.data)) ? staffResp.data : [];

    return (
        <LeavesClient
            initialRequests={requests}
            leavePolicies={policies}
            staffList={staff}
            currentUser={user}
            isAdmin={isAdmin}
        />
    );
}


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
