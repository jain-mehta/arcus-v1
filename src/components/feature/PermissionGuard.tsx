/**
 * Permission Guard Component
 * Example component showing permission-based UI rendering
 * 
 * Usage:
 *   <PermissionGuard action="edit" resource="lead" resourceId={leadId}>
 *     <EditButton />
 *   </PermissionGuard>
 */

'use client';

import React, { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

export interface PermissionGuardProps {
  action: string;
  resource: string;
  resourceId?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showReason?: boolean;
}

export function PermissionGuard({
  action,
  resource,
  resourceId,
  children,
  fallback,
  showReason = false,
}: PermissionGuardProps) {
  const { allowed, loading, error } = usePermission(action, resource, resourceId);

  if (loading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="text-sm text-gray-500">Loading...</div>
    );
  }

  if (!allowed) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="text-sm text-red-500">
        {showReason ? error || 'Access denied' : ''}
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Disable button if user doesn't have permission
 */
export function PermissionButton({
  action,
  resource,
  resourceId,
  children,
  ...buttonProps
}: {
  action: string;
  resource: string;
  resourceId?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { allowed, loading } = usePermission(action, resource, resourceId);

  return (
    <button
      disabled={loading || !allowed}
      title={!allowed ? 'You do not have permission to perform this action' : undefined}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

/**
 * Show tooltip hint about permission status
 */
export function PermissionHint({
  action,
  resource,
  resourceId,
  children,
}: {
  action: string;
  resource: string;
  resourceId?: string;
  children: ReactNode;
}) {
  const { allowed, loading, error } = usePermission(action, resource, resourceId);

  return (
    <span title={loading ? 'Checking permission...' : error || undefined}>
      {children}
    </span>
  );
}

export default PermissionGuard;

