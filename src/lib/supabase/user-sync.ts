/**
 * User Sync Service
 * 
 * Synchronizes Supabase Auth (auth.users) with Application Database (public.users)
 * 
 * Flow:
 * 1. User authenticates via Supabase Auth → auth.users record created
 * 2. On successful auth, this service creates corresponding public.users profile
 * 3. Creates default user-role mappings and org assignments
 * 4. Ensures both layers are always in sync
 * 
 * This is essential for multi-tenant, enterprise-grade applications where:
 * - Auth layer (Supabase) handles credentials
 * - App layer (PostgreSQL) handles user profiles, roles, permissions
 * - User must exist in BOTH for successful login
 */

import { createClient } from '@supabase/supabase-js';

interface SyncedUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  organizationId?: string;
}

interface CreateUserProfileParams {
  authUserId: string;
  email: string;
  fullName?: string;
  organizationId?: string;
  autoAssignRole?: string;
  metadata?: Record<string, any>;
}

/**
 * Get Supabase client for database operations
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Create user profile in public.users table
 * Called after Supabase Auth successfully authenticates user
 * 
 * @param params User creation parameters
 * @returns Created user profile with ID
 */
export async function createUserProfile(params: CreateUserProfileParams): Promise<SyncedUser | null> {
  try {
    const supabase = getSupabaseClient();

    const {
      authUserId,
      email,
      fullName = 'User',
      organizationId,
      autoAssignRole = 'user',
      metadata = {},
    } = params;

    // Check if user already exists in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log(`[UserSync] User profile already exists for ${email}`);
      return {
        id: existingUser.id,
        email,
        fullName,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        organizationId,
      };
    }

    // Create user profile in public.users with Supabase Auth UUID as primary ID
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: authUserId, // Use Supabase Auth user ID directly
        email,
        full_name: fullName,
        is_active: true,
        is_email_verified: true,
        email_verified_at: new Date().toISOString(),
        password_hash: '', // Not used - auth handled by Supabase
        ...metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('[UserSync] Failed to create user profile:', error);
      return null;
    }

    console.log(`[UserSync] Created user profile for ${email} (ID: ${authUserId})`);

    // Assign default role if organization is specified
    if (organizationId && autoAssignRole) {
      await assignDefaultRole(authUserId, organizationId, autoAssignRole);
    }

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      isActive: newUser.is_active,
      isEmailVerified: newUser.is_email_verified,
      createdAt: new Date(newUser.created_at),
      organizationId,
    };
  } catch (error) {
    console.error('[UserSync] Error creating user profile:', error);
    return null;
  }
}

/**
 * Get or create user profile
 * Idempotent operation - safe to call multiple times
 * 
 * @param authUserId User ID from Supabase Auth
 * @param email User email from Supabase Auth
 * @param fullName Display name
 * @returns User profile (existing or newly created)
 */
export async function getOrCreateUserProfile(
  authUserId: string,
  email: string,
  fullName?: string
): Promise<SyncedUser | null> {
  try {
    const supabase = getSupabaseClient();

    // Try to get existing user
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle();

    if (existingUser) {
      return {
        id: existingUser.id,
        email: existingUser.email,
        fullName: existingUser.full_name,
        isActive: existingUser.is_active,
        isEmailVerified: existingUser.is_email_verified,
        createdAt: new Date(existingUser.created_at),
      };
    }

    // User doesn't exist, create profile
    return await createUserProfile({
      authUserId,
      email,
      fullName: fullName || email.split('@')[0],
    });
  } catch (error) {
    console.error('[UserSync] Error getting or creating user profile:', error);
    return null;
  }
}

/**
 * Assign default role to user in organization
 * 
 * @param userId User ID
 * @param organizationId Organization ID
 * @param roleName Role name (e.g., 'admin', 'manager', 'user')
 */
async function assignDefaultRole(
  userId: string,
  organizationId: string,
  roleName: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    // Get role ID by name in organization
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', roleName)
      .maybeSingle();

    if (roleError || !role) {
      console.warn(
        `[UserSync] Could not find role "${roleName}" in organization ${organizationId}. User will have no roles.`
      );
      return false;
    }

    // Create user-role assignment
    const { error: assignError } = await supabase.from('user_roles').insert({
      user_id: userId,
      role_id: role.id,
      organization_id: organizationId,
      assigned_at: new Date().toISOString(),
    });

    if (assignError) {
      console.warn(`[UserSync] Failed to assign role to user:`, assignError);
      return false;
    }

    console.log(`[UserSync] Assigned role "${roleName}" to user ${userId}`);
    return true;
  } catch (error) {
    console.error('[UserSync] Error assigning role:', error);
    return false;
  }
}

/**
 * Verify user profile exists and is active
 * Called before allowing access to protected resources
 * 
 * @param authUserId User ID from Supabase Auth
 * @returns True if user profile is active
 */
export async function verifyUserProfile(authUserId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', authUserId)
      .maybeSingle();

    if (error || !data) {
      console.warn(`[UserSync] User profile not found for ${authUserId}`);
      return false;
    }

    return data.is_active === true;
  } catch (error) {
    console.error('[UserSync] Error verifying user profile:', error);
    return false;
  }
}

/**
 * Update user profile
 * 
 * @param userId User ID
 * @param updates Fields to update
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    fullName: string;
    phone: string;
    isActive: boolean;
    isEmailVerified: boolean;
  }>
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const updateData: Record<string, any> = {};
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isEmailVerified !== undefined) updateData.is_email_verified = updates.isEmailVerified;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('[UserSync] Failed to update user profile:', error);
      return false;
    }

    console.log(`[UserSync] Updated user profile for ${userId}`);
    return true;
  } catch (error) {
    console.error('[UserSync] Error updating user profile:', error);
    return false;
  }
}

/**
 * Get user by email
 * 
 * @param email User email
 * @returns User profile or null
 */
export async function getUserByEmail(email: string): Promise<SyncedUser | null> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      isActive: data.is_active,
      isEmailVerified: data.is_email_verified,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('[UserSync] Error getting user by email:', error);
    return null;
  }
}
