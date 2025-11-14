

import { MaterialMappingClient } from './client';
import { getMaterialMappings, getVolumeDiscounts } from './actions';
import { getVendors } from '../list/actions';

export default async function MaterialMappingPage() {
    const vendorsResult = await getVendors();
    const vendors = vendorsResult.success ? ((vendorsResult.data as any) || []) : [];
    
    // Fetch initial data for the first vendor to avoid client-side loading on first paint
    const initialVendorId = vendors[0]?.id || null;
    let initialMappings: any[] = [];
    let initialDiscounts: any[] = [];
    
    if (initialVendorId) {
        const mappingsResult = await getMaterialMappings(initialVendorId);
        const maps = mappingsResult.success ? ((mappingsResult.data as any) || []) : [];
        initialMappings = maps;
        
        if ((maps as any).length > 0) {
            const discountsResult = await getVolumeDiscounts((maps as any)[0].id);
            initialDiscounts = discountsResult.success ? ((discountsResult.data as any) || []) : [];
        }
    }

    return (
        <MaterialMappingClient 
            vendors={vendors}
            initialMappings={initialMappings}
            initialDiscounts={initialDiscounts}
            initialSelectedVendorId={initialVendorId}
        />
    );
}



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
