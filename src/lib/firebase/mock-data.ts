/**
 * Mock Data - Client Safe
 * 
 * This file contains mock data that can be safely imported in client components.
 * It does not import any server-only modules.
 */

// Re-export data from firestore but in a client-safe way
export let MOCK_EMPLOYEE_REVIEWS: any[] = [];
export let MOCK_PERFORMANCE_CYCLES: any[] = [];
export let MOCK_USERS: any[] = [];
export let MOCK_ROLES: any[] = [];
export let MOCK_STORES: any[] = [];

// This file will be populated with actual data at runtime
// For now, these are empty arrays that can be used in client components
