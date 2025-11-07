/**
 * Permission Check API Route
 * Endpoint for frontend to validate user permission before action
 * 
 * POST /api/auth/check-permission
 * {
 *   "action": "edit",
 *   "resource": "lead",
 *   "resource_id": "lead-123"
 * }
 * 
 * Response:
 * {
 *   "allowed": true,
 *   "reason": "User has sales_manager role with lead_edit permission"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { checkPermission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    // Get user session claims
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Unauthorized', allowed: false },
        { status: 401 }
      );
    }

    // Parse request
    const body = await req.json();
    const { action, resource, resource_id, context } = body;

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Missing required fields: action, resource' },
        { status: 400 }
      );
    }

    // Check permission using Casbin RBAC
    const allowed = await checkPermission(
      sessionClaims,
      resource,
      resource_id ? 'specific' : undefined,
      action
    );

    return NextResponse.json({
      allowed,
      user_id: sessionClaims.uid,
      action,
      resource,
      resource_id,
      reason: allowed
        ? 'Permission granted by Casbin'
        : 'Permission denied by Casbin',
    });
  } catch (error: any) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Permission check failed', allowed: false },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

