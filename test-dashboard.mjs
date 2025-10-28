#!/usr/bin/env node

/**
 * Test script to verify login and dashboard permission visibility
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testPermissionFlow() {
  try {
    console.log('=== Testing Permission Visibility Flow ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in as admin@arcus.local...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@arcus.local',
        password: 'password123'
      })
    });

    if (!loginRes.ok) {
      console.error('Login failed:', loginRes.status, await loginRes.text());
      return;
    }

    // Get the session cookie
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('✓ Login successful');
    console.log('  Cookie:', setCookie ? setCookie.substring(0, 50) + '...' : 'Not set');

    // Step 2: Access dashboard with the session cookie
    console.log('\nStep 2: Accessing /dashboard with session cookie...');
    const dashboardRes = await fetch(`${BASE_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': setCookie || ''
      }
    });

    if (!dashboardRes.ok) {
      console.error('Dashboard access failed:', dashboardRes.status);
      const text = await dashboardRes.text();
      console.log('Response:', text.substring(0, 200));
      return;
    }

    const html = await dashboardRes.text();
    console.log('✓ Dashboard loaded successfully');

    // Step 3: Check if navigation items are in the HTML
    console.log('\nStep 3: Checking for navigation items in HTML...');
    const navItems = [
      'Dashboard',
      'Vendor',
      'Inventory',
      'Sales',
      'Stores',
      'HRMS',
      'User Management'
    ];

    let foundCount = 0;
    navItems.forEach(item => {
      if (html.includes(item)) {
        console.log(`  ✓ Found: ${item}`);
        foundCount++;
      } else {
        console.log(`  ✗ Missing: ${item}`);
      }
    });

    console.log(`\n✓ Navigation Test: ${foundCount}/${navItems.length} items found`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testPermissionFlow();
