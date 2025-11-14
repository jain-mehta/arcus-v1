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
  stage?: string;
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
  customerId?: string; // camelCase alias
  customer_name?: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Expired';
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
  
  // camelCase aliases  
  customerId?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: number;
  lineItems?: Array<{ unitPrice: number; quantity: number; [key: string]: any }>;
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
  
  // Additional properties for flexibility
  dealer_id?: string;
  outcome?: string;
  next_follow_up_date?: string;
  feedback?: string;
  user_id?: string;
  dealerName?: string;
  visitDate?: string;
  nextFollowUpDate?: string;
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

// Additional sales functions

export async function updateLead(id: string, data: Partial<Lead>): Promise<ActionResponse<Lead>> {
    const authCheck = await checkActionPermission('sales', 'leads', 'update');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: updated, error } = await supabase.from('leads').update(data).eq('id', id).select().single();
        if (error) return createErrorResponse('Failed to update lead');
        await logUserAction(authCheck.user, 'update', 'lead', id, { data });
        revalidatePath('/dashboard/sales/leads');
        return createSuccessResponse(updated, 'Lead updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update lead: ${error.message}`);
    }
}

export async function deleteLead(id: string): Promise<ActionResponse<null>> {
    const authCheck = await checkActionPermission('sales', 'leads', 'delete');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) return createErrorResponse('Failed to delete lead');
        await logUserAction(authCheck.user, 'delete', 'lead', id);
        revalidatePath('/dashboard/sales/leads');
        return createSuccessResponse(null, 'Lead deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete lead: ${error.message}`);
    }
}

export async function convertLeadToCustomer(leadId: string): Promise<ActionResponse<Customer>> {
    const authCheck = await checkActionPermission('sales', 'customers', 'create');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: lead, error: fetchError } = await supabase.from('leads').select('*').eq('id', leadId).single();
        if (fetchError || !lead) return createErrorResponse('Lead not found');
        const { data: customer, error } = await supabase.from('customers').insert({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            organization_id: lead.organization_id
        }).select().single();
        if (error) return createErrorResponse('Failed to create customer');
        await supabase.from('leads').update({ status: 'converted' }).eq('id', leadId);
        await logUserAction(authCheck.user, 'convert', 'lead_to_customer', leadId);
        revalidatePath('/dashboard/sales/customers');
        return createSuccessResponse(customer, 'Lead converted to customer');
    } catch (error: any) {
        return createErrorResponse(`Failed to convert lead: ${error.message}`);
    }
}

export async function updateOpportunity(id: string, data: Partial<Opportunity>): Promise<ActionResponse<Opportunity>> {
    const authCheck = await checkActionPermission('sales', 'opportunities', 'update');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: updated, error } = await supabase.from('opportunities').update(data).eq('id', id).select().single();
        if (error) return createErrorResponse('Failed to update opportunity');
        await logUserAction(authCheck.user, 'update', 'opportunity', id, { data });
        revalidatePath('/dashboard/sales/opportunities');
        return createSuccessResponse(updated, 'Opportunity updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update opportunity: ${error.message}`);
    }
}

export async function updateOpportunityPriority(id: string, priority: string): Promise<ActionResponse<Opportunity>> {
    const authCheck = await checkActionPermission('sales', 'opportunities', 'update');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: updated, error } = await supabase.from('opportunities').update({ priority }).eq('id', id).select().single();
        if (error) return createErrorResponse('Failed to update priority');
        await logUserAction(authCheck.user, 'update', 'opportunity_priority', id, { priority });
        revalidatePath('/dashboard/sales/opportunities');
        return createSuccessResponse(updated, 'Priority updated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to update priority: ${error.message}`);
    }
}

export async function deleteOpportunity(id: string): Promise<ActionResponse<null>> {
    const authCheck = await checkActionPermission('sales', 'opportunities', 'delete');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { error } = await supabase.from('opportunities').delete().eq('id', id);
        if (error) return createErrorResponse('Failed to delete opportunity');
        await logUserAction(authCheck.user, 'delete', 'opportunity', id);
        revalidatePath('/dashboard/sales/opportunities');
        return createSuccessResponse(null, 'Opportunity deleted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to delete opportunity: ${error.message}`);
    }
}

export async function addCustomer(data: Omit<Customer, 'id'>): Promise<ActionResponse<Customer>> {
    const authCheck = await checkActionPermission('sales', 'customers', 'create');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: newCustomer, error } = await supabase.from('customers').insert({
            ...data,
            organization_id: user.orgId || 'default-org'
        }).select().single();
        if (error) return createErrorResponse('Failed to create customer');
        await logUserAction(user, 'create', 'customer', newCustomer.id, { data });
        revalidatePath('/dashboard/sales/customers');
        return createSuccessResponse(newCustomer, 'Customer created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create customer: ${error.message}`);
    }
}

export async function logVisit(data: Omit<Visit, 'id' | 'created_at'>): Promise<ActionResponse<Visit>> {
    const authCheck = await checkActionPermission('sales', 'visits', 'create');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: newVisit, error } = await supabase.from('visits').insert({
            ...data,
            user_id: user.id,
            organization_id: user.orgId || 'default-org'
        }).select().single();
        if (error) return createErrorResponse('Failed to log visit');
        await logUserAction(user, 'create', 'visit', newVisit.id, { data });
        revalidatePath('/dashboard/sales/visits');
        return createSuccessResponse(newVisit, 'Visit logged successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to log visit: ${error.message}`);
    }
}

export async function addCommunicationLog(data: Omit<CommunicationLog, 'id' | 'created_at'>): Promise<ActionResponse<CommunicationLog>> {
    const authCheck = await checkActionPermission('sales', 'communications', 'create');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: log, error } = await supabase.from('communication_logs').insert({
            ...data,
            user_id: user.id,
            organization_id: user.orgId || 'default-org'
        }).select().single();
        if (error) return createErrorResponse('Failed to create communication log');
        await logUserAction(user, 'create', 'communication_log', log.id, { data });
        return createSuccessResponse(log, 'Communication logged successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to log communication: ${error.message}`);
    }
}

// Alias for getCustomers
export async function getSalesCustomers(): Promise<ActionResponse<Customer[]>> {
    return getCustomers();
}

// Create order from sales order data
export async function createOrder(data: Omit<SalesOrder, 'id' | 'created_at' | 'updated_at'>): Promise<ActionResponse<SalesOrder>> {
    const authCheck = await checkActionPermission('sales', 'orders', 'create');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: order, error } = await supabase.from('sales_orders').insert({
            ...data,
            user_id: user.id,
            organization_id: user.orgId || 'default-org'
        }).select().single();
        if (error) return createErrorResponse('Failed to create order');
        await logUserAction(user, 'create', 'sales_order', order.id, { data });
        return createSuccessResponse(order, 'Order created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create order: ${error.message}`);
    }
}

// Update quotation status
export async function updateQuotationStatus(id: string, status: string): Promise<ActionResponse<Quotation>> {
    const authCheck = await checkActionPermission('sales', 'quotations', 'update');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: quotation, error } = await supabase.from('quotations').update({ status }).eq('id', id).select().single();
        if (error) return createErrorResponse('Failed to update quotation');
        await logUserAction(user, 'update', 'quotation', id, { status });
        return createSuccessResponse(quotation, 'Quotation status updated');
    } catch (error: any) {
        return createErrorResponse(`Failed to update quotation: ${error.message}`);
    }
}

// Create order from quotation
export async function createOrderFromQuote(quoteId: string): Promise<ActionResponse<SalesOrder>> {
    const authCheck = await checkActionPermission('sales', 'orders', 'create');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        
        // Get quotation
        const { data: quote, error: quoteError } = await supabase.from('quotations').select('*').eq('id', quoteId).single();
        if (quoteError || !quote) return createErrorResponse('Quotation not found');
        
        // Create order from quotation
        const order = { ...quote, status: 'pending' };
        delete (order as any).id;
        const { data: newOrder, error } = await supabase.from('sales_orders').insert({
            ...order,
            user_id: user.id,
            organization_id: user.orgId || 'default-org'
        }).select().single();
        
        if (error) return createErrorResponse('Failed to create order from quotation');
        await logUserAction(user, 'create', 'sales_order', newOrder.id, { quoteId });
        return createSuccessResponse(newOrder, 'Order created from quotation');
    } catch (error: any) {
        return createErrorResponse(`Failed to create order: ${error.message}`);
    }
}

// Get dealers for sales user
export async function getDealersForUser(): Promise<ActionResponse<any[]>> {
    const authCheck = await checkActionPermission('sales', 'dealers', 'read');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: dealers, error } = await supabase.from('customers').select('*').eq('organization_id', user.orgId || 'default-org').eq('type', 'dealer');
        if (error) return createErrorResponse('Failed to fetch dealers');
        return createSuccessResponse(dealers || [], 'Dealers fetched successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch dealers: ${error.message}`);
    }
}

// Add quotation
export async function addQuotation(data: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>): Promise<ActionResponse<Quotation>> {
    const authCheck = await checkActionPermission('sales', 'quotations', 'create');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: quotation, error } = await supabase.from('quotations').insert({
            ...data,
            user_id: user.id,
            organization_id: user.orgId || 'default-org'
        }).select().single();
        if (error) return createErrorResponse('Failed to create quotation');
        await logUserAction(user, 'create', 'quotation', quotation.id, { data });
        return createSuccessResponse(quotation, 'Quotation created successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to create quotation: ${error.message}`);
    }
}

// Get visits for sales user
export async function getVisitsForUser(): Promise<ActionResponse<Visit[]>> {
    const authCheck = await checkActionPermission('sales', 'visits', 'read');
    if ('error' in authCheck) return createErrorResponse(authCheck.error);
    const { user } = authCheck;
    try {
        const { getSupabaseServerClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseServerClient();
        if (!supabase) return createErrorResponse('Database connection failed');
        const { data: visits, error } = await supabase.from('visits').select('*').eq('user_id', user.id);
        if (error) return createErrorResponse('Failed to fetch visits');
        return createSuccessResponse(visits || [], 'Visits fetched successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to fetch visits: ${error.message}`);
    }
}