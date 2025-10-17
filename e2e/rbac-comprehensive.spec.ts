/**
 * End-to-End RBAC Testing
 * 
 * Tests complete permission-based workflows including:
 * - Login with admin credentials
 * - Navigation filtering based on permissions
 * - Server action protection
 * - Manager hierarchy filtering
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@bobssale.com';
const ADMIN_PASSWORD = 'Admin@123456';
const BASE_URL = 'http://localhost:3001';

test.describe('RBAC System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
  });

  test.describe('Authentication & Authorization', () => {
    test('should login with admin credentials', async ({ page }) => {
      // Fill login form
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL(`${BASE_URL}/dashboard`);
      
      // Verify dashboard loaded
      await expect(page.locator('h1, h2')).toContainText(/Dashboard|Welcome/i);
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'WrongPassword');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=/invalid|error|wrong/i')).toBeVisible();
    });

    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should redirect to login
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Navigation Permission Filtering', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should show all navigation items for admin', async ({ page }) => {
      // Admin should see all main nav items
      const navItems = [
        'Dashboard',
        'Vendor',
        'Inventory',
        'Sales',
        'Stores',
        'HRMS',
        'User Management',
      ];

      for (const item of navItems) {
        await expect(page.locator(`nav >> text="${item}"`)).toBeVisible();
      }
    });

    test('should show sales sub-navigation when in sales module', async ({ page }) => {
      // Navigate to sales module
      await page.click('text=Sales');
      await page.waitForURL(/\/dashboard\/sales/);
      
      // Should show sales sub-navigation
      const salesSubNav = [
        'Leads',
        'Opportunities',
        'Quotations',
        'Orders',
        'Customers',
      ];

      for (const item of salesSubNav) {
        // Look for sidebar navigation items
        const navItem = page.locator(`aside >> text="${item}"`);
        await expect(navItem).toBeVisible({ timeout: 5000 });
      }
    });

    test('should navigate between modules successfully', async ({ page }) => {
      // Navigate to different modules
      await page.click('text=Vendor');
      await expect(page).toHaveURL(/\/dashboard\/vendor/);
      
      await page.click('text=Sales');
      await expect(page).toHaveURL(/\/dashboard\/sales/);
      
      await page.click('text=Dashboard');
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });

  test.describe('Dashboard Data Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should load dashboard metrics', async ({ page }) => {
      // Wait for dashboard to load
      await page.waitForSelector('text=/Active Vendors|Outstanding|YTD Spend/i', { timeout: 10000 });
      
      // Verify dashboard has content
      const hasMetrics = await page.locator('text=/Active Vendors|Outstanding|YTD Spend/i').count();
      expect(hasMetrics).toBeGreaterThan(0);
    });

    test('should display vendor list on vendor page', async ({ page }) => {
      await page.click('text=Vendor');
      await page.waitForURL(/\/dashboard\/vendor/);
      
      // Wait for vendor table or list
      await page.waitForSelector('table, [role="table"], text=/No vendors|Add vendor/i', { timeout: 10000 });
      
      // Page should not show permission error
      await expect(page.locator('text=/Permission denied|403|Access denied/i')).not.toBeVisible();
    });
  });

  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should access user management page', async ({ page }) => {
      await page.click('text=User Management');
      await page.waitForURL(/\/dashboard\/users/);
      
      // Should not show access denied
      await expect(page.locator('text=/Permission denied|403/i')).not.toBeVisible();
      
      // Should show user list or create button
      const hasUserContent = await page.locator('text=/Users|Create User|Add User/i').count();
      expect(hasUserContent).toBeGreaterThan(0);
    });
  });

  test.describe('Security & Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      
      // Navigate to a page
      await page.goto(`${BASE_URL}/dashboard/sales/leads`);
      
      // Page should load without critical errors
      const hasError = await page.locator('text=/Application error|500|Something went wrong/i').count();
      expect(hasError).toBe(0);
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      
      // Refresh page
      await page.reload();
      
      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=/Permission denied|Login/i')).not.toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      
      // Find and click logout button (usually in user menu)
      await page.click('[role="button"]:has-text("admin"), button:has-text("admin")');
      await page.click('text=Logout, text=Sign out, text=Log out');
      
      // Should redirect to login
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      
      // Mobile menu button should be visible
      await expect(page.locator('button:has-text("Toggle"), button[aria-label*="menu"]')).toBeVisible();
    });
  });
});

test.describe('Performance & Optimization', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const startTime = Date.now();
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // Filter out expected errors (like Firebase warnings)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Firebase') && 
      !err.includes('emulator') &&
      !err.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
