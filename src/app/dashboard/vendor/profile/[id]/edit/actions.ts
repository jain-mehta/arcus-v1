
'use server';

import { getVendor as getVendorFromDb, getStoreManagers as getStoreManagersFromDb, updateVendor as updateVendorInDb } from '../actions';
import type { Vendor } from '@/lib/types/domain';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getVendor(vendorId: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'profile', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const vendor = await getVendorFromDb(vendorId);
        await logUserAction(user, 'view', 'vendor_for_edit', vendorId);
        return vendor;
    } catch (error: any) {
        return createErrorResponse(`Failed to get vendor: ${error.message}`);
    }
}

export async function updateVendor(id: string, data: Partial<Vendor>): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'profile', 'edit');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const result = await updateVendorInDb(id, data);
        await logUserAction(user, 'update', 'vendor', id, { changes: Object.keys(data) });
        return result;
    } catch (error: any) {
        return createErrorResponse(`Failed to update vendor: ${error.message}`);
    }
}

export async function getStoreManagers(): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'profile', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const managers = await getStoreManagersFromDb();
        await logUserAction(user, 'view', 'store_managers_for_vendor');
        return managers;
    } catch (error: any) {
        return createErrorResponse(`Failed to get store managers: ${error.message}`);
    }
}
