

// Avoid importing firebase-admin at module scope. If needed, dynamically import within server-only paths.
import { MOCK_ROLES, MOCK_USERS } from './firestore';
import type { Role, User } from './types';


/**
 * Retrieves a single user document from Firestore.
 * This function now uses the mock data.
 * @param userId The ID of the user to fetch.
 * @returns A promise that resolves to the User object or null if not found.
 */
export async function getUser(userId: string): Promise<User | null> {
    const user = MOCK_USERS.find(u => u.id === userId) || null;
    return Promise.resolve(user);
}


/**
 * **Authoritative: Computes a user's effective permissions.**
 * 
 * This server-side function is the single source of truth for determining all permissions
 * a user has. It aggregates permissions from all roles assigned to the user and merges them
 * with any granular, custom permissions assigned directly to the user account. The final
 * result is a de-duplicated set of permission strings.
 * 
 * All sensitive APIs and data access functions MUST use this function to authorize user actions.
 * 
 * @param userId The ID of the user for whom to calculate effective permissions.
 * @returns A promise that resolves to a de-duplicated array of permission strings.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
    const user = await getUser(userId);

    if (!user) {
        return [];
    }

    const permissions = new Set<string>(user.customPermissions || []);

    if (user.roleIds && user.roleIds.length > 0) {
        // MOCK IMPLEMENTATION
        const userRoles = MOCK_ROLES.filter(role => user.roleIds.includes(role.id));
        userRoles.forEach(role => {
            // Handle new permission structure: module -> submodule -> action -> boolean
            Object.entries(role.permissions || {}).forEach(([module, modulePerms]) => {
                if (modulePerms && typeof modulePerms === 'object') {
                    Object.entries(modulePerms).forEach(([submodule, submoduleVal]) => {
                        if (typeof submoduleVal === 'boolean' && submoduleVal === true) {
                            permissions.add(`${module}:${submodule}`);
                        } else if (submoduleVal && typeof submoduleVal === 'object') {
                            // 3-level structure: module -> submodule -> action
                            Object.entries(submoduleVal).forEach(([action, enabled]) => {
                                if (enabled === true) {
                                    permissions.add(`${module}:${submodule}:${action}`);
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    return Array.from(permissions);
}

/**
 * Retrieves the user IDs of all direct and indirect subordinates for a given manager.
 * @param managerId The user ID of the manager.
 * @returns A promise that resolves to an array of subordinate user IDs.
 */
export async function getSubordinates(managerId: string): Promise<string[]> {
    const subordinates: string[] = [];
    const queue: string[] = [managerId];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const currentManagerId = queue.shift()!;
        if (visited.has(currentManagerId)) {
            continue;
        }
        visited.add(currentManagerId);

        const directReports = MOCK_USERS.filter(u => u.reportsTo === currentManagerId);

        for (const report of directReports) {
            // Add the direct report's ID to the main list
            if (!subordinates.includes(report.id)) {
                 subordinates.push(report.id);
            }
            // Add the direct report to the queue to find their reports
            queue.push(report.id);
        }
    }
    
    return subordinates;
}

/**
 * Check whether the user has a required permission.
 * Supports exact match and simple module-level wildcard checks (e.g. "store:*").
 */
export async function userHasPermission(userId: string, requiredPermission: string): Promise<boolean> {
    const perms = await getUserPermissions(userId);
    if (perms.includes(requiredPermission)) return true;

    // Module wildcard: if requiredPermission is like 'store:billing:create', allow if user has 'store:*'
    const parts = requiredPermission.split(':');
    if (parts.length > 0) {
        const moduleWildcard = `${parts[0]}:*`;
        if (perms.includes(moduleWildcard)) return true;
    }

    return false;
}

export async function assertUserPermission(userId: string, requiredPermission: string) {
    const ok = await userHasPermission(userId, requiredPermission);
    if (!ok) {
        const err: any = new Error('Forbidden');
        err.code = 403;
        throw err;
    }
}



