/**
 * usePermission Hook
 * Check permissions from React components
 * 
 * Usage:
 *   const { allowed, loading } = usePermission('edit', 'lead', leadId);
 *   
 *   if (loading) return <Spinner />;
 *   if (!allowed) return <Unauthorized />;
 *   return <EditForm />;
 */

'use client';

import { useState, useEffect } from 'react';

export interface PermissionCheckOptions {
  action: string;
  resource: string;
  resource_id?: string;
  context?: Record<string, any>;
  skip?: boolean;
}

export interface PermissionState {
  allowed: boolean | null;
  loading: boolean;
  error: string | null;
}

export function usePermission(
  action: string,
  resource: string,
  resource_id?: string,
  context?: Record<string, any>
): PermissionState {
  const [state, setState] = useState<PermissionState>({
    allowed: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setState({ allowed: null, loading: true, error: null });

        const response = await fetch('/api/auth/check-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            resource,
            resource_id,
            context: context || {},
          }),
        });

        if (!response.ok) {
          throw new Error(`Permission check failed: ${response.statusText}`);
        }

        const data = await response.json();

        setState({
          allowed: data.allowed,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          allowed: false,
          loading: false,
          error: error?.message || 'Permission check error',
        });
      }
    };

    checkPermission();
  }, [action, resource, resource_id, context]);

  return state;
}

/**
 * usePermissions - Check multiple permissions at once
 */
export function usePermissions(
  checks: Array<{
    action: string;
    resource: string;
    resource_id?: string;
  }>
): Record<string, boolean | null> {
  const results: Record<string, boolean | null> = {};

  checks.forEach((check) => {
    const key = `${check.action}:${check.resource}:${check.resource_id || '*'}`;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { allowed } = usePermission(check.action, check.resource, check.resource_id);
    results[key] = allowed;
  });

  return results;
}

export default usePermission;
