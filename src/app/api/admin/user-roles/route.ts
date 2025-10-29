/**
 * API endpoint for managing user-role assignments
 * 
 * POST   /api/admin/user-roles - Assign role to user
 * DELETE /api/admin/user-roles - Revoke role from user
 * GET    /api/admin/user-roles?userId=xxx&organizationId=yyy - Get user's roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';
import {
  assignUserRole,
  revokeUserRole,
  getUserRoles,
  getUserPermissions,
} from '@/lib/policyAdapterCasbin';

/**
 * Assign a role to a user
 * POST /api/admin/user-roles
 * 
 * Body:
 * {
 *   "userId": "user123",
 *   "roleId": "sales_manager",
 *   "organizationId": "org123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user claims
    const userClaims = await getSessionClaims();
    if (!userClaims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to assign roles
    await assertPermission(userClaims, 'users', 'changeRole', 'edit');

    const body = await request.json();
    const { userId, roleId, organizationId } = body;

    // Validate required fields
    if (!userId || !roleId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, roleId, organizationId' },
        { status: 400 }
      );
    }

    // Assign the role
    const success = await assignUserRole(userId, roleId, organizationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to assign role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Role ${roleId} assigned to user ${userId}`,
      assignment: { userId, roleId, organizationId },
    });
  } catch (error: any) {
    console.error('[API] Error assigning role:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}

/**
 * Revoke a role from a user
 * DELETE /api/admin/user-roles
 * 
 * Body:
 * {
 *   "userId": "user123",
 *   "roleId": "sales_manager",
 *   "organizationId": "org123"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user claims
    const userClaims = await getSessionClaims();
    if (!userClaims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to revoke roles
    await assertPermission(userClaims, 'users', 'changeRole', 'delete');

    const body = await request.json();
    const { userId, roleId, organizationId } = body;

    // Validate required fields
    if (!userId || !roleId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, roleId, organizationId' },
        { status: 400 }
      );
    }

    // Revoke the role
    const success = await revokeUserRole(userId, roleId, organizationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Role ${roleId} revoked from user ${userId}`,
    });
  } catch (error: any) {
    console.error('[API] Error revoking role:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}

/**
 * Get roles and permissions for a user
 * GET /api/admin/user-roles?userId=xxx&organizationId=yyy
 */
export async function GET(request: NextRequest) {
  try {
    // Get user claims
    const userClaims = await getSessionClaims();
    if (!userClaims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view user roles
    await assertPermission(userClaims, 'users', 'view', 'view');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing userId or organizationId parameter' },
        { status: 400 }
      );
    }

    // Get user's roles
    const roles = await getUserRoles(userId, organizationId);

    // Get user's permissions (with inheritance)
    const permissions = await getUserPermissions(userId, organizationId);

    return NextResponse.json({
      success: true,
      userId,
      organizationId,
      roles,
      permissions,
      permissionCount: permissions.length,
    });
  } catch (error: any) {
    console.error('[API] Error fetching user roles:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
