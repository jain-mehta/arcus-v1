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
import { getFirebaseAdmin } from '@/lib/firebase/firebase-admin';

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

    const { db } = getFirebaseAdmin();
    const roleDoc = await db.collection('roles').doc(roleId).get();

    if (!roleDoc.exists) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    const roleData = roleDoc.data();

    // Verify role belongs to user's organization
    if (roleData?.orgId !== sessionClaims.orgId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      role: {
        id: roleDoc.id,
        ...roleData,
      },
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

    const { db } = getFirebaseAdmin();
    const roleDoc = await db.collection('roles').doc(roleId).get();

    if (!roleDoc.exists) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    const existingData = roleDoc.data();

    // Verify role belongs to user's organization
    if (existingData?.orgId !== sessionClaims.orgId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, permissions } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
      updatedBy: sessionClaims.uid,
    };

    if (name) updateData.name = name;
    if (permissions) updateData.permissions = permissions;

    await roleDoc.ref.update(updateData);

    return NextResponse.json({
      success: true,
      role: {
        id: roleDoc.id,
        ...existingData,
        ...updateData,
      },
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

    const { db } = getFirebaseAdmin();
    const roleDoc = await db.collection('roles').doc(roleId).get();

    if (!roleDoc.exists) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    const roleData = roleDoc.data();

    // Verify role belongs to user's organization
    if (roleData?.orgId !== sessionClaims.orgId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Check if any users are assigned this role
    const usersWithRole = await db
      .collection('users')
      .where('roleId', '==', roleId)
      .limit(1)
      .get();

    if (!usersWithRole.empty) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to users' },
        { status: 400 }
      );
    }

    await roleDoc.ref.delete();

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
