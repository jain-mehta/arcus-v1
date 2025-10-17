import { evaluatePolicy, invalidateCache } from '../src/lib/policyAdapter.js';

async function run() {
  console.log('POLICY_ENGINE=', process.env.POLICY_ENGINE || 'mock');
  const check = {
    principal: process.env.TEST_PRINCIPAL || 'test-user-1',
    action: 'GET',
    resource: '/api/example',
  };

  const allow = await evaluatePolicy(check);
  console.log('Policy decision for', check.principal, allow ? 'ALLOW' : 'DENY');

  // Invalidate and retry to demonstrate cache behavior
  invalidateCache();
  const allow2 = await evaluatePolicy(check);
  console.log('After invalidate, decision', allow2 ? 'ALLOW' : 'DENY');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
