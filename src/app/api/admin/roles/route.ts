/**
 * Role Management API Routes
 * 
 * GET /api/admin/roles - List all roles for organization
 * POST /api/admin/roles - Create new role
 * PUT /api/admin/roles/[roleId] - Update role
 * DELETE /api/admin/roles/[roleId] - Delete role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';
import { getFirebaseAdmin } from '@/lib/firebase/firebase-admin';

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
    // Additionally allow users who can create/manage users to fetch roles so
    // they can assign roles while creating users (common UX requirement).
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

    const { db } = getFirebaseAdmin();
    
    // Fetch roles from Firestore (real roles defined in Roles & Hierarchy)
    // If orgId is not set (dev/mock scenario), return empty array
    if (!sessionClaims.orgId) {
      console.warn('[Roles API] No orgId in session, returning empty roles');
      return NextResponse.json({ roles: [] });
    }

    const rolesSnapshot = await db
      .collection('roles')
      .where('orgId', '==', sessionClaims.orgId)
      .get();

    const roles = rolesSnapshot.docs.map(doc => {
      const data = doc.data();
      // Serialize Firestore Timestamps to plain objects for JSON response
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    }) as any[];

    // Build hierarchy information if reportsToRoleId exists
    const hierarchy = roles.map(role => ({
      ...role,
      children: roles.filter(r => r.reportsToRoleId === role.id).map(r => r.id),
    }));

    return NextResponse.json({ 
      roles,
      hierarchy, // Include hierarchy for UI visualization
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
    const { name, permissions } = body;

    if (!name || !permissions) {
      return NextResponse.json(
        { error: 'Name and permissions are required' },
        { status: 400 }
      );
    }

    const { db } = getFirebaseAdmin();
    const roleRef = db.collection('roles').doc();

    const roleData = {
      name,
      orgId: sessionClaims.orgId,
      permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: sessionClaims.uid,
    };

    await roleRef.set(roleData);

    return NextResponse.json({
      success: true,
      role: {
        id: roleRef.id,
        ...roleData,
      },
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
