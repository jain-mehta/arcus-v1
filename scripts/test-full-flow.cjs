#!/usr/bin/env node
/**
 * Full login flow test
 * Tests: Login → Dashboard access
 */

const http = require('http');

// Test data
const testCases = [
  {
    name: 'Admin Login',
    email: 'admin@arcus.com',
    password: 'Admin@123456',
  },
];

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseData,
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Full Login Flow');
  
  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Email: ${testCase.email}`);
    console.log(`   Password: ${testCase.password}`);
    
    try {
      // Step 1: Login
      console.log('   Step 1: POST /api/auth/login');
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        email: testCase.email,
        password: testCase.password,
      });
      
      console.log(`   ✓ Status: ${loginRes.status}`);
      
      if (loginRes.status !== 200) {
        console.log(`   ✗ FAILED - Expected 200, got ${loginRes.status}`);
        console.log(`   Response: ${loginRes.body}`);
        continue;
      }
      
      let loginData;
      try {
        loginData = JSON.parse(loginRes.body);
        console.log(`   ✓ User: ${loginData.user?.email}`);
        console.log(`   ✓ User ID: ${loginData.user?.id}`);
      } catch (e) {
        console.log(`   ✗ Failed to parse response: ${loginRes.body}`);
        continue;
      }

      // Extract cookies from Set-Cookie header
      const setCookieHeaders = loginRes.headers['set-cookie'];
      console.log(`   ✓ Cookies set: ${setCookieHeaders ? setCookieHeaders.length : 0}`);
      
      if (!setCookieHeaders) {
        console.log(`   ✗ FAILED - No cookies set in response`);
        continue;
      }

      // Extract access token from cookies
      const accessTokenCookie = setCookieHeaders.find(c => c.includes('__supabase_access_token'));
      if (!accessTokenCookie) {
        console.log(`   ✗ FAILED - No access token cookie`);
        continue;
      }

      // Parse cookie
      const cookieMatch = accessTokenCookie.match(/^([^=]+)=([^;]+)/);
      const cookieName = cookieMatch?.[1];
      const cookieValue = cookieMatch?.[2];
      
      console.log(`   ✓ Access token cookie: ${cookieName}`);
      console.log(`   ✓ Token length: ${cookieValue?.length || 0} chars`);

      // Step 2: Access dashboard (simulating authenticated request)
      console.log(`   Step 2: GET /dashboard`);
      const dashboardRes = await makeRequest('GET', '/dashboard');
      
      console.log(`   ✓ Status: ${dashboardRes.status}`);
      
      if (dashboardRes.status === 200) {
        console.log(`   ✓ Dashboard accessible!`);
        console.log(`   ✅ FULL LOGIN FLOW SUCCESSFUL`);
      } else if (dashboardRes.status === 401) {
        console.log(`   ✗ Unauthorized - Session not maintained`);
        if (dashboardRes.body.includes('Permission denied')) {
          console.log(`   Issue: Permission check failed`);
        }
      } else {
        console.log(`   ✗ Unexpected status: ${dashboardRes.status}`);
        if (dashboardRes.body.includes('Permission denied')) {
          console.log(`   Issue: ${dashboardRes.body.substring(0, 200)}`);
        }
      }
      
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
  }
  
  console.log('✅ Tests completed');
}

// Run tests
runTests().catch(console.error);
