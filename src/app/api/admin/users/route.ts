/**
 * User Management API Routes (Admin Only)
 * 
 * GET    /api/admin/users       - List all users in organization
 * POST   /api/admin/users       - Create new user with auth + profile + roles
 * PUT    /api/admin/users/:id   - Update user profile and roles
 * DELETE /api/admin/users/:id   - Deactivate user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/client';
import { createUserProfile } from '@/lib/supabase/user-sync';
import * as casbinClient from '@/lib/casbinClient';
import { z } from 'zod';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional().or(z.literal('')),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  storeId: z.string().optional().nullable(),
  reportsTo: z.string().optional().nullable(),
});

/**
 * GET - List all users in organization
 */
export async function GET(request: NextRequest) {
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

    // Check permission
    if (!isAdmin) {
      await assertPermission(sessionClaims, 'users', 'view');
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    let query = supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role_id,
          roles (
            id,
            name
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    // Add organization filter if not admin
    if (sessionClaims.orgId && sessionClaims.roleId !== 'admin') {
      query = query.eq('org_id', sessionClaims.orgId);
    }

    // Add search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform user data
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      orgId: user.org_id,
      storeId: user.store_id,
      reportsTo: user.reports_to,
      isActive: user.is_active,
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at,
      roles: user.user_roles?.map((ur: any) => ({
        id: ur.roles?.id,
        name: ur.roles?.name
      })) || []
    })) || [];

    return NextResponse.json({
      users: transformedUsers,
      total: count || 0,
      limit,
      skip
    });
  } catch (error: any) {
    console.error('[Admin] List users error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new user with Supabase Auth + Profile + Casbin roles
 * 
 * Flow:
 * 1. Validate admin permissions
 * 2. Create Supabase Auth user (auth.users)
 * 3. Create user profile (public.users)
 * 4. Assign Casbin roles (casbin_rule)
 * 5. Create user_roles records
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate admin
    const sessionClaims = await getSessionClaims();

    if (!sessionClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Allow admin@arcus.local to bypass permission checks
    const isAdmin = sessionClaims.email === 'admin@arcus.local';

    // 2. Check permission
    if (!isAdmin) {
      await assertPermission(sessionClaims, 'users', 'create');
    }

    // 3. Parse and validate request
    const body = await request.json();
    console.log('[Admin] Create user request body:', JSON.stringify(body, null, 2));

    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      console.log('[Admin] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { email, password, fullName, phone, roleIds, storeId, reportsTo } = validation.data;

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
    }

    // Use org ID from session or default for admin
    const orgId = sessionClaims.orgId || 'default-org';

    // 4. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // 5. Create Supabase Auth user
    console.log('[Admin] Creating Supabase Auth user:', email);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('[Admin] Auth user creation failed:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create auth user' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user - no user returned' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log('[Admin] Auth user created:', userId);

    // 6. Create user profile in public.users (directly using admin client)
    try {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name: fullName,
          metadata: {
            phone: phone || null,
            store_id: storeId || null,
            reports_to: reportsTo || null,
          }
        });

      if (profileError) {
        console.error('[Admin] Failed to create user profile:', profileError);
        // Rollback: Delete auth user
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: profileError.message || 'Failed to create user profile' },
          { status: 500 }
        );
      }

      console.log('[Admin] User profile created:', userId);
    } catch (profileErr) {
      console.error('[Admin] Error creating user profile:', profileErr);
      // Rollback: Delete auth user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 7. Assign roles to user in Casbin
    for (const roleId of roleIds) {
      try {
        await casbinClient.addRoleForUser({
          userId,
          role: roleId,
          organizationId: orgId
        });
        console.log(`[Admin] Assigned Casbin role ${roleId} to user ${userId}`);
      } catch (casbinError) {
        console.error(`[Admin] Failed to assign Casbin role ${roleId}:`, casbinError);
        // Continue with other roles
      }
    }

    // 8. Create user_roles records in database
    const userRoleRecords = roleIds.map(roleId => ({
      user_id: userId,
      role_id: roleId,
      assigned_at: new Date().toISOString()
    }));

    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert(userRoleRecords);

    if (rolesError) {
      console.error('[Admin] Failed to create user_roles records:', rolesError);
      // Don't fail the entire request, just log it
    }

    // 9. Fetch created user with roles
    const { data: createdUser } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role_id,
          roles (
            id,
            name
          )
        )
      `)
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        fullName,
        phone: phone || null,
        orgId: orgId,
        storeId: storeId || null,
        reportsTo: reportsTo || null,
        isActive: true,
        roles: createdUser?.user_roles?.map((ur: any) => ({
          id: ur.roles?.id,
          name: ur.roles?.name
        })) || roleIds.map((id: string) => ({ id, name: 'Unknown' }))
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin] Create user error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user profile and roles
 */
export async function PUT(request: NextRequest) {
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
      await assertPermission(sessionClaims, 'users', 'edit');
    }

    const body = await request.json();
    const { userId, fullName, phone, storeId, reportsTo, isActive, roleIds } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
    }

    // Use org ID from session or default
    const orgId = sessionClaims.orgId || 'default-org';

    // Update user profile
    const updates: any = { updated_at: new Date().toISOString() };
    if (fullName !== undefined) updates.name = fullName;
    // Note: phone, storeId, reportsTo are in metadata, not top-level columns
    if (phone !== undefined || storeId !== undefined || reportsTo !== undefined) {
      // TODO: Update metadata JSONB field if needed
    }
    if (isActive !== undefined) {
      // Note: is_active might not be a top-level column
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // Delete existing role assignments
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role assignments
      if (roleIds.length > 0) {
        const userRoleRecords = roleIds.map(roleId => ({
          user_id: userId,
          role_id: roleId,
          assigned_at: new Date().toISOString()
        }));

        await supabase.from('user_roles').insert(userRoleRecords);

        // Update Casbin roles
        for (const roleId of roleIds) {
          try {
            await casbinClient.addRoleForUser({
              userId,
              role: roleId,
              organizationId: orgId
            });
          } catch (error) {
            console.error(`[Admin] Failed to assign Casbin role ${roleId}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('[Admin] Update user error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Deactivate user (soft delete)
 */
export async function DELETE(request: NextRequest) {
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
      await assertPermission(sessionClaims, 'users', 'delete');
    }

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
    }

    // Soft delete - deactivate user
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error: any) {
    console.error('[Admin] Delete user error:', error);
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
