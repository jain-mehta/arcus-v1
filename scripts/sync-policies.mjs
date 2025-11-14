#!/usr/bin/env node

/**
 * Policy Sync CLI
 * Synchronize schema and roles from src/policy/ to Permify
 *
 * Usage:
 *   pnpm run sync:policies
 *   pnpm run sync:policies --tenant-id staging
 *   pnpm run sync:policies --permify-url http://localhost:3001 --api-key xyz
 */

import { syncPolicies, loadRoles, loadSchema } from '../src/lib/policyAdapter.js';

const args = process.argv.slice(2);
const flags = {};

// Parse CLI flags
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    const value = args[i + 1]?.startsWith('--') ? 'true' : args[i + 1];
    flags[key] = value || 'true';
    if (!value || value.startsWith('--')) i--;
    else i++;
  }
}

// Set env vars from flags
if (flags['permify-url']) process.env.PERMIFY_URL = flags['permify-url'];
if (flags['api-key']) process.env.PERMIFY_API_KEY = flags['api-key'];
if (flags['policy-engine']) process.env.POLICY_ENGINE = flags['policy-engine'];

const tenantId = flags['tenant-id'] || process.env.TENANT_ID || 'default';

async function main() {
  try {
    console.log('🔐 Policy Sync CLI');

    // Validate environment
    if (!process.env.PERMIFY_URL && process.env.POLICY_ENGINE !== 'mock') {
      console.warn('⚠️  PERMIFY_URL not set; using mock mode (POLICY_ENGINE=mock)');
      process.env.POLICY_ENGINE = 'mock';
    }

    if (!process.env.PERMIFY_API_KEY && process.env.POLICY_ENGINE !== 'mock') {
      console.warn('⚠️  PERMIFY_API_KEY not set');
    }

    // Load and display files
    console.log('📂 Files:');
    const schema = await loadSchema();
    const roles = await loadRoles();

    console.log(`  ✓ Schema: ${schema.length} bytes`);
    console.log(`  ✓ Roles: ${Object.keys(roles).length} defined`);

    if (!schema) {
      console.error('❌ Schema not found at src/policy/schema.perm');
      process.exit(1);
    }

    if (!roles || Object.keys(roles).length === 0) {
      console.error('❌ Roles not found at src/policy/roles.json');
      process.exit(1);
    }

    console.log('');

    // Sync
    const success = await syncPolicies(tenantId);

    if (success) {
      console.log('✅ Policy sync successful!');
      console.log(`   Tenant: ${tenantId}`);
      console.log(`   Engine: ${process.env.POLICY_ENGINE || 'permify'}`);
      if (process.env.PERMIFY_URL) {
        console.log(`   Permify: ${process.env.PERMIFY_URL}`);
      }
      process.exit(0);
    } else {
      console.error('❌ Policy sync failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
