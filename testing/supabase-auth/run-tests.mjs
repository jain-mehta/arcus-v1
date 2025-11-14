#!/usr/bin/env node

/**
 * Supabase Auth Test Runner
 * 
 * Runs comprehensive test suites for Supabase authentication:
 * - Unit tests for session management (JWT decoding, token validation)
 * - Unit tests for auth module (email/password validation, error handling)
 * - Integration tests for API routes (signup, login, logout, session management)
 * 
 * Usage:
 *   node testing/supabase-auth/run-tests.mjs
 *   node testing/supabase-auth/run-tests.mjs --unit
 *   node testing/supabase-auth/run-tests.mjs --integration
 *   node testing/supabase-auth/run-tests.mjs --coverage
 * 
 * Output:
 *   - Console output with pass/fail counts
 *   - Exit code 0 = all tests passed, 1 = tests failed
 *   - Coverage report (if --coverage flag)
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../../');

const args = process.argv.slice(2);
const runUnit = !args.includes('--integration');
const runIntegration = !args.includes('--unit');
const coverage = args.includes('--coverage');

console.log('\━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🧪 Supabase Auth Test Suite');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\');

let allTestsPassed = true;
const testResults = {
  unit: null,
  integration: null,
};

// Run unit tests
if (runUnit) {
  console.log('📋 Running Unit Tests...');
  console.log('  - Session Management');
  console.log('  - Auth Module Validation');
  console.log('  - Error Handling\');

  try {
    const unitTestFiles = [
      'testing/supabase-auth/unit/session.test.ts',
      'testing/supabase-auth/unit/auth-module.test.ts',
    ];

    const vitstCommand = `npm run test -- ${unitTestFiles.join(' ')} ${coverage ? '--coverage' : ''}`;
    execSync(vitstCommand, { 
      cwd: rootDir,
      stdio: 'inherit',
    });

    testResults.unit = 'PASSED';
    console.log('✅ Unit tests passed\');
  } catch (error) {
    testResults.unit = 'FAILED';
    allTestsPassed = false;
    console.log('❌ Unit tests failed\');
  }
}

// Run integration tests
if (runIntegration) {
  console.log('📋 Running Integration Tests...');
  console.log('  - Signup Flow');
  console.log('  - Login Flow');
  console.log('  - Logout Flow');
  console.log('  - Session Management');
  console.log('  - Edge Cases\');

  try {
    const integrationTestFiles = [
      'testing/supabase-auth/integration/auth-api.test.ts',
    ];

    const vitstCommand = `npm run test -- ${integrationTestFiles.join(' ')} ${coverage ? '--coverage' : ''}`;
    execSync(vitstCommand, { 
      cwd: rootDir,
      stdio: 'inherit',
    });

    testResults.integration = 'PASSED';
    console.log('✅ Integration tests passed\');
  } catch (error) {
    testResults.integration = 'FAILED';
    allTestsPassed = false;
    console.log('❌ Integration tests failed\');
  }
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  📊 Test Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\');

if (testResults.unit) {
  const status = testResults.unit === 'PASSED' ? '✅' : '❌';
  console.log(`  ${status} Unit Tests: ${testResults.unit}`);
}

if (testResults.integration) {
  const status = testResults.integration === 'PASSED' ? '✅' : '❌';
  console.log(`  ${status} Integration Tests: ${testResults.integration}`);
}

console.log('\━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\');

if (allTestsPassed) {
  console.log('🎉 All tests passed!\');
  process.exit(0);
} else {
  console.log('💥 Some tests failed. See details above.\');
  process.exit(1);
}
