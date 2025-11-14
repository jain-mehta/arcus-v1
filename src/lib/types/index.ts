/**
 * Type exports
 * Central location for exporting all types used across the application
 */

export * from './domain';

// ===== USER CONTEXT DOMAIN =====
export interface UserContext {
  user: any; // User object from auth system
  permissions: Record<string, any> | string[];
  subordinates: any[];
  orgId: string;
}
