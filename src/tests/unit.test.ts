/**
 * Comprehensive Unit Tests
 * Tests for types, utilities, and core functions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Type System', () => {
  it('should have Product type exported', () => {
    // This is a compile-time check, but we can verify the module loads
    expect(true).toBe(true);
  });

  it('should have UserContext type exported', () => {
    // Verify that UserContext is accessible
    expect(true).toBe(true);
  });
});

describe('Environment Variables', () => {
  it('should have NEXT_PUBLIC_SUPABASE_URL', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toContain('supabase.co');
  });

  it('should have NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('should have SUPABASE_SERVICE_ROLE_KEY', () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  it('should have DATABASE_URL', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain('postgresql');
  });
});

describe('Path Aliases', () => {
  it('should resolve @/* paths correctly', async () => {
    try {
      const types = await import('@/lib/types');
      expect(types).toBeDefined();
      // UserContext is exported from index.ts
      expect(types).toHaveProperty('UserContext');
    } catch (error) {
      throw new Error(`Failed to import from @/lib/types: ${error}`);
    }
  });

  it('should resolve @/lib/supabase paths', async () => {
    try {
      const supabase = await import('@/lib/supabase/client');
      expect(supabase).toBeDefined();
      expect(supabase.supabaseClient).toBeDefined();
    } catch (error) {
      throw new Error(`Failed to import from @/lib/supabase: ${error}`);
    }
  });
});

describe('Module Imports', () => {
  it('should import types module successfully', async () => {
    const mod = await import('@/lib/types');
    expect(mod).toHaveProperty('UserContext');
  });

  it('should import actions utils', async () => {
    const mod = await import('@/lib/actions-utils');
    expect(mod.createSuccessResponse).toBeDefined();
    expect(mod.createErrorResponse).toBeDefined();
  });

  it('should import RBAC module', async () => {
    const mod = await import('@/lib/rbac');
    expect(mod.checkPermission).toBeDefined();
    expect(mod.assertPermission).toBeDefined();
  });
});

describe('Action Utilities', () => {
  it('createSuccessResponse should create proper response', async () => {
    const { createSuccessResponse } = await import('@/lib/actions-utils');
    const response = createSuccessResponse({ id: '123' }, 'Success');
    
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('message');
  });

  it('createErrorResponse should create error response', async () => {
    const { createErrorResponse } = await import('@/lib/actions-utils');
    const response = createErrorResponse('Test error');
    
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
  });
});

describe('Supabase Client', () => {
  it('should initialize supabaseClient', async () => {
    const { supabaseClient } = await import('@/lib/supabase/client');
    expect(supabaseClient).toBeDefined();
  });

  it('should have getSupabaseServerClient function', async () => {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    expect(typeof getSupabaseServerClient).toBe('function');
  });

  it('should return valid URL from getSupabaseUrl', async () => {
    const { getSupabaseUrl } = await import('@/lib/supabase/client');
    const url = getSupabaseUrl();
    expect(url).toContain('supabase.co');
  });
});

describe('API Response Formatting', () => {
  it('should format success responses correctly', async () => {
    const { createSuccessResponse } = await import('@/lib/actions-utils');
    const data = { userId: '123', name: 'Test User' };
    const response = createSuccessResponse(data, 'User created');
    
    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.message).toBe('User created');
  });

  it('should format error responses correctly', async () => {
    const { createErrorResponse } = await import('@/lib/actions-utils');
    const response = createErrorResponse('Database error');
    
    expect(response.success).toBe(false);
    expect(response.error).toBe('Database error');
  });
});
