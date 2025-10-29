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
import * as casbinClient from '@/lib/casbinClient';

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

    // Allow admin@arcus.local to bypass permission checks
    const isAdmin = sessionClaims.email === 'admin@arcus.local';

    // Only admins or users with manage-roles permission can list roles.
    if (!isAdmin) {
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

    // Allow admin@arcus.local to bypass permission checks
    const isAdmin = sessionClaims.email === 'admin@arcus.local';

    if (!isAdmin) {
      await assertPermission(sessionClaims, 'settings', 'manageRoles');
    }

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

    // Use org ID from session or default to a placeholder for admin
    const orgId = sessionClaims.orgId || null;

    const roleData: any = {
      name,
      permissions,
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Only add organization_id if it's available and valid
    if (orgId) {
      roleData.organization_id = orgId;
    }

    const { data: newRole, error } = await supabaseAdmin
      .from('roles')
      .insert([roleData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Sync role permissions to Casbin (with error handling)
    if (newRole && permissions && Array.isArray(permissions)) {
      try {
        console.log(`[Admin] Syncing role ${newRole.id} to Casbin...`);
        
        // Try to get the enforcer, but don't fail if it can't be initialized
        try {
          const enforcer = await casbinClient.getEnforcer();
          if (enforcer) {
            const roleSubject = `role:${newRole.id}`;

            // Add each permission to Casbin for this role
            for (const permission of permissions) {
              const { resource, action, effect = 'allow' } = permission;
              
              await casbinClient.addPolicy({
                subject: roleSubject,
                organizationId: orgId,
                resource,
                action,
                effect,
              });
            }

            console.log(`[Admin] ✅ Role ${newRole.id} synced to Casbin with ${permissions.length} permissions`);
          } else {
            console.log(`[Admin] Casbin enforcer not available, skipping Casbin sync`);
          }
        } catch (enforcerError) {
          console.warn(`[Admin] Casbin not initialized, skipping sync:`, enforcerError);
        }
      } catch (casbinError) {
        console.error(`[Admin] Warning: Failed to sync role to Casbin:`, casbinError);
        // Don't fail the request - role is created in DB even if Casbin sync fails
      }
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

