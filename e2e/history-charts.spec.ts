import { test, expect } from '@playwright/test';

test.describe('History Charts', () => {
  test('should open history modal', async ({ page }) => {
    await page.goto('/');
    
    // Wait for plant cards to load
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Click View History button on first plant card
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="view-history-button"]').click();
    
    // Verify modal opens
    const modal = page.locator('[data-testid="history-modal"]');
    await expect(modal).toBeVisible();
  });

  test('should display time range selector', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Open history modal
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="view-history-button"]').click();
    
    const modal = page.locator('[data-testid="history-modal"]');
    
    // Verify time range buttons exist
    await expect(modal.locator('button:has-text("1h")')).toBeVisible();
    await expect(modal.locator('button:has-text("6h")')).toBeVisible();
    await expect(modal.locator('button:has-text("24h")')).toBeVisible();
    await expect(modal.locator('button:has-text("7d")')).toBeVisible();
  });

  test('should display three charts', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Open history modal
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="view-history-button"]').click();
    
    const modal = page.locator('[data-testid="history-modal"]');
    
    // Wait for charts to render (give time for API call and chart rendering)
    await page.waitForTimeout(3000);
    
    // Verify charts are present (look for Recharts SVG or canvas elements)
    // Recharts typically renders SVG elements
    const charts = modal.locator('.recharts-responsive-container');
    expect(await charts.count()).toBeGreaterThanOrEqual(3);
  });

  test('should switch time ranges', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Open history modal
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="view-history-button"]').click();
    
    const modal = page.locator('[data-testid="history-modal"]');
    
    // Default is 24h, click 1h button
    const button1h = modal.locator('button:has-text("1h")');
    await button1h.click();
    
    // Wait for new data to load
    await page.waitForTimeout(2000);
    
    // Verify button is now active (has green background)
    await expect(button1h).toHaveClass(/bg-green-600/);
  });

  test('should close history modal', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-testid="plant-card"]', { timeout: 10000 });
    
    // Open history modal
    const firstCard = page.locator('[data-testid="plant-card"]').first();
    await firstCard.locator('[data-testid="view-history-button"]').click();
    
    const modal = page.locator('[data-testid="history-modal"]');
    await expect(modal).toBeVisible();
    
    // Click close button (X button)
    await modal.locator('[data-testid="close-button"]').click();
    
    // Verify modal closes
    await expect(modal).not.toBeVisible();
  });
});
