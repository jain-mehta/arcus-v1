import { test, expect } from '@playwright/test';

test('create user via UI', async ({ page }) => {
  // Adjust base URL if needed
  await page.goto('http://localhost:3000/dashboard/users');

  // Click Create User button
  await page.getByRole('button', { name: /Create User/i }).click();

  // Fill the form
  await page.getByLabel('Full Name').fill('E2E Test User');
  await page.getByLabel('Email').fill(`e2e.user+${Date.now()}@example.com`);

  // Select first role if available
  const roleSelect = await page.locator('text=Roles').first();
  // If there are roles, pick the first checkbox in the MultiSelect
  // This is a best-effort smoke test — the UI may differ.

  await page.getByRole('button', { name: /Create User/i }).nth(1).click();

  // Wait for toast
  await page.waitForTimeout(800);
  const toast = await page.locator('text=User Created').first();
  await expect(toast).toBeVisible();
});
