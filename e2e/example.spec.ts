import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/dashboard');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Firebase Command Center/);
});

test('dashboard page has a title', async ({ page }) => {
    await page.goto('/dashboard');

    // Expect the h1 to contain "Admin Dashboard"
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
});

test('can navigate to user management', async ({ page }) => {
    await page.goto('/dashboard');
        const userLink = page.getByRole('link', { name: 'User Management' }).first();
        await userLink.scrollIntoViewIfNeeded();
        await Promise.all([
            page.waitForURL(/.*users/, { timeout: 15000 }),
            userLink.click(),
        ]);
    await expect(page.locator('h1')).toContainText('User Management');
});

test('can navigate to roles and hierarchy', async ({ page }) => {
    await page.goto('/dashboard/users');
        const rolesLink = page.getByRole('link', { name: 'Roles & Hierarchy' }).first();
        await rolesLink.scrollIntoViewIfNeeded();
        await Promise.all([
            page.waitForURL(/.*users\/roles/, { timeout: 15000 }),
            rolesLink.click(),
        ]);
    await expect(page.locator('h1')).toContainText('Manage Roles & Hierarchy');
});
// Playwright provides `test` and `expect` as globals via the test runner.
// Omit explicit imports to prevent duplicate identifier issues with the project's TypeScript setup.
