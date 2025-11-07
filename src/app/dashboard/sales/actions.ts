'use server';

import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

// Database types for Sales module - using Supabase tables
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  source?: string;
  assigned_to?: string;
  owner_id?: string;
  organization_id?: string;
  created_at?: string;
  last_activity?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  value: number;
  stage: string;
  priority?: string;
  owner_id?: string;
  customer_id?: string;
  description?: string;
  close_date?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Quotation {
  id: string;
  quote_number: string;
  customer_id: string;
  customer_name?: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Visit {
  id: string;
  customer_id: string;
  sales_person_id: string;
  visit_date: string;
  purpose: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommunicationLog {
  id: string;
  customer_id?: string;
  lead_id?: string;
  type: 'email' | 'call' | 'meeting' | 'message';
  subject?: string;
  notes: string;
  date: string;
  created_by?: string;
  organization_id?: string;
  created_at?: string;
}

// Get current user (exported for compatibility)
export async function getCurrentUser() {
  const user = await getCurrentUserFromSession();
  return user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    orgId: user.orgId
  } : null;
}

export async function addLead(data: Omit<Lead, 'id' | 'organization_id' | 'owner_id' | 'assigned_to' | 'created_at' | 'last_activity'>): Promise<ActionResponse<Lead>> {
    const authCheck = await checkActionPermission('sales', 'leads', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: newLead, error } = await supabase
            .from('leads')
            .insert({
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                status: data.status || 'new',
                source: data.source,
                owner_id: user.id,
                assigned_to: user.name,
                organization_id: user.orgId || 'default-org'
            })
            .select()
            .single();

        if (error) {
            console.error('[addLead] Error:', error);
            return createErrorResponse('Failed to create lead in database');
        }

        await logUserAction(user, 'create', 'lead', newLead.id, { leadData: data });
        revalidatePath('/dashboard/sales/leads');
        return createSuccessResponse(newLead, 'Lead created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create lead: ${error.message}`);
    }
}

export async function addOpportunity(data: Omit<Opportunity, 'id'| 'organization_id' | 'owner_id'>): Promise<ActionResponse<Opportunity>> {
    const authCheck = await checkActionPermission('sales', 'opportunities', 'create');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: newOpportunity, error } = await supabase
            .from('opportunities')
            .insert({
                title: data.title,
                value: data.value,
                stage: data.stage || 'qualification',
                priority: data.priority,
                customer_id: data.customer_id,
                description: data.description,
                close_date: data.close_date,
                owner_id: user.id,
                organization_id: user.orgId || 'default-org'
            })
            .select()
            .single();

        if (error) {
            console.error('[addOpportunity] Error:', error);
            return createErrorResponse('Failed to create opportunity in database');
        }

        await logUserAction(user, 'create', 'opportunity', newOpportunity.id, { opportunityData: data });
        revalidatePath('/dashboard/sales/opportunities');
        return createSuccessResponse(newOpportunity, 'Opportunity created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create opportunity: ${error.message}`);
    }
}

export async function getLeads(): Promise<ActionResponse<Lead[]>> {
    const authCheck = await checkActionPermission('sales', 'leads', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getLeads] Error:', error);
            return createErrorResponse('Failed to fetch leads from database');
        }

        await logUserAction(user, 'view', 'leads', undefined, { count: leads?.length });
        return createSuccessResponse(leads || [], 'Leads retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch leads: ${error.message}`);
    }
}

export async function getOpportunities(): Promise<ActionResponse<Opportunity[]>> {
    const authCheck = await checkActionPermission('sales', 'opportunities', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: opportunities, error } = await supabase
            .from('opportunities')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getOpportunities] Error:', error);
            return createErrorResponse('Failed to fetch opportunities from database');
        }

        await logUserAction(user, 'view', 'opportunities', undefined, { count: opportunities?.length });
        return createSuccessResponse(opportunities || [], 'Opportunities retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch opportunities: ${error.message}`);
    }
}

export async function getCustomers(): Promise<ActionResponse<Customer[]>> {
    const authCheck = await checkActionPermission('sales', 'customers', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getCustomers] Error:', error);
            return createErrorResponse('Failed to fetch customers from database');
        }

        await logUserAction(user, 'view', 'customers', undefined, { count: customers?.length });
        return createSuccessResponse(customers || [], 'Customers retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch customers: ${error.message}`);
    }
}

export async function getQuotations(): Promise<ActionResponse<Quotation[]>> {
    const authCheck = await checkActionPermission('sales', 'quotations', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: quotations, error } = await supabase
            .from('quotations')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getQuotations] Error:', error);
            return createErrorResponse('Failed to fetch quotations from database');
        }

        await logUserAction(user, 'view', 'quotations', undefined, { count: quotations?.length });
        return createSuccessResponse(quotations || [], 'Quotations retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch quotations: ${error.message}`);
    }
}

export async function getOrders(): Promise<ActionResponse<SalesOrder[]>> {
    const authCheck = await checkActionPermission('sales', 'orders', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        // Import Supabase client
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();

        if (!supabase) {
            return createErrorResponse('Database connection failed');
        }

        const { data: orders, error } = await supabase
            .from('sales_orders')
            .select('*')
            .eq('organization_id', user.orgId || 'default-org')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getOrders] Error:', error);
            return createErrorResponse('Failed to fetch orders from database');
        }

        await logUserAction(user, 'view', 'sales_orders', undefined, { count: orders?.length });
        return createSuccessResponse(orders || [], 'Orders retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch orders: ${error.message}`);
    }
}

// TODO: Implement additional sales functions with proper Supabase database calls:
// - updateLead(), deleteLead(), convertLeadToCustomer()
// - updateOpportunity(), deleteOpportunity(), updateOpportunityStage()
// - addCustomer(), updateCustomer(), deleteCustomer()
// - addQuotation(), updateQuotationStatus()
// - createOrderFromQuote()
// - addVisit(), getVisits()
// - addCommunicationLog(), getCommunicationLogs()
// - Sales reporting and analytics functions