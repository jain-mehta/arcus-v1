import { getSupabaseServerClient } from '@/lib/supabase/client';\n
'use server';

// TODO: Replace with actual database queries

interface LeaderboardEntry {
    user: User;
    revenueGenerated: number;
    dealsClosed: number;
}

export async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
    const [allUsers, allOpportunities] = await Promise.all([
        Promise.resolve([]),
        Promise.resolve([])
    ]);

    // Filter for users who are sales reps
    const salesReps = allUsers.filter(u => u.roleIds.includes('sales-exec') || u.roleIds.includes('regional-head'));

    const leaderboardData = salesReps.map(rep => {
        const closedWonOpps = allOpportunities.filter(
            (opp: Opportunity) => opp.ownerId === rep.id && opp.stage === 'Closed Won'
        );

        const revenueGenerated = closedWonOpps.reduce((total: number, opp: Opportunity) => total + opp.value, 0);
        const dealsClosed = closedWonOpps.length;

        return {
            user: rep,
            revenueGenerated,
            dealsClosed,
        };
    });

    // Sort by revenue generated in descending order
    leaderboardData.sort((a, b) => b.revenueGenerated - a.revenueGenerated);

    return leaderboardData;
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
