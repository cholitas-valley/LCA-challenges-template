import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard with plant cards', async ({ page }) => {
    await page.goto('/');
    
    // Verify page title
    await expect(page).toHaveTitle(/PlantOps Dashboard/);
    
    // Wait for plant cards to load (API might take a moment)
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Count plant cards - should be 6
    const plantCards = await page.locator('[data-testid="plant-card"]').count();
    expect(plantCards).toBe(6);
  });

  test('each plant card should have required elements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for first plant card
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    
    // Verify plant name is present
    await expect(firstCard.locator('h3')).toBeVisible();
    
    // Verify status badge is present (look for badge text)
    const badge = firstCard.locator('[data-testid="status-badge"]');
    await expect(badge).toBeVisible();
    
    // Verify telemetry metrics are present (3 metrics)
    const telemetryItems = firstCard.locator('[data-testid="telemetry-item"]');
    expect(await telemetryItems.count()).toBe(3);
  });

  test('should display telemetry values', async ({ page }) => {
    await page.goto('/');
    
    // Wait for telemetry data to load
    await page.waitForSelector('[data-testid="telemetry-item"]', { timeout: 10000 });
    
    const firstTelemetry = page.locator('[data-testid="telemetry-item"]').first();
    
    // Verify telemetry has a value (number)
    const value = await firstTelemetry.locator('[data-testid="telemetry-value"]').textContent();
    expect(value).toBeTruthy();
  });

  test('should show last updated timestamp', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    const timestamp = firstCard.locator('[data-testid="last-updated"]');
    
    await expect(timestamp).toBeVisible();
    const timestampText = await timestamp.textContent();
    expect(timestampText).toContain('ago');
  });
});
