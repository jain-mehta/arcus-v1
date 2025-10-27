import axios from 'axios';
import { getControlRepo } from './controlDataSource';
import { PolicySyncLog } from '../entities/control/policy-sync-log.entity';

export type PermifyCheckRequest = {
  principal: string;
  action: string;
  resource: string;
  context?: Record<string, any>;
  tenant_id?: string;
};

export type PermifyCheckResponse = {
  allow: boolean;
  reason?: string;
};

export type PermifyRelation = {
  entity: {
    type: string;
    id: string;
  };
  relation: string;
  subject: {
    type: string;
    id: string;
  };
};

/**
 * Policy engine check - verify user permission for action on resource
 * Returns true if allowed, false if denied
 * Logs result to PolicySyncLog for audit trail
 */
export async function checkPermify(req: PermifyCheckRequest): Promise<boolean> {
  const startTime = Date.now();
  const url = process.env.PERMIFY_URL;
  const apiKey = process.env.PERMIFY_API_KEY;
  const tenantId = req.tenant_id || process.env.TENANT_ID || 'default';

  // Mock mode for local dev (when Permify not available)
  if (process.env.POLICY_ENGINE === 'mock') {
    console.log(`[MOCK] ${req.principal} can ${req.action} ${req.resource}`);
    return true;
  }

  if (!url || !apiKey) {
    console.error('Permify not configured (PERMIFY_URL or PERMIFY_API_KEY missing)');
    // Fail closed: deny if policy engine is misconfigured
    return false;
  }

  try {
    const response = await axios.post(
      `${url}/v1/check`,
      {
        entity: {
          type: req.resource.split(':')[0] || 'resource',
          id: req.resource.split(':')[1] || '*',
        },
        subject: {
          type: 'user',
          id: req.principal,
        },
        action: req.action,
        context: req.context,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 5000,
      }
    );

    const allowed = response.data?.allow === true;
    const durationMs = Date.now() - startTime;

    // Log to PolicySyncLog for audit trail
    try {
      const syncLogRepo = await getControlRepo(PolicySyncLog);
      if (syncLogRepo) {
        await syncLogRepo.insert({
          tenant_id: tenantId,
          sync_status: allowed ? 'success' : 'denied',
          payload: JSON.stringify(req),
          response: JSON.stringify(response.data),
          duration_ms: durationMs,
          triggered_by: req.principal,
          sync_type: 'check',
        } as any);
      }
    } catch (logError) {
      console.warn('Failed to log policy check:', logError);
    }

    return allowed;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;

    // Log error to PolicySyncLog
    try {
      const syncLogRepo = await getControlRepo(PolicySyncLog);
      if (syncLogRepo) {
        await syncLogRepo.insert({
          tenant_id: tenantId,
          sync_status: 'error',
          payload: JSON.stringify(req),
          response: null,
          error_message: err?.message || String(err),
          http_status_code: err?.response?.status || 500,
          duration_ms: durationMs,
          triggered_by: req.principal,
          sync_type: 'check',
        } as any);
      }
    } catch (logError) {
      console.warn('Failed to log policy error:', logError);
    }

    console.error('Permify check failed:', err?.message);
    // Fail closed: deny on error
    return false;
  }
}

/**
 * Sync schema and roles to Permify
 * Call this when role definitions change or during deployment
 */
export async function schemaSync(tenantId: string, schema: string): Promise<boolean> {
  const startTime = Date.now();
  const url = process.env.PERMIFY_URL;
  const apiKey = process.env.PERMIFY_API_KEY;

  if (process.env.POLICY_ENGINE === 'mock') {
    console.log(`[MOCK] Synced schema for tenant ${tenantId}`);
    return true;
  }

  if (!url || !apiKey) {
    console.error('Permify not configured');
    return false;
  }

  try {
    const response = await axios.post(
      `${url}/v1/schemas`,
      {
        schema,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'text/plain' },
        timeout: 10000,
      }
    );

    const durationMs = Date.now() - startTime;

    // Log successful sync
    try {
      const syncLogRepo = await getControlRepo(PolicySyncLog);
      if (syncLogRepo) {
        await syncLogRepo.insert({
          tenant_id: tenantId,
          sync_status: 'success',
          payload: schema.substring(0, 500), // Log first 500 chars
          response: JSON.stringify(response.data),
          duration_ms: durationMs,
          sync_type: 'schema_sync',
        } as any);
      }
    } catch (logError) {
      console.warn('Failed to log schema sync:', logError);
    }

    console.log(`? Synced schema for tenant ${tenantId}`);
    return true;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;

    // Log sync error
    try {
      const syncLogRepo = await getControlRepo(PolicySyncLog);
      if (syncLogRepo) {
        await syncLogRepo.insert({
          tenant_id: tenantId,
          sync_status: 'error',
          payload: schema.substring(0, 500),
          response: null,
          error_message: err?.message || String(err),
          http_status_code: err?.response?.status || 500,
          duration_ms: durationMs,
          sync_type: 'schema_sync',
        } as any);
      }
    } catch (logError) {
      console.warn('Failed to log schema sync error:', logError);
    }

    console.error('Permify schema sync failed:', err?.message);
    return false;
  }
}

/**
 * Create a relation between entities in Permify
 * E.g., assign user to organization with 'member' relation
 */
export async function createRelation(
  tenantId: string,
  relation: PermifyRelation
): Promise<boolean> {
  const url = process.env.PERMIFY_URL;
  const apiKey = process.env.PERMIFY_API_KEY;

  if (process.env.POLICY_ENGINE === 'mock') {
    console.log(
      `[MOCK] Created relation: ${relation.entity.type}:${relation.entity.id} ${relation.relation} ${relation.subject.type}:${relation.subject.id}`
    );
    return true;
  }

  if (!url || !apiKey) {
    console.error('Permify not configured');
    return false;
  }

  try {
    await axios.post(
      `${url}/v1/relations`,
      relation,
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 5000,
      }
    );

    return true;
  } catch (err: any) {
    console.error('Failed to create relation:', err?.message);
    return false;
  }
}

/**
 * Health check - verify Permify is accessible
 */
export async function healthCheck(): Promise<boolean> {
  if (process.env.POLICY_ENGINE === 'mock') {
    return true;
  }

  const url = process.env.PERMIFY_URL;
  if (!url) return false;

  try {
    const response = await axios.get(`${url}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (err) {
    console.error('Permify health check failed:', err);
    return false;
  }
}

