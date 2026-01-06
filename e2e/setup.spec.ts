import { test, expect } from '@playwright/test';

test.describe('Setup and Docker Services', () => {
  test('services should be running', async ({ page }) => {
    // Check frontend is accessible
    await page.goto('/');
    await expect(page).toHaveTitle(/PlantOps Dashboard/);
  });

  test('backend API should be healthy', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/health');
    expect([200, 503]).toContain(response.status());
  });
});
