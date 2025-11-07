
'use server';

import type { SummarizeOpportunityInput, SummarizeOpportunityOutput } from '@/ai/flows/summarize-opportunity';
import { getOpportunities, getSalesCustomers } from '../actions';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

// Helper function to create UserContext for compatibility
function createUserContext(user: any): UserContext {
    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            orgId: user.orgId || 'default-org'
        },
        permissions: [],
        subordinates: [],
        orgId: user.orgId || '',
    };
}

export async function summarizeOpportunity(input: SummarizeOpportunityInput): Promise<SummarizeOpportunityOutput> {
    const authCheck = await checkActionPermission('sales', 'opportunities', 'view');
    if ('error' in authCheck) {
        throw new Error(authCheck.error);
    }

    const { summarizeOpportunity: callSummarizeOpportunity } = await import('@/ai/flows/summarize-opportunity');
    return callSummarizeOpportunity(input);
}


export async function getKanbanData(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('sales', 'viewAll');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const [opportunities, customers] = await Promise.all([
            getOpportunities(),
            getSalesCustomers()
        ]);

        const data = {
            opportunities: 'success' in opportunities ? opportunities.data : [],
            customers: 'success' in customers ? customers.data : { customers: [], lastVisible: null }
        };

        await logUserAction(user, 'view', 'kanban_data');
        return createSuccessResponse(data, 'Kanban data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get kanban data: ${error.message}`);
    }
}


\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n

// TODO: Replace with actual database queries
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
