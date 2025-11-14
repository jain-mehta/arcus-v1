
import { getComplianceDocuments } from './actions';
import { HrmsComplianceClient } from './client';
import { getCurrentUserFromSession } from '@/lib/session';
import { getSessionClaims } from '@/lib/session';
import { getSupabaseServerClient } from '@/lib/supabase/client';

async function getCurrentUser() {
    try {
        const sessionClaims = await getSessionClaims();
        if (!sessionClaims) return null;

        const supabase = getSupabaseServerClient();
        if (!supabase) return null;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionClaims.uid)
            .single();

        return error ? null : user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

async function getUserPermissions(userId: string): Promise<string[]> {
    try {
        const supabase = getSupabaseServerClient();
        if (!supabase) return [];

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role_id')
            .eq('id', userId)
            .single();

        if (userError || !user) return [];

        const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('permissions')
            .eq('id', user.role_id)
            .single();

        if (roleError || !role) return [];

        const permissions = Array.isArray(role.permissions) 
            ? role.permissions 
            : (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : []);
        
        return permissions || [];
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
}

export default async function HrmsDocumentsPage() {
    // In a real app, this would be a proper async data fetch.
    const [documentsResponse, user] = await Promise.all([
        getComplianceDocuments(),
        getCurrentUser()
    ]);

    // Normalize the response to an array: if the fetch returns an ActionResponse-like object,
    // prefer its `data` property; if it already is an array, use it directly; otherwise fallback to [].
    const initialDocuments: any[] = Array.isArray(documentsResponse)
        ? documentsResponse
        : (documentsResponse && (documentsResponse as any).data && Array.isArray((documentsResponse as any).data))
            ? (documentsResponse as any).data
            : [];

    let isAdmin = false;
    if (user) {
        const permissions = await getUserPermissions(user.id);
        isAdmin = permissions.includes('manage-users');
    }
    
    return <HrmsComplianceClient initialDocuments={initialDocuments} isAdmin={isAdmin} />;
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
