#!/usr/bin/env node
/**
 * scripts/check-supabase-connection.mjs
 *
 * Small utility to verify connectivity between this project and your Supabase
 * project. It performs two checks:
 *  1) Auth admin endpoint (requires SUPABASE_SERVICE_ROLE_KEY)
 *  2) REST endpoint reachability (ping /rest/v1)
 *
 * Usage:
 *   - Create a .env.local file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - Or set these env vars in your shell
 *
 * Example (.env.local):
 * SUPABASE_URL=https://your-project.supabase.co
 * SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI... (service role key)
 *
 * Run:
 *   node ./scripts/check-supabase-connection.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env files (project root .env.local or .env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// Extract Supabase URL from JWKS_URL or use SUPABASE_URL
let SUPABASE_URL = process.env.SUPABASE_URL || '';
if (!SUPABASE_URL && process.env.SUPABASE_JWKS_URL) {
  // Extract base URL from SUPABASE_JWKS_URL (e.g., https://asuxcwlbzspsifvigmov.supabase.co from https://asuxcwlbzspsifvigmov.supabase.co)
  SUPABASE_URL = process.env.SUPABASE_JWKS_URL.trim();
}

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || '';

async function checkAuthAdmin() {
  if (!SUPABASE_URL) {
    console.error('✖ SUPABASE_URL not set. Please set SUPABASE_URL in .env.local or environment.');
    return { ok: false, reason: 'NO_SUPABASE_URL' };
  }

  if (!SERVICE_ROLE_KEY) {
    console.error('✖ SUPABASE_SERVICE_ROLE_KEY not set. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local or environment.');
    return { ok: false, reason: 'NO_SERVICE_KEY' };
  }

  const url = SUPABASE_URL.replace(/\/+$/,'') + '/auth/v1/admin/users?limit=1';

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      // timeout not natively supported in node fetch; rely on environment
    });

    if (res.status === 200) {
      console.log('✔ Auth admin endpoint reachable and service role key appears valid (200).');
      return { ok: true };
    }

    if (res.status === 401 || res.status === 403) {
      console.error(`✖ Auth admin responded ${res.status} - the service role key may be invalid or revoked.`);
      const text = await res.text();
      console.error('Response:', text);
      return { ok: false, reason: 'INVALID_KEY', status: res.status, body: text };
    }

    console.warn(`⚠ Auth admin responded with HTTP ${res.status}.`);
    const body = await res.text();
    console.warn(body);
    return { ok: false, reason: 'UNEXPECTED_STATUS', status: res.status, body };
  } catch (err) {
    console.error('✖ Failed to reach auth admin endpoint:', err.message || err);
    return { ok: false, reason: 'NETWORK_ERROR', error: err };
  }
}

async function checkRestPing() {
  if (!SUPABASE_URL) {
    return { ok: false, reason: 'NO_SUPABASE_URL' };
  }

  const url = SUPABASE_URL.replace(/\/+$/,'') + '/rest/v1/';

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SERVICE_ROLE_KEY || '',
      },
    });

    // Depending on Supabase config, this endpoint may return 404 if no route is matched,
    // but that's still indicative that the server is reachable. Treat 200/204/404 as reachable.
    if ([200, 204, 401, 403, 404].includes(res.status)) {
      console.log(`✔ REST endpoint reachable (HTTP ${res.status}).`);
      if (res.status === 401 || res.status === 403) {
        console.warn('⚠ REST endpoint responded with auth error (401/403). You may need to use a proper key or check RLS settings.');
      }
      return { ok: true, status: res.status };
    }

    console.warn(`⚠ REST endpoint responded with HTTP ${res.status}.`);
    const body = await res.text();
    console.warn(body);
    return { ok: false, reason: 'UNEXPECTED_STATUS', status: res.status, body };
  } catch (err) {
    console.error('✖ Failed to reach REST endpoint:', err.message || err);
    return { ok: false, reason: 'NETWORK_ERROR', error: err };
  }
}

async function runChecks() {
  console.log('Supabase Connection Check-------------------------');
  console.log(`SUPABASE_URL: ${SUPABASE_URL || '(not set)'}`);

  const authResult = await checkAuthAdmin();
  const restResult = await checkRestPing();

  console.log('Summary:');
  if (authResult.ok) {
    console.log('✔ Auth admin check: OK');
  } else {
    console.log('✖ Auth admin check: FAILED', authResult.reason || '');
  }

  if (restResult.ok) {
    console.log('✔ REST ping check: OK');
  } else {
    console.log('✖ REST ping check: FAILED', restResult.reason || '');
  }

  if (authResult.ok && restResult.ok) {
    console.log('🎉 SUPABASE CONNECTION OK - both auth and REST endpoints reachable.');
    process.exit(0);
  }

  console.log('Next steps / Troubleshooting:');
  console.log('- Ensure SUPABASE_URL is correct (looks like https://<project>.supabase.co)');
  console.log('- Ensure SUPABASE_SERVICE_ROLE_KEY is copied correctly from Supabase Dashboard (Project -> Settings -> API -> Service role key)');
  console.log('- If you are behind a corporate proxy, ensure node can reach external URLs');
  console.log('- If auth admin returns 401/403, the service role key is invalid or revoked');
  console.log('- If REST returns 401/403, check Row Level Security and API key permissions');
  process.exit(2);
}

// Execute checks
runChecks();
