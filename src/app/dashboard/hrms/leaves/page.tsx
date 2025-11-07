

import { getLeaveRequests, getLeavePolicies, getStaff } from '../actions';
import { LeavesClient } from './client';
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
    const [requests, policies, staff] = await Promise.all([
        getLeaveRequests(user, permissions),
        getLeavePolicies(),
        getStaff(),
    ]);

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


\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n
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
