/**
 * Individual Role API Routes
 * 
 * GET /api/admin/roles/[roleId] - Get specific role
 * PUT /api/admin/roles/[roleId] - Update role
 * DELETE /api/admin/roles/[roleId] - Delete role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/client';

interface RouteContext {
  params: Promise<{ roleId: string }>;
}

/**
 * GET - Get specific role
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { roleId } = await context.params;
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await assertPermission(sessionClaims, 'settings', 'manageRoles');

    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      role,
    });
  } catch (error: any) {
    console.error('Get role error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get role' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update role
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { roleId } = await context.params;
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await assertPermission(sessionClaims, 'settings', 'manageRoles');

    // Prevent editing admin role
    if (roleId === 'admin') {
      return NextResponse.json(
        { error: 'Cannot edit built-in admin role' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const body = await request.json();
    const { name, permissions, description } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (permissions) updateData.permissions = permissions;
    if (description !== undefined) updateData.description = description;

    const { data: updatedRole, error } = await supabaseAdmin
      .from('roles')
      .update(updateData)
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      role: updatedRole,
    });
  } catch (error: any) {
    console.error('Update role error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete role
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { roleId } = await context.params;
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await assertPermission(sessionClaims, 'settings', 'manageRoles');

    // Prevent deleting admin role
    if (roleId === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete built-in admin role' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseServerClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Check if any users are assigned this role
    const { data: usersWithRole, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .contains('role_ids', [roleId])
      .limit(1);

    if (!checkError && usersWithRole && usersWithRole.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete role error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete role' },
      { status: 500 }
    );
  }
}
