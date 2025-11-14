import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/dashboard/sales/actions';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }

        // TODO: Implement permission checking
        // await assertUserPermission(user.id, 'manage-settlements');

        // Basic validation (ensure required fields present)
        const required = ['employeeId', 'lastWorkingDay', 'reason', 'earnings', 'deductions'];
        for (const k of required) {
            if (!(k in body)) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
        }

        const settlement = {
            settlementNumber: body.settlementNumber || `FNF-${Date.now()}`,
            employeeId: body.employeeId,
            lastWorkingDay: body.lastWorkingDay,
            reason: body.reason,
            earnings: body.earnings,
            deductions: body.deductions,
            totalEarnings: body.totalEarnings,
            totalDeductions: body.totalDeductions,
            netPayable: body.netPayable,
            processedBy: user.id,
            processedByName: user.name,
        };

        // TODO: Implement settlement creation in database
        const saved = { ...settlement, id: Date.now().toString() };

        return NextResponse.json({ success: true, settlement: saved });
    } catch (err: any) {
        console.error('Settlement API error:', err);
        const status = err?.code === 403 ? 403 : 500;
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status });
    }
}


import { getSupabaseServerClient } from '@/lib/supabase/client';
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
