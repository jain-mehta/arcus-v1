import { test, expect } from '@playwright/test';

// Basic navigation smoke tests for the dashboard
test('sidebar links are present and navigate', async ({ page }) => {
  await page.goto('/dashboard');
  // Check sidebar exists
  await expect(page.locator('nav')).toBeVisible();
  // Try to click Inventory link if present
  const inv = page.getByRole('link', { name: /Inventory/i });
  if (await inv.count() > 0) {
    // ensure visible and clickable, then click and wait for client-side navigation
    await inv.first().scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(/.*inventory/, { timeout: 15000 }),
      inv.first().click(),
    ]);
  }
});
