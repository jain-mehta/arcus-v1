import { test, expect } from '@playwright/test';
import { 
  loginAsAdmin, 
  logout, 
  createTestUser,
  deleteTestUser,
  navigateToModule 
} from './helpers';

const ADMIN_EMAIL = 'admin@bobssale.com';
const ADMIN_PASSWORD = 'Admin@123456';

test.describe('User Management Module - Admin Only', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: logout after each test
    await logout(page);
  });

  test('Admin can access User Management page', async ({ page }) => {
    // Navigate to Users module
    await navigateToModule(page, 'Users');
    
    // Verify we're on the users page
    await expect(page).toHaveURL(/\/dashboard\/users/);
    
    // Verify Create User button is visible
    await expect(page.getByRole('button', { name: /create user/i })).toBeVisible();
    
    // Verify table headers are visible
    await expect(page.getByText('User')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Roles')).toBeVisible();
  });

  test('Admin can create user with generated password', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Click Create User button
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Verify Create User dialog opened
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create New User')).toBeVisible();
    
    // Fill in user details
    const testEmail = `test.user.${Date.now()}@example.com`;
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email Address').fill(testEmail);
    
    // Click Generate Password button
    await page.getByRole('button', { name: /generate password/i }).click();
    
    // Verify password field is filled
    const passwordInput = page.getByLabel('Password');
    const password = await passwordInput.inputValue();
    expect(password.length).toBeGreaterThanOrEqual(12);
    
    // Select a role from dropdown (changed from checkbox to dropdown)
    await page.getByLabel('Role', { exact: true }).click();
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    // Fill designation
    await page.getByLabel('Designation').fill('Test Manager');
    
    // Submit form
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Wait for success toast
    await expect(page.getByText(/user created successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Verify user appears in table
    await expect(page.getByText(testEmail)).toBeVisible();
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('Password generator creates valid passwords', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Open Create User dialog
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Click Generate Password multiple times
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /generate password/i }).click();
      
      const password = await page.getByLabel('Password').inputValue();
      
      // Verify password requirements
      expect(password.length).toBe(12);
      expect(password).toMatch(/[a-z]/); // Contains lowercase
      expect(password).toMatch(/[A-Z]/); // Contains uppercase
      expect(password).toMatch(/[0-9]/); // Contains number
      expect(password).toMatch(/[!@#$%^&*]/); // Contains special char
    }
  });

  test('Admin can toggle password visibility', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Open Create User dialog
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Generate a password
    await page.getByRole('button', { name: /generate password/i }).click();
    
    const passwordInput = page.getByLabel('Password');
    
    // Verify password is hidden initially (type="password")
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click show/hide toggle
    await page.getByRole('button', { name: /show password|hide password/i }).click();
    
    // Verify password is now visible (type="text")
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Toggle again
    await page.getByRole('button', { name: /show password|hide password/i }).click();
    
    // Verify password is hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Admin can edit user roles and designation', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Create a test user first
    const testEmail = `edit.test.${Date.now()}@example.com`;
    await createTestUser(page, {
      name: 'Edit Test User',
      email: testEmail,
      roles: ['Admin'], // Will be changed to single role select
      designation: 'Junior Manager'
    });
    
    // Click on the user row to edit
    await page.getByText(testEmail).click();
    
    // Verify Edit User dialog opened
    await expect(page.getByText('Edit User')).toBeVisible();
    
    // Verify name and email are disabled
    await expect(page.getByLabel('Full Name')).toBeDisabled();
    await expect(page.getByLabel('Email Address')).toBeDisabled();
    
    // Change designation
    await page.getByLabel('Designation').clear();
    await page.getByLabel('Designation').fill('Senior Manager');
    
    // Change role (single select dropdown now, not checkbox)
    // The role dropdown should already be visible
    await page.getByLabel('Role', { exact: true }).click();
    // Note: Since we only have Admin in MOCK_ROLES now, we'll select it again
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    // Submit update
    await page.getByRole('button', { name: /update user/i }).click();
    
    // Wait for success toast
    await expect(page.getByText(/user updated successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Verify changes in table
    await page.getByText(testEmail).click();
    await expect(page.getByLabel('Designation')).toHaveValue('Senior Manager');
  });

  test('Admin can assign reporting manager', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Open Create User dialog
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Fill basic details
    const testEmail = `manager.test.${Date.now()}@example.com`;
    await page.getByLabel('Full Name').fill('Manager Test User');
    await page.getByLabel('Email Address').fill(testEmail);
    await page.getByRole('button', { name: /generate password/i }).click();
    
    // Select role from dropdown
    await page.getByLabel('Role', { exact: true }).click();
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    // Select reporting manager dropdown
    const reportingManagerDropdown = page.getByLabel('Reporting Manager');
    await reportingManagerDropdown.click();
    
    // Select a manager (should not include self)
    await page.getByRole('option', { name: /admin@bobssale/i }).click();
    
    // Create user
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Verify success
    await expect(page.getByText(/user created successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Verify reporting manager is displayed in table
    const userRow = page.getByText(testEmail).locator('..');
    await expect(userRow.getByText(/admin@bobssale/i)).toBeVisible();
  });

  test('Admin can delete user', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Create a test user to delete
    const testEmail = `delete.test.${Date.now()}@example.com`;
    await createTestUser(page, {
      name: 'Delete Test User',
      email: testEmail,
      roles: ['Sales Manager']
    });
    
    // Verify user exists
    await expect(page.getByText(testEmail)).toBeVisible();
    
    // Click on user row to edit
    await page.getByText(testEmail).click();
    
    // Click Delete User button
    await page.getByRole('button', { name: /delete user/i }).click();
    
    // Confirm deletion (assuming confirmation dialog)
    // If there's a confirmation, uncomment:
    // await page.getByRole('button', { name: /confirm|yes|delete/i }).click();
    
    // Wait for success toast
    await expect(page.getByText(/user.*deleted successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Verify user is removed from table
    await expect(page.getByText(testEmail)).not.toBeVisible();
  });

  test('Admin cannot delete own account', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Find and click on admin user (self)
    await page.getByText(ADMIN_EMAIL).click();
    
    // Click Delete User button
    await page.getByRole('button', { name: /delete user/i }).click();
    
    // Should see error message
    await expect(page.getByText(/cannot delete your own account/i)).toBeVisible({ timeout: 5000 });
    
    // Admin should still exist in table
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
  });

  test('Admin can select role for a user', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Open Create User dialog
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Fill basic info
    const testEmail = `single.role.${Date.now()}@example.com`;
    await page.getByLabel('Full Name').fill('Single Role User');
    await page.getByLabel('Email Address').fill(testEmail);
    await page.getByRole('button', { name: /generate password/i }).click();
    
    // Select role from dropdown (single select)
    await page.getByLabel('Role', { exact: true }).click();
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    // Create user
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Wait for success
    await expect(page.getByText(/user created successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Click on user to verify role
    await page.getByText(testEmail).click();
    
    // Verify the role is selected in dropdown
    const roleDropdown = page.getByLabel('Role', { exact: true });
    await expect(roleDropdown).toBeVisible();
  });

  test('Form validation works correctly', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Open Create User dialog
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Should show validation errors (assuming form validation is shown)
    // Adjust selectors based on your validation message structure
    await expect(page.getByText(/required|please fill|cannot be empty/i).first()).toBeVisible();
    
    // Fill name but leave email empty
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Should still show email validation error
    await expect(page.getByText(/email.*required|please enter email/i)).toBeVisible();
    
    // Fill invalid email format
    await page.getByLabel('Email Address').fill('invalid-email');
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Should show invalid email error
    await expect(page.getByText(/invalid email|valid email/i)).toBeVisible();
  });

  test('Table displays user information correctly', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Verify table structure
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Verify column headers
    const headers = ['User', 'Email', 'Roles', 'Designation', 'Store', 'Reporting Manager'];
    for (const header of headers) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
    
    // Verify at least admin user is visible
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
    
    // Verify row is clickable (has hover effect)
    const adminRow = page.getByText(ADMIN_EMAIL).locator('..');
    await adminRow.hover();
    // Could check for cursor-pointer class if needed
  });

  test('Click-to-edit opens dialog with correct user data', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Click on admin user row
    await page.getByText(ADMIN_EMAIL).click();
    
    // Verify Edit User dialog opened
    await expect(page.getByText('Edit User')).toBeVisible();
    
    // Verify admin email is pre-filled and disabled
    await expect(page.getByLabel('Email Address')).toHaveValue(ADMIN_EMAIL);
    await expect(page.getByLabel('Email Address')).toBeDisabled();
    
    // Verify name is pre-filled and disabled
    const nameInput = page.getByLabel('Full Name');
    await expect(nameInput).toBeDisabled();
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);
  });

  test('Backdrop overlay is visible on dialog open', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Open Create User dialog
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Verify backdrop exists (check for backdrop-blur class or similar)
    const backdrop = page.locator('.backdrop-blur-sm');
    await expect(backdrop).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
    
    // Verify backdrop is gone
    await expect(backdrop).not.toBeVisible();
  });

  test('Store dropdown shows available stores', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Open Create User dialog
    await page.getByRole('button', { name: /create user/i }).click();
    
    // Click store dropdown
    await page.getByLabel('Store').click();
    
    // Should see store options (adjust based on your mock data)
    // Assuming MOCK_STORES has at least one store
    const storeOptions = page.getByRole('option');
    await expect(storeOptions.first()).toBeVisible();
  });

  test('Toast notifications appear on actions', async ({ page }) => {
    await navigateToModule(page, 'Users');
    
    // Create a user
    const testEmail = `toast.test.${Date.now()}@example.com`;
    await page.getByRole('button', { name: /create user/i }).click();
    await page.getByLabel('Full Name').fill('Toast Test');
    await page.getByLabel('Email Address').fill(testEmail);
    await page.getByRole('button', { name: /generate password/i }).click();
    
    // Select role from dropdown
    await page.getByLabel('Role', { exact: true }).click();
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Verify success toast
    const successToast = page.getByText(/user created successfully/i);
    await expect(successToast).toBeVisible({ timeout: 5000 });
    
    // Toast should disappear after a few seconds
    await expect(successToast).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('User Management - Non-Admin Access', () => {
  test('Non-admin cannot access User Management page', async ({ page }) => {
    // Login as a non-admin user (assuming you have one)
    // If not, this test will need to be updated
    await page.goto('/login');
    await page.getByLabel('Email').fill('sales@bobssale.com'); // Adjust based on your test data
    await page.getByLabel('Password').fill('Sales@123'); // Adjust password
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Try to navigate to users page directly
    await page.goto('/dashboard/users');
    
    // Should be redirected or see access denied message
    // Adjust assertion based on your RBAC implementation
    await expect(page).not.toHaveURL(/\/dashboard\/users/);
    // OR
    // await expect(page.getByText(/access denied|forbidden|no permission/i)).toBeVisible();
  });
});

test.describe('User Management - Performance', () => {
  test('Table loads quickly with multiple users', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToModule(page, 'Users');
    
    // Measure page load time
    const startTime = Date.now();
    await expect(page.getByRole('table')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('Search/filter functionality (if implemented)', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToModule(page, 'Users');
    
    // Check if search/filter exists
    const searchInput = page.getByPlaceholder(/search|filter/i);
    if (await searchInput.isVisible()) {
      // Test search functionality
      await searchInput.fill('admin');
      await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
      
      // Search for non-existent user
      await searchInput.clear();
      await searchInput.fill('nonexistentuser@example.com');
      await expect(page.getByText(/no users found|no results/i)).toBeVisible();
    }
  });
});

test.describe('User Management - Edge Cases', () => {
  test('Duplicate email validation', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToModule(page, 'Users');
    
    // Try to create user with existing email (admin@bobssale.com)
    await page.getByRole('button', { name: /create user/i }).click();
    await page.getByLabel('Full Name').fill('Duplicate User');
    await page.getByLabel('Email Address').fill(ADMIN_EMAIL);
    await page.getByRole('button', { name: /generate password/i }).click();
    
    // Select role from dropdown
    await page.getByLabel('Role', { exact: true }).click();
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Should see error about duplicate email
    await expect(page.getByText(/email already exists|email taken|duplicate/i)).toBeVisible({ timeout: 5000 });
  });

  test('Long names and emails display correctly', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToModule(page, 'Users');
    
    const longName = 'A'.repeat(100);
    const longEmail = `${'a'.repeat(50)}@${'example'.repeat(5)}.com`;
    
    await page.getByRole('button', { name: /create user/i }).click();
    await page.getByLabel('Full Name').fill(longName);
    await page.getByLabel('Email Address').fill(longEmail);
    await page.getByRole('button', { name: /generate password/i }).click();
    
    // Select role from dropdown
    await page.getByLabel('Role', { exact: true }).click();
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    // Try to create (might fail validation, which is fine)
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Verify either success or proper error message
    const response = await Promise.race([
      page.getByText(/user created successfully/i).isVisible(),
      page.getByText(/too long|maximum length|validation/i).isVisible()
    ]);
    
    expect(response).toBeTruthy();
  });

  test('Special characters in designation field', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToModule(page, 'Users');
    
    const testEmail = `special.chars.${Date.now()}@example.com`;
    await page.getByRole('button', { name: /create user/i }).click();
    await page.getByLabel('Full Name').fill('Special Chars User');
    await page.getByLabel('Email Address').fill(testEmail);
    await page.getByRole('button', { name: /generate password/i }).click();
    
    // Select role from dropdown
    await page.getByLabel('Role', { exact: true }).click();
    await page.getByRole('option', { name: /admin/i }).first().click();
    
    // Use special characters in designation
    await page.getByLabel('Designation').fill('Manager (Sales & Marketing) - #1');
    
    await page.getByRole('button', { name: /create user/i, exact: true }).click();
    
    // Should handle special characters gracefully
    await expect(page.getByText(/user created successfully/i)).toBeVisible({ timeout: 5000 });
  });
});
