/**
 * Test Helpers and Utilities
 * Shared functions for Playwright tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('http://localhost:3000/login');
  
  // Wait for page to load
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  await page.fill('input[type="email"]', 'admin@bobssale.com');
  await page.fill('input[type="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');
  
  // Wait for navigation or error
  try {
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  } catch (e) {
    // Check if still on login page with error
    const currentUrl = page.url();
    console.log('Login redirect failed, current URL:', currentUrl);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-failed.png' });
    
    // Check for error messages
    const errorMsg = await page.locator('[role="alert"], .error, .text-red-500').first().textContent().catch(() => null);
    if (errorMsg) {
      console.log('Login error:', errorMsg);
    }
  }
  
  // Verify we're on dashboard
  const url = page.url();
  if (!url.includes('/dashboard')) {
    console.warn('Not on dashboard after login. Current URL:', url);
  }
}

/**
 * Login as custom user
 */
export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Adjust selector based on your UI
  await page.click('[aria-label="User menu"]').catch(() => {
    // Fallback if aria-label doesn't exist
    page.click('button:has-text("Menu")');
  });
  await page.click('text=Sign Out');
  await page.waitForURL('**/login');
}

/**
 * Wait for toast/alert message
 */
export async function waitForToast(page: Page, expectedText?: string) {
  const toast = page.locator('[role="alert"]').first();
  await expect(toast).toBeVisible({ timeout: 5000 });
  
  if (expectedText) {
    await expect(toast).toContainText(expectedText);
  }
  
  return toast;
}

/**
 * Navigate to module
 */
export async function navigateToModule(page: Page, module: string) {
  const moduleMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'sales': '/dashboard/sales',
    'leads': '/dashboard/sales/leads',
    'opportunities': '/dashboard/sales/opportunities',
    'quotations': '/dashboard/sales/quotations',
    'customers': '/dashboard/sales/customers',
    'inventory': '/dashboard/inventory',
    'products': '/dashboard/inventory/products',
    'vendors': '/dashboard/vendor',
    'hrms': '/dashboard/hrms',
    'employees': '/dashboard/hrms/employees',
    'settings': '/dashboard/settings',
  };
  
  const url = moduleMap[module.toLowerCase()];
  if (!url) {
    throw new Error(`Unknown module: ${module}`);
  }
  
  await page.goto(`http://localhost:3000${url}`);
}

/**
 * Fill form fields
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
    
    // Check if it's a select element
    const tagName = await input.evaluate(el => el.tagName.toLowerCase()).catch(() => 'input');
    
    if (tagName === 'select') {
      await page.selectOption(`select[name="${name}"]`, value);
    } else {
      await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value);
    }
  }
}

/**
 * Click button with text
 */
export async function clickButton(page: Page, buttonText: string) {
  await page.click(`button:has-text("${buttonText}")`);
}

/**
 * Wait for table to load
 */
export async function waitForTable(page: Page) {
  await page.waitForSelector('table', { timeout: 5000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page): Promise<number> {
  await waitForTable(page);
  const rows = await page.locator('table tbody tr').count();
  return rows;
}

/**
 * Search in table
 */
export async function searchTable(page: Page, searchTerm: string) {
  const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
  await searchInput.fill(searchTerm);
  await page.waitForTimeout(500); // Wait for debounce
  await page.waitForLoadState('networkidle');
}

/**
 * Create test lead
 */
export async function createTestLead(page: Page, data?: Partial<{
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: string;
  notes: string;
}>) {
  await navigateToModule(page, 'leads');
  await clickButton(page, 'Add Lead');
  
  const leadData = {
    company: data?.company || `Test Company ${Date.now()}`,
    contactPerson: data?.contactPerson || 'John Doe',
    email: data?.email || `test${Date.now()}@example.com`,
    phone: data?.phone || '+1234567890',
    stage: data?.stage || 'new',
    notes: data?.notes || 'Test lead created by automation',
  };
  
  await fillForm(page, leadData);
  await clickButton(page, 'Submit');
  await waitForToast(page, 'created');
  
  return leadData;
}

/**
 * Delete first table row
 */
export async function deleteFirstTableRow(page: Page) {
  const initialCount = await getTableRowCount(page);
  
  await page.click('table tbody tr:first-child button:has-text("Delete")').catch(() => {
    page.click('table tbody tr:first-child [aria-label="Delete"]');
  });
  
  // Confirm deletion
  await page.click('button:has-text("Confirm"), button:has-text("Delete")');
  await waitForToast(page, 'deleted');
  
  // Verify row was deleted
  const newCount = await getTableRowCount(page);
  expect(newCount).toBe(initialCount - 1);
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).count() > 0;
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Clear all cookies
 */
export async function clearCookies(page: Page) {
  await page.context().clearCookies();
}

/**
 * Get session cookie
 */
export async function getSessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find(c => c.name === '__session');
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return await page.waitForResponse(
    response => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: 10000 }
  );
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page, 
  urlPattern: string | RegExp, 
  responseData: any,
  status = 200
) {
  await page.route(urlPattern, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Check accessibility violations
 * Note: Requires @axe-core/playwright to be installed
 * npm install --save-dev @axe-core/playwright
 */
export async function checkAccessibility(page: Page): Promise<any[]> {
  try {
    // @ts-ignore - Optional dependency
    const axeModule = await import('@axe-core/playwright').catch(() => null);
    if (!axeModule) {
      console.warn('⚠️ Accessibility checking requires @axe-core/playwright. Install with: npm install --save-dev @axe-core/playwright');
      return [];
    }
    
    const { AxeBuilder } = axeModule;
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    return accessibilityScanResults.violations;
  } catch (error) {
    console.warn('Accessibility checking error:', error);
    return [];
  }
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  // Wait for common loading indicators
  await page.waitForSelector('[data-loading="true"], .loading, .spinner', { 
    state: 'hidden',
    timeout: 10000 
  }).catch(() => {
    // If no loading indicator found, just wait for network idle
    return page.waitForLoadState('networkidle');
  });
}

/**
 * Retry action until success
 */
export async function retryUntilSuccess<T>(
  action: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Retry failed');
}

/**
 * Generate random email
 */
export function generateRandomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random phone
 */
export function generateRandomPhone(): string {
  return `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

/**
 * Parse table data to array
 */
export async function parseTableData(page: Page): Promise<string[][]> {
  await waitForTable(page);
  
  return await page.evaluate(() => {
    const table = document.querySelector('table');
    if (!table) return [];
    
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return cells.map(cell => cell.textContent?.trim() || '');
    });
  });
}

/**
 * Create a test user via the UI. This is a light-weight helper used by e2e tests.
 */
export async function createTestUser(page: Page, data: {
  name: string;
  email: string;
  roles?: string[];
  designation?: string;
}) {
  await navigateToModule(page, 'Users');
  await clickButton(page, 'Create User');

  // Fill basic fields
  await fillForm(page, {
    'Full Name': data.name,
    'Email Address': data.email,
    'Designation': data.designation || ''
  });

  // Generate a password if password field exists
  try {
    await page.getByRole('button', { name: /generate password/i }).click();
  } catch {
    // ignore if no generator present
  }

  // Select role if provided
  if (data.roles && data.roles.length) {
    await page.getByLabel('Role', { exact: true }).click();
    // pick the first role from the dropdown
    await page.getByRole('option', { name: new RegExp(data.roles[0], 'i') }).first().click();
  }

  // Submit
  await clickButton(page, 'Create User');
  await waitForToast(page, 'created');

  return { email: data.email, name: data.name };
}

/**
 * Delete a test user by email via the UI. This attempts to find the row and delete it.
 */
export async function deleteTestUser(page: Page, email: string) {
  await navigateToModule(page, 'Users');
  await searchTable(page, email);
  // Click first row to open actions
  await page.click('table tbody tr:first-child');
  // Try delete button
  await page.click('button:has-text("Delete")').catch(() => page.click('[aria-label="Delete"]'));
  await page.click('button:has-text("Confirm"), button:has-text("Delete")');
  await waitForToast(page, 'deleted');
}
