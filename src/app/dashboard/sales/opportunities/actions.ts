
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

interface UserContext {
    user: {
        id: string;
        email: string;
        name: string;
        orgId: string;
    };
    permissions: string[];
    subordinates: string[];
    orgId: string;
}

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
