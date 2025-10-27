/**
 * API Helper Functions
 * 
 * Provides standardized patterns for protected API endpoints:
 * - Extract & validate user context
 * - Permission checking via Permify
 * - Database datasource selection
 * - Error handling
 * - Response formatting
 * 
 * Usage:
 *   export async function GET(req: NextRequest) {
 *     return protectedApiHandler(req, async (context) => {
 *       const { userId, tenantId, dataSource } = context;
 *       // ... your logic
 *       return { data: result };
 *     });
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, isJWTExpired } from './auth/jwks-cache';
import { isSessionValid, getSession } from './auth/session-manager';

export interface ApiContext {
  userId: string;
  tenantId: string;
  jti: string;
  jwt: string;
  body?: any;
  query?: Record<string, string>;
  dataSource?: any; // Tenant DataSource
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Extract user context from request headers
 */
export async function extractUserContext(
  req: NextRequest
): Promise<Omit<ApiContext, 'body' | 'query'>> {
  const userId = req.headers.get('x-user-id');
  const tenantId = req.headers.get('x-tenant-id');
  const jti = req.headers.get('x-jti');
  const jwt = req.headers.get('x-jwt');

  if (!userId || !tenantId) {
    throw new Error('Missing user context in headers');
  }

  return {
    userId,
    tenantId,
    jti: jti || '',
    jwt: jwt || '',
  };
}

/**
 * Verify JWT token against Supabase JWKS
 */
export async function verifyUserJWT(jwt: string): Promise<any> {
  try {
    const claims = await verifyJWT(jwt);

    if (isJWTExpired(claims)) {
      throw new Error('JWT expired');
    }

    return claims;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error}`);
  }
}

/**
 * Verify session is not revoked in control-plane DB
 */
export async function verifySessionValid(jti: string): Promise<boolean> {
  if (!jti) {
    return false;
  }

  const isValid = await isSessionValid(jti);
  return isValid;
}

/**
 * Check if user has permission for action
 * Currently returns true; will integrate with Permify
 */
export async function checkPermission(
  userId: string,
  tenantId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // TODO: Integrate with Permify
  // For now, allow all authenticated users
  console.log(`Checking permission: ${userId}@${tenantId} ? ${resource}:${action}`);
  return true;
}

/**
 * Wrap API handler with auth + permission checks
 */
export async function protectedApiHandler<T = any>(
  req: NextRequest,
  handler: (context: ApiContext) => Promise<{ data?: T; error?: string }>,
  options?: {
    permission?: { resource: string; action: string };
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  }
): Promise<NextResponse> {
  try {
    // 1. Extract user context
    const context = await extractUserContext(req);

    // 2. Verify JWT signature (against Supabase JWKS)
    if (context.jwt) {
      try {
        await verifyUserJWT(context.jwt);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JWT signature' },
          { status: 401 }
        );
      }
    }

    // 3. Verify session is not revoked
    const sessionValid = await verifySessionValid(context.jti);
    if (!sessionValid) {
      return NextResponse.json(
        { error: 'Session revoked or expired' },
        { status: 401 }
      );
    }

    // 4. Check permissions (if specified)
    if (options?.permission) {
      const hasPermission = await checkPermission(
        context.userId,
        context.tenantId,
        options.permission.resource,
        options.permission.action
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // 5. Parse request body if needed
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      try {
        (context as any).body = await req.json();
      } catch {
        // Body optional for some requests
      }
    }

    // 6. Extract query parameters
    const url = new URL(req.url);
    (context as any).query = Object.fromEntries(url.searchParams);

    // 7. Call handler
    const result = await handler(context as ApiContext);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API handler error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Wrap public API handler (no auth required)
 */
export async function publicApiHandler<T = any>(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<{ data?: T; error?: string }>
): Promise<NextResponse> {
  try {
    const result = await handler(req);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API handler error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Format successful response
 */
export function apiSuccess<T>(data: T, metadata?: any): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(metadata && { metadata }),
    },
    { status: 200 }
  );
}

/**
 * Format error response
 */
export function apiError(statusOrMessage: number | string, message?: string): NextResponse {
  if (typeof statusOrMessage === 'number') {
    return NextResponse.json(
      {
        success: false,
        error: message || 'An error occurred',
      },
      { status: statusOrMessage }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: statusOrMessage,
    },
    { status: 400 }
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequired(data: any, fields: string[]): string[] | null {
  const missing: string[] = [];
  for (const field of fields) {
    if (!data || !data[field]) {
      missing.push(field);
    }
  }
  return missing.length > 0 ? missing : null;
}

/**
 * Health check endpoint (public)
 */
export async function healthCheckHandler(): Promise<NextResponse> {
  return apiSuccess({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

export default {
  protectedApiHandler,
  publicApiHandler,
  extractUserContext,
  verifyUserJWT,
  verifySessionValid,
  checkPermission,
  apiSuccess,
  apiError,
  validateRequired,
  healthCheckHandler,
};

