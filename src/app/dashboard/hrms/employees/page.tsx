

import { getStaff, getAllStores, getAllUsers } from '../actions';
import { EmployeesClient } from './client';
import { getAllRoles } from '../../users/roles/actions';
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

export default async function HrmsEmployeesPage() {
    const user = await getCurrentUser();
    if (!user) {
        return <div>Loading...</div>; // Or a proper error state
    }

    const permissions = await getUserPermissions(user.id);
    const isAdmin = permissions.includes('manage-users');

    // For admins, we fetch all staff initially.
    // For non-admins, we only fetch staff for their specific store.
    const [staffResp, storesResp, usersResp, rolesResp] = await Promise.all([
        getStaff(isAdmin ? undefined : user.storeId),
        getAllStores(),
        getAllUsers(),
        getAllRoles(),
    ]);

    // Unwrap ActionResponse results
    const initialStaff = (staffResp?.success && Array.isArray(staffResp.data)) ? staffResp.data : [];
    const allStores = (storesResp?.success && Array.isArray(storesResp.data)) ? storesResp.data : [];
    const allUsers = (usersResp?.success && Array.isArray(usersResp.data)) ? usersResp.data : [];
    const allRoles = (rolesResp?.success && Array.isArray(rolesResp.data)) ? rolesResp.data : [];

    return (
        <EmployeesClient 
            initialStaff={initialStaff}
            allStores={allStores}
            allUsers={allUsers}
            allRoles={allRoles}
            isAdmin={isAdmin}
            currentUserStoreId={user.storeId}
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
