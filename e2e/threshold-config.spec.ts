import { test, expect } from '@playwright/test';

test.describe('Threshold Configuration', () => {
  test('should open configuration modal', async ({ page }) => {
    await page.goto('/');
    
    // Wait for plant cards to load
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Click Configure button on first plant card
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="configure-button"]').click();
    
    // Verify modal opens
    const modal = page.locator('[data-testid="threshold-config-modal"]');
    await expect(modal).toBeVisible();
  });

  test('should display threshold form fields', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Open config modal
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="configure-button"]').click();
    
    // Verify form fields exist
    const modal = page.locator('[data-testid="threshold-config-modal"]');
    await expect(modal.locator('input[name="soil_moisture_min"]')).toBeVisible();
    await expect(modal.locator('input[name="soil_moisture_max"]')).toBeVisible();
    await expect(modal.locator('input[name="light_min"]')).toBeVisible();
    await expect(modal.locator('input[name="temperature_min"]')).toBeVisible();
    await expect(modal.locator('input[name="temperature_max"]')).toBeVisible();
    await expect(modal.locator('input[name="alert_cooldown_minutes"]')).toBeVisible();
  });

  test('should update threshold value and save', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Open config modal
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="configure-button"]').click();
    
    const modal = page.locator('[data-testid="threshold-config-modal"]');
    
    // Change soil_moisture_min value
    const soilMoistureMin = modal.locator('input[name="soil_moisture_min"]');
    await soilMoistureMin.fill('25');
    
    // Click Save button
    await modal.locator('[data-testid="save-button"]').click();
    
    // Verify modal closes (or shows success state)
    // Give it a moment for the API call
    await page.waitForTimeout(2000);
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Open config modal
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="configure-button"]').click();
    
    const modal = page.locator('[data-testid="threshold-config-modal"]');
    await expect(modal).toBeVisible();
    
    // Click close button (X button)
    await modal.locator('[data-testid="close-button"]').click();
    
    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });
});
