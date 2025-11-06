import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Backend health endpoint is responding', async ({ request }) => {
    const response = await request.get('http://localhost:5001/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('OK');
  });

  test('Frontend loads successfully', async ({ page }) => {
    await page.goto('/');
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/.*login/);
  });

  test('Login page loads and displays correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('Register page loads and displays correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register/);
    // Check for registration form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register|sign up/i })).toBeVisible();
  });

  test('Protected routes redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = ['/', '/create-group', '/group/123'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('Frontend can make API requests', async ({ page }) => {
    await page.goto('/login');
    
    // Try to fetch health endpoint through the proxy
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
});

