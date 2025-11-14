#!/usr/bin/env node

/**
 * Simple test to verify permission mapper is working correctly
 */

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the permission system
const mockPermissions = {
  dashboard: { 
    view: true, 
    manage: true,
    'dashboard:view': true,
    'dashboard:manage': true
  },
  users: { 
    viewAll: true,
    view: true,
    create: true, 
    edit: true, 
    delete: true, 
    manage: true,
    'users:viewAll': true,
    'users:view': true,
    'users:create': true,
    'users:edit': true,
    'users:delete': true,
    'users:manage': true,
    'users:invite': true,
  },
  vendor: { 
    viewAll: true,
    view: true,
    create: true, 
    edit: true, 
    delete: true, 
    manage: true,
    'vendor:viewAll': true,
    'vendor:view': true,
    'vendor:create': true,
    'vendor:edit': true,
    'vendor:delete': true,
    'vendor:manage': true,
  },
};

// Permission strings from navigation config
const testPermissionStrings = [
  'dashboard:view',
  'vendor:viewAll',
  'users:viewAll',
  'sales:leads:view',
];

function hasOldPermission(permissions, permissionString) {
  if (!permissions) return false;

  // Check if it's the new format (module:submodule or module:submodule:action)
  if (permissionString.includes(':')) {
    const parts = permissionString.split(':');
    const module = parts[0];
    const submodule = parts[1];
    const action = parts[2];

    console.log(`[Test] Checking permission: ${permissionString}`);
    console.log(`  Parsed: module=${module}, submodule=${submodule}, action=${action}`);

    const modulePerms = permissions[module];
    if (!modulePerms) {
      console.log(`  ✗ Module "${module}" not found in permissions`);
      return false;
    }

    console.log(`  Module found: ${module}`);
    console.log(`  Module keys:`, Object.keys(modulePerms).slice(0, 5));

    // Strategy 1: Check if the exact permission key exists with true value
    if (modulePerms[submodule] === true) {
      console.log(`  ✓ Permission granted (direct submodule): ${submodule}`);
      return true;
    }

    // Try nested permission with action (e.g., modulePerms['leads:view'])
    const nestedKey = `${submodule}:${action || 'view'}`;
    if (modulePerms[nestedKey] === true) {
      console.log(`  ✓ Permission granted (nested key): ${nestedKey}`);
      return true;
    }

    // Try the full dotted permission (e.g., modulePerms['sales:leads:view'])
    const fullKey = `${module}:${submodule}:${action || 'view'}`;
    if (modulePerms[fullKey] === true) {
      console.log(`  ✓ Permission granted (full key): ${fullKey}`);
      return true;
    }

    // Strategy 2: Check if submodule value is a boolean true
    const submoduleValue = modulePerms[submodule];
    if (typeof submoduleValue === 'boolean' && submoduleValue) {
      console.log(`  ✓ Permission granted (boolean submodule): ${submodule}`);
      return true;
    }

    // Strategy 3: If submodule value is an object (nested actions), check if any action is true
    if (typeof submoduleValue === 'object' && submoduleValue !== null) {
      if (action) {
        const actionResult = submoduleValue[action] === true;
        console.log(`  Action check (${action} in object):`, actionResult ? '✓' : '✗');
        return actionResult;
      } else {
        const result = Object.values(submoduleValue).some(val => val === true);
        console.log(`  Any action in object:`, result ? '✓' : '✗');
        return result;
      }
    }

    console.log(`  ✗ No permission found for: ${permissionString}`);
    return false;
  }

  return false;
}

// Test the permission checking
console.log('=== Permission Mapper Test ===');
console.log('Testing permission strings from navigation config:');

testPermissionStrings.forEach(permStr => {
  const hasPermission = hasOldPermission(mockPermissions, permStr);
  const result = hasPermission ? '✓ PASS' : '✗ FAIL';
  console.log(`${result}: ${permStr}`);
});

console.log('=== Summary ===');
const results = testPermissionStrings.map(p => hasOldPermission(mockPermissions, p));
const passed = results.filter(r => r).length;
console.log(`Passed: ${passed}/${testPermissionStrings.length}`);

if (passed === testPermissionStrings.length) {
  console.log('✓ All tests passed! Permission mapper is working correctly.');
  process.exit(0);
} else {
  console.log('✗ Some tests failed. There are issues with permission mapping.');
  process.exit(1);
}
