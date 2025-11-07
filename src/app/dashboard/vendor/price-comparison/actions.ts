'use server';

import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

async function getVendor(id: string) {
  return [].find((v) => v.id === id) || null;
}

export async function getAllMaterials(): Promise<ActionResponse<string[]>> {
    const authCheck = await checkActionPermission('vendor', 'price-comparison', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        const materials = new Set(MOCK_MATERIAL_MAPPINGS.map((m) => m.material));
        const materialList = Array.from(materials);
        await logUserAction(user, 'view', 'materials_list');
        return createSuccessResponse(materialList, 'Materials retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get materials: ${error.message}`);
    }
}

async function getPriceComparisonData(material: string) {
  return MOCK_MATERIAL_MAPPINGS.filter((m) => m.material === material);
}

export async function fetchPriceComparisonData(material: string): Promise<ActionResponse> {
    const authCheck = await checkActionPermission('vendor', 'price-comparison', 'view');
    if ('error' in authCheck) {
        return createErrorResponse(authCheck.error);
    }

    const { user } = authCheck;

    try {
        if (!material) {
            return createSuccessResponse([], 'No material specified');
        }

        const data = await getPriceComparisonData(material);

        const enrichedData = await Promise.all(
            data.map(async (mapping: MaterialMapping) => {
                const vendor = await getVendor(mapping.vendorId);
                return {
                    vendorName: vendor?.name || 'Unknown Vendor',
                    unitPrice: mapping.unitPrice,
                    qualityScore: vendor?.qualityScore || 0,
                };
            })
        );

        await logUserAction(user, 'view', 'price_comparison', 'material', { material, vendorCount: enrichedData.length });
        return createSuccessResponse(enrichedData, 'Price comparison data retrieved successfully');
    } catch (error: any) {
        return createErrorResponse(`Failed to get price comparison data: ${error.message}`);
    }
}\nimport { getSupabaseServerClient } from '@/lib/supabase/client';\n\n

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
