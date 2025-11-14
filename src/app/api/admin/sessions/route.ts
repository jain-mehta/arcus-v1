import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from '@/app/dashboard/sales/actions';
// TODO: Implement session management functions
// import { getSessionsForUser, revokeSession } from "@/lib/mock-sessions";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only admin role can access
  const userRoles = (user as any)?.roleIds || (user as any)?.role_ids || [];
  if (!Array.isArray(userRoles) || !userRoles.includes("admin"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // TODO: Implement session retrieval from database
  const sessions: any[] = [];
  // Mark which session belongs to the current caller (read cookie)
  const currentSessionId = req.cookies.get("sessionId")?.value || null;
  return NextResponse.json({ sessions, currentSessionId });
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRoles = (user as any)?.roleIds || (user as any)?.role_ids || [];
    if (!Array.isArray(userRoles) || !userRoles.includes("admin"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    // TODO: Implement session revocation in database
    const ok = true;
    return NextResponse.json({ success: ok });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 }
    );
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
