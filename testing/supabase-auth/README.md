/**
 * Supabase Auth Testing - README
 * 
 * Comprehensive test suite for Supabase authentication including:
 * - Unit tests (session management, auth module validation)
 * - Integration tests (API endpoints, complete auth flows)
 * - Edge case coverage
 * 
 * Directory Structure:
 * /testing/supabase-auth/
 *   ├── unit/                          # Unit tests
 *   │   ├── session.test.ts           # JWT token handling, validation
 *   │   └── auth-module.test.ts       # Email/password validation, edge cases
 *   ├── integration/                   # Integration tests
 *   │   └── auth-api.test.ts          # API endpoints (signup, login, logout)
 *   ├── run-tests.mjs                 # Test runner script
 *   └── README.md                     # This file
 * 
 * Test Coverage:
 * 
 * UNIT TESTS (session.test.ts)
 * ────────────────────────────
 * ✓ JWT token decoding
 * ✓ Token expiration validation
 * ✓ Claims extraction
 * ✓ Authorization header parsing
 * ✓ Edge cases: malformed tokens, special characters, very long tokens
 * 
 * UNIT TESTS (auth-module.test.ts)
 * ────────────────────────────────
 * ✓ Email format validation
 * ✓ Password requirements (min 6 chars)
 * ✓ UUID format validation
 * ✓ Session expiration calculations
 * ✓ Concurrent session handling
 * ✓ Error state handling
 * ✓ Edge cases: very long emails, special characters in passwords
 * 
 * INTEGRATION TESTS (auth-api.test.ts)
 * ────────────────────────────────────
 * ✓ User signup flow
 * ✓ User login flow
 * ✓ User logout flow
 * ✓ Session management
 * ✓ Cookie handling
 * ✓ Rate limiting
 * ✓ Error handling and recovery
 * ✓ Edge cases:
 *   - Invalid email formats
 *   - Short passwords
 *   - Missing fields
 *   - Duplicate emails
 *   - Case sensitivity
 *   - Concurrent requests
 *   - Login/logout cycles
 * 
 * Running Tests:
 * 
 * Run all tests:
 *   npm run test
 *   npm run test testing/supabase-auth
 * 
 * Run only unit tests:
 *   npm run test testing/supabase-auth/unit
 * 
 * Run only integration tests:
 *   npm run test testing/supabase-auth/integration
 * 
 * Run with coverage:
 *   npm run test:coverage testing/supabase-auth
 * 
 * Run via test runner:
 *   node testing/supabase-auth/run-tests.mjs
 *   node testing/supabase-auth/run-tests.mjs --unit
 *   node testing/supabase-auth/run-tests.mjs --integration
 *   node testing/supabase-auth/run-tests.mjs --coverage
 * 
 * Test Results Interpretation:
 * 
 * ✅ PASSED: All test cases in the scenario passed
 * ❌ FAILED: One or more test cases failed
 *   - Check console output for failure details
 *   - Run individual test file for focused debugging
 * ⏭️  SKIPPED: Test was skipped (usually due to .skip or .todo)
 * 
 * Common Issues & Solutions:
 * 
 * Issue: \"Cannot find module '@/lib/supabase/session'\"
 * Solution: Make sure TypeScript path aliases are configured in tsconfig.json
 * 
 * Issue: \"SUPABASE_URL is not defined\"
 * Solution: Ensure .env.local has SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * 
 * Issue: \"Integration tests timeout\"
 * Solution: Increase test timeout or check if API server is running (npm run dev)
 * 
 * Issue: \"Rate limiting errors in test\"
 * Solution: This is expected - tests verify rate limiting works. If too frequent,
 *           wait before re-running or run unit tests only.
 * 
 * Expected Test Performance:
 * 
 * Unit Tests: ~1-2 seconds
 * - Fast execution
 * - No external dependencies
 * - Runs offline
 * 
 * Integration Tests: ~10-30 seconds
 * - Requires API server running
 * - Makes actual HTTP requests
 * - Slower but more comprehensive
 * 
 * Total Runtime: ~15-35 seconds (all tests)
 * 
 * Test Environment:
 * 
 * Framework: Vitest (Node.js test runner)
 * Language: TypeScript
 * API Base: http://localhost:3000 (development)
 * Database: Supabase (live against actual auth)
 * 
 * Notes:
 * 
 * - Integration tests create real test users in Supabase
 * - Test users have format: test-{timestamp}@example.com
 * - Tests clean up after themselves where possible
 * - Rate limiting is intentionally tested - expect 429 errors
 * - Tests are idempotent and can be run multiple times
 */
