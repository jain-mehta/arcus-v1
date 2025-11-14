
'use server';

import { getProducts as getProductsFromDb } from '../data';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

/**
 * Fetches all products to be used for generating QR codes.
 * This is currently a pass-through to the main getProducts action.
 * In a real application, this could be extended to only fetch products
 * that have been updated recently or meet certain criteria.
 */
export async function getProductsForBarcode(): Promise<ActionResponse<any[]>> {
    const authCheck = await checkActionPermission('inventory', 'products', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const userContext: any = {
            user,
            permissions: [],
            subordinates: [],
            orgId: user.orgId || ''
        };

        const products = await getProductsFromDb(userContext);
        await logUserAction(user, 'view', 'qr_code_products');
        return createSuccessResponse(products, 'Products retrieved successfully for QR code generation');
    } catch (error: any) {
        return createErrorResponse(`Failed to get products for QR code: ${error.message}`);
    }
}
