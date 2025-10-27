/**
 * Role Management API Routes
 * 
 * GET /api/admin/roles - List all roles for organization
 * POST /api/admin/roles - Create new role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/client';

/**
 * GET - List all roles for the user's organization
 */
export async function GET() {
  try {
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins or users with manage-roles permission can list roles.
    try {
      await assertPermission(sessionClaims, 'settings', 'manageRoles');
    } catch (err) {
      // Fallback: allow users with 'users:create' (manage users) permission
      try {
        await assertPermission(sessionClaims, 'users', 'create');
      } catch (err2) {
        // Neither permission present - deny
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }
    
    // Fetch roles from Supabase
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      roles: roles || [],
    });
  } catch (error: any) {
    console.error('List roles error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to list roles' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await assertPermission(sessionClaims, 'settings', 'manageRoles');

    const body = await request.json();
    const { name, permissions, description } = body;

    if (!name || !permissions) {
      return NextResponse.json(
        { error: 'Name and permissions are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const roleData = {
      name,
      permissions,
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newRole, error } = await supabaseAdmin
      .from('roles')
      .insert([roleData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      role: newRole,
    });
  } catch (error: any) {
    console.error('Create role error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create role' },
      { status: 500 }
    );
  }
}

