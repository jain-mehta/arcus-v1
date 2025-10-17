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
    if (sessionClaims.permissions) {
      return NextResponse.json({ permissions: sessionClaims.permissions });
    }

    // Fetch from role document
    if (!sessionClaims.roleId) {
      return NextResponse.json(
        { error: 'No role assigned' },
        { status: 403 }
      );
    }

    const permissions = await getRolePermissions(sessionClaims.roleId);

    if (!permissions) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get permissions' },
      { status: 500 }
    );
  }
}
