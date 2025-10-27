/**
 * Get User Permissions API Route
 * 
 * Returns the permission map for the current authenticated user's role.
 */

import { NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { getRolePermissions } from '@/lib/rbac';

export async function GET() {
  try {
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // If permissions already in claims, return them
    const permissions = (sessionClaims as any).permissions;
    if (permissions) {
      return NextResponse.json({ permissions });
    }

    // Fetch from role document
    if (!sessionClaims.roleId) {
      return NextResponse.json(
        { error: 'No role assigned' },
        { status: 403 }
      );
    }

    const rolePermissions = await getRolePermissions(sessionClaims.roleId);

    if (!rolePermissions) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ permissions: rolePermissions });
  } catch (error: any) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get permissions' },
      { status: 500 }
    );
  }
}

