/**
 * API endpoint for managing Casbin policies (permissions)
 * 
 * POST   /api/admin/policies - Add a policy
 * DELETE /api/admin/policies - Remove a policy
 * GET    /api/admin/policies?organizationId=xxx - List all policies for organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';
import {
  addPolicy,
  removePolicy,
  exportPolicies,
} from '@/lib/casbinClient';

/**
 * Add a new policy (permission)
 * POST /api/admin/policies
 * 
 * Body:
 * {
 *   "subject": "role:sales_manager" or "user:userId",
 *   "organizationId": "org123",
 *   "resource": "sales:leads",
 *   "action": "view" | "create" | "edit" | "delete" | "*",
 *   "effect": "allow" | "deny"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user claims
    const userClaims = await getSessionClaims();
    if (!userClaims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage policies
    await assertPermission(userClaims, 'permissions', 'manage', 'edit');

    const body = await request.json();
    const { subject, organizationId, resource, action, effect } = body;

    // Validate required fields
    if (!subject || !organizationId || !resource || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, organizationId, resource, action' },
        { status: 400 }
      );
    }

    // Add the policy
    const success = await addPolicy({
      subject,
      organizationId,
      resource,
      action,
      effect: effect || 'allow',
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to add policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Policy added successfully',
      policy: { subject, organizationId, resource, action, effect: effect || 'allow' },
    });
  } catch (error: any) {
    console.error('[API] Error adding policy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}

/**
 * Remove a policy
 * DELETE /api/admin/policies
 * 
 * Body:
 * {
 *   "subject": "role:sales_manager" or "user:userId",
 *   "organizationId": "org123",
 *   "resource": "sales:leads",
 *   "action": "view"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user claims
    const userClaims = await getSessionClaims();
    if (!userClaims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage policies
    await assertPermission(userClaims, 'permissions', 'manage', 'delete');

    const body = await request.json();
    const { subject, organizationId, resource, action } = body;

    // Validate required fields
    if (!subject || !organizationId || !resource || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, organizationId, resource, action' },
        { status: 400 }
      );
    }

    // Remove the policy
    const success = await removePolicy({
      subject,
      organizationId,
      resource,
      action,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove policy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Policy removed successfully',
    });
  } catch (error: any) {
    console.error('[API] Error removing policy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}

/**
 * Get all policies for an organization
 * GET /api/admin/policies?organizationId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Get user claims
    const userClaims = await getSessionClaims();
    if (!userClaims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view policies
    await assertPermission(userClaims, 'permissions', 'manage', 'view');

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Export all policies for the organization
    const policies = await exportPolicies(organizationId);

    return NextResponse.json({
      success: true,
      organizationId,
      ...policies,
    });
  } catch (error: any) {
    console.error('[API] Error fetching policies:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
