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
import { getCurrentUserFromSession } from '@/lib/session';
import { evaluatePolicy } from '@/lib/policyAdapter';

export async function POST(req: NextRequest) {
  try {
    // Get user from Firebase session
    const decodedClaims = await getCurrentUserFromSession();

    if (!decodedClaims) {
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

    // Evaluate policy
    const allowed = await evaluatePolicy({
      principal: decodedClaims.uid,
      action,
      resource: resource_id ? `${resource}:${resource_id}` : resource,
      context: context || {},
      tenant_id: decodedClaims.tenant_id,
    });

    return NextResponse.json({
      allowed,
      user_id: decodedClaims.uid,
      action,
      resource,
      resource_id,
      reason: allowed
        ? 'Permission granted'
        : 'Permission denied',
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
