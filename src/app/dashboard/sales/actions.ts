

'use server';

import {
  MOCK_ORGANIZATION_ID,
  createLead as createLeadInDb,
  createOpportunity as createOpportunityInDb,
  getCustomersFromDb,
  getLeadsFromDb,
  getLead as getLeadFromDb,
  getOpportunitiesFromDb,
  updateOpportunityStage as updateOpportunityStageInDb,
  updateOpportunity as updateOpportunityInDb,
  deleteOpportunity as deleteOpportunityInDb,
  updateOpportunityPriority as updateOpportunityPriorityInDb,
  getOrdersDb,
  getQuotationsDb,
  updateLead as updateLeadInDb,
  deleteLead as deleteLeadInDb,
  convertLeadToCustomer as convertLeadToCustomerInDb,
  addCustomer as addCustomerInDb,
  addQuotation as addQuotationInDb,
  updateQuotationStatus as updateQuotationStatusInDb,
  createOrderFromQuote as createOrderFromQuoteInDb,
  MOCK_USERS,
  MOCK_VISITS,
  addCommunicationLogInDb,
  addVisitInDb,
  getCurrentUser as getCurrentUserFromDb,
} from '@/lib/mock-data/firestore';
import { getUser, getSubordinates, getUserPermissions, assertUserPermission } from '@/lib/mock-data/rbac';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';
import type { Lead, Opportunity, User, UserContext, Customer, CommunicationLog, Order, Quotation, Visit } from '@/lib/mock-data/types';

/**
 * A helper function to build the full user context required for data access calls.
 * This should be used at the beginning of most server actions.
 */
async function buildUserContext(userId: string | null): Promise<UserContext | null> {
    if (!userId) return null;
    
    const [user, permissions, subordinates] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
        getSubordinates(userId)
    ]);

    if (!user) {
        console.warn("User not found, cannot build user context.");
        return null;
    }

    return {
        user,
        permissions,
        subordinates,
        orgId: user.orgId || MOCK_ORGANIZATION_ID,
    };
}


// MOCK: In a real app, this would get the logged-in user's ID from the session.
export async function getCurrentUser(): Promise<User | null> {
  const user = await getCurrentUserFromDb();
  return user;
}

export async function addLead(data: Omit<Lead, 'id' | 'orgId' | 'ownerId' | 'assignedTo' | 'created' | 'lastActivity'>) {
    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);

    if (!userContext || !userContext.permissions.includes('create-lead')) {
        return { success: false, message: 'You do not have permission to create leads.' };
    }

    // The DB-level createLead expects assignedTo, created and lastActivity fields.
    const dbLeadData = {
        ...data,
        assignedTo: userContext.user.name,
        created: new Date().toISOString(),
        lastActivity: 'Just now',
    };
    const newLead = await createLeadInDb(dbLeadData, userContext);
    return { success: true, newLead };
}

export async function addOpportunity(data: Omit<Opportunity, 'id'| 'orgId' | 'ownerId'>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    
    if (!userContext || !userContext.permissions.includes('create-lead')) { // Re-using create-lead for simplicity
        return { success: false, message: 'You do not have permission to create opportunities.' };
    }

    const newOpportunity = await createOpportunityInDb(data, userContext);
    return { success: true, newOpportunity };
}


export async function updateOpportunityStage(id: string, stage: Opportunity['stage']) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    
    if (!userContext) {
        return { success: false, message: "Permission denied." };
    }

    // In a real app, we might have a more granular 'update-opportunity' permission
    // The check for access is now implicitly handled by the firestore function
    const result = await updateOpportunityStageInDb(id, stage, userContext);
    if (!result.success) {
        return { success: false, message: "Failed to update or permission denied." };
    }
    return { success: true };
}

export async function addCommunicationLog(log: Omit<CommunicationLog, 'id' | 'user' | 'date'>) {
  const sessionClaims = await getSessionClaims();
  if (!sessionClaims) {
      throw new Error('Unauthorized');
  }
  await assertPermission(sessionClaims, 'sales', 'viewAll');

  const userId = await getCurrentUser().then(u => u?.id);
  const userContext = await buildUserContext(userId || null);
  
  if (!userContext) {
      return { success: false, message: "Permission denied." };
  }
  
  const result = await addCommunicationLogInDb(log, userContext);
  return result;
}


export async function getLeads(searchParams: { [key: string]: string | string[] | undefined }) {
    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);

    if (!userContext) {
        return { leads: [], users: [], lastVisible: null };
    }

    const [leadsResult, users] = await Promise.all([
      getLeadsFromDb(userContext, searchParams),
      MOCK_USERS
    ]);
    return { ...leadsResult, users };
}

export async function getSalesCustomers(): Promise<{ customers: Customer[]; lastVisible: null; }> {
    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) {
        return { customers: [], lastVisible: null };
    }
    return getCustomersFromDb(userContext);
}

export async function updateOpportunity(id: string, data: Partial<Omit<Opportunity, 'id' | 'orgId' | 'ownerId'>>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
     if (!userContext) return { success: false, message: "Permission denied." };
    return updateOpportunityInDb(id, data, userContext);
}

export async function deleteOpportunity(id: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };
    return deleteOpportunityInDb(id, userContext);
}

export async function updateOpportunityPriority(updates: { id: string; priority: number }[]) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };
    // Note: The permission check for this is tricky. We'll assume if a user can see the opps, they can reorder them.
    // A more robust system might check ownership of every opp in the list.
    return updateOpportunityPriorityInDb(updates, userContext);
}

export async function getQuotations(userId?: string): Promise<Quotation[]> {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'quotations');

    return getQuotationsDb(userId);
}

export async function getOrders(): Promise<{ orders: Order[], lastVisible: null}> {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    return await getOrdersDb();
}

export async function updateLead(id: string, data: Partial<Omit<Lead, 'id' | 'orgId' | 'ownerId'>>) {
    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };

    // Explicit permission check on the lead itself
    const leadToUpdate = await getLeadFromDb(id);
    if (!leadToUpdate) return { success: false, message: "Lead not found." };
    
    const isOwner = leadToUpdate.ownerId === userContext.user.id;
    const isManager = userContext.subordinates.includes(leadToUpdate.ownerId);
    const isAdmin = userContext.permissions.includes('view-all-leads');

    if (!isOwner && !isManager && !isAdmin) {
        return { success: false, message: "You do not have permission to modify this lead." };
    }
    
    return updateLeadInDb(id, data, userContext);
}

export async function deleteLead(id: string) {
    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };
    
    // Explicit permission check on the lead itself
    const leadToDelete = await getLeadFromDb(id);
    if (!leadToDelete) return { success: false, message: "Lead not found." };
    
    const isOwner = leadToDelete.ownerId === userContext.user.id;
    const isManager = userContext.subordinates.includes(leadToDelete.ownerId);
    const isAdmin = userContext.permissions.includes('view-all-leads');

    if (!isOwner && !isManager && !isAdmin) {
        return { success: false, message: "You do not have permission to delete this lead." };
    }

    return deleteLeadInDb(id, userContext);
}

export async function convertLeadToCustomer(leadId: string, opportunityValue: number) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'leads');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };
    return convertLeadToCustomerInDb(leadId, opportunityValue, userContext);
}

export async function addCustomer(data: Omit<Customer, 'id' | 'orgId' | 'ownerId' | 'totalSpend'>): Promise<{success: boolean, customerId: string}> {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, customerId: '' };
    return addCustomerInDb(data, userContext);
}

export async function addQuotation(data: Quotation) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'quotations');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
     if (!userContext) return { success: false, message: "Permission denied." };
    try { await assertUserPermission(userContext.user.id, 'create-quotation'); } catch (err) { return { success: false, message: 'Forbidden' }; }
    return addQuotationInDb(data, userContext);
}

export async function updateQuotationStatus(id: string, status: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'quotations');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };
    return updateQuotationStatusInDb(id, status as Quotation['status'], userContext);
}

export async function createOrderFromQuote(quote: Quotation) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'quotations');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };
    return createOrderFromQuoteInDb(quote, userContext);
}

export async function createOrder(orderData: Partial<Omit<Order, 'id' | 'ownerId' | 'orderNumber' | 'orderDate' | 'status'>>) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return { success: false, message: "Permission denied." };
    try { await assertUserPermission(userContext.user.id, 'manage-orders'); } catch (err) { return { success: false, message: 'Forbidden' }; }
    
    // For POS orders, the storeId is derived from the user's context.
    const storeId = userContext.user.storeId;

    const mockQuote: Quotation = {
        ownerId: userContext.user.id,
        quoteNumber: `pos-bill-${Date.now()}`,
        customerId: orderData.customerId!,
        quoteDate: new Date().toISOString(),
        expiryDate: new Date().toISOString(),
        status: 'Approved',
        lineItems: orderData.lineItems!,
        totalAmount: orderData.totalAmount!,
    };
    
    return createOrderFromQuoteInDb(mockQuote, userContext, storeId, orderData.discountPercentage, orderData.customerDetails);
}

export async function getUsers() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    return MOCK_USERS;
}

export async function getOpportunities() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return [];
    return getOpportunitiesFromDb(userContext);
}

// --- VISIT LOGGING ACTIONS ---

export async function logVisit(data: Omit<Visit, 'id' | 'orgId' | 'ownerId'>) {
    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);

    if (!userContext || !userContext.permissions.includes('create-lead')) {
        return { success: false, message: "You don't have permission to log visits." };
    }
    
    return addVisitInDb(data, userContext);
}

export async function getVisitsForUser() {
    const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return [];

    const { user, permissions, subordinates, orgId } = userContext;

    if (permissions.includes('view-all-leads')) { // Admin-like permission
        return MOCK_VISITS.filter(v => v.orgId === orgId);
    }
    if (permissions.includes('view-regional-leads')) { // Regional Head
        const allowedOwnerIds = [user.id, ...subordinates];
        return MOCK_VISITS.filter(v => v.orgId === orgId && allowedOwnerIds.includes(v.ownerId));
    }
    // Default to Sales Exec
    return MOCK_VISITS.filter(v => v.orgId === orgId && v.ownerId === user.id);
}


export async function getDealersForUser(): Promise<{id: string, name: string}[]> {
     const userId = await getCurrentUser().then(u => u?.id);
    const userContext = await buildUserContext(userId || null);
    if (!userContext) return [];
    
    const { leads } = await getLeadsFromDb(userContext);

    // For simplicity, dealers are just leads/companies for now.
    return leads.map(lead => ({ id: lead.id, name: lead.company }));
}



