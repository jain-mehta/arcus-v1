/**
 * Permission Guard - Server-side permission checking
 * 
 * Use this in Server Components and Server Actions to verify permissions
 */

import { getSessionClaims } from './session';
import { checkPermission } from './rbac';
import { redirect } from 'next/navigation';

export async function requirePermission(
  moduleName: string,
  submoduleName?: string
): Promise<void> {
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims) {
    redirect('/login');
  }

  const hasPermission = await checkPermission(sessionClaims, moduleName, submoduleName);
  
  if (!hasPermission) {
    const permissionStr = submoduleName 
      ? `${moduleName}:${submoduleName}`
      : moduleName;
    
    throw new Error(`Access Denied: You don't have permission to access this resource. Required: ${permissionStr}`);
  }
}

export async function hasPermission(
  moduleName: string,
  submoduleName?: string
): Promise<boolean> {
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims) {
    return false;
  }

  return checkPermission(sessionClaims, moduleName, submoduleName);
}
