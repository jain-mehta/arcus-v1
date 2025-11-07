'use server';

import type { ExtractProductImageFromCatalogInput, ExtractProductImageFromCatalogOutput } from '@/ai/flows/extract-product-image-from-catalog';
import type { SuggestProductsFromCatalogTextOnlyInput, SuggestProductsFromCatalogTextOnlyOutput } from '@/ai/flows/suggest-products-from-catalog-text-only';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

export async function getProductSuggestionsFromCatalogTextOnly(
  input: SuggestProductsFromCatalogTextOnlyInput
): Promise<ActionResponse<SuggestProductsFromCatalogTextOnlyOutput>> {
    const authCheck = await checkActionPermission('inventory', 'ai-catalog', 'use');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const { suggestProductsFromCatalogTextOnly } = await import('@/ai/flows/suggest-products-from-catalog-text-only');
        const result = await suggestProductsFromCatalogTextOnly(input);
        await logUserAction(user, 'use', 'ai_catalog_suggestions', 'catalog', { inputLength: input.catalogText?.length || 0 });
        return createSuccessResponse(result, 'Product suggestions generated successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to generate product suggestions: ${error.message}`);
    }
}

export async function extractProductImage(
  input: ExtractProductImageFromCatalogInput
): Promise<ActionResponse<ExtractProductImageFromCatalogOutput>> {
    const authCheck = await checkActionPermission('inventory', 'ai-catalog', 'use');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const { extractProductImageFromCatalog } = await import('@/ai/flows/extract-product-image-from-catalog');
        const result = await extractProductImageFromCatalog(input);
        await logUserAction(user, 'use', 'ai_catalog_image_extract', 'catalog', { imageId: input.imageId });
        return createSuccessResponse(result, 'Product image extracted successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to extract product image: ${error.message}`);
    }
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
