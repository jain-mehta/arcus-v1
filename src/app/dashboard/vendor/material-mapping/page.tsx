

import { MaterialMappingClient } from './client';
import { getMaterialMappings, getVolumeDiscounts } from './actions';

export default async function MaterialMappingPage() {
    const vendors = await getVendors();
    
    // Fetch initial data for the first vendor to avoid client-side loading on first paint
    const initialVendorId = vendors[0]?.id || null;
    const [initialMappings, initialDiscounts] = initialVendorId ? await Promise.all([
        getMaterialMappings(initialVendorId),
        // If there's a mapping, fetch discounts for the first one.
        getMaterialMappings(initialVendorId).then(maps => maps.length > 0 ? getVolumeDiscounts(maps[0].id) : [])
    ]) : [[], []];

    return (
        <MaterialMappingClient 
            vendors={vendors}
            initialMappings={initialMappings}
            initialDiscounts={initialDiscounts}
            initialSelectedVendorId={initialVendorId}
        />
    );
}


\n\n
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
