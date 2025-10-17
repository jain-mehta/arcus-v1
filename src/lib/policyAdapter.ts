import LRU from 'lru-cache';
import { checkPermify } from './permifyClient';

export type PolicyCheck = {
  principal: string;
  action: string;
  resource: string;
  context?: Record<string, any>;
};

const cache = new LRU({ max: 1000, ttl: 1000 * 60 });

// permify client wrapper is in src/lib/permifyClient.ts

export async function evaluatePolicy(check: PolicyCheck): Promise<boolean> {
  if (!check || !check.principal) return false;
  const key = `${check.principal}:${check.action}:${check.resource}`;
  const cached = cache.get(key);
  if (typeof cached === 'boolean') return cached;

  try {
    const engine = process.env.POLICY_ENGINE || 'mock';
    if (engine === 'permify') {
      const allow = await checkPermify({
        principal: check.principal,
        action: check.action,
        resource: check.resource,
        context: check.context || {},
      });
      cache.set(key, allow);
      return allow;
    }
    if (engine === 'mock') {
      // simple mock rule: allow GETs, allow principals starting with `test-`
      const allow = check.action === 'GET' || check.principal?.startsWith?.('test-');
      cache.set(key, !!allow);
      return !!allow;
    }
  } catch (err: any) {
    // fallthrough to default
    const msg = err && err.message ? err.message : String(err);
    console.warn('Policy engine call failed (Permify)', msg);
  }

  // Fallback simple rules for PoC
  if (check.action === 'GET') return true;
  if (check.principal === 'admin') return true;
  cache.set(key, false);
  return false;
}

export default { evaluatePolicy };

export function invalidateCache(key?: string) {
  if (!key) return cache.clear();
  cache.delete(key);
}
