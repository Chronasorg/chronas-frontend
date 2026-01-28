import { test, expect } from '@playwright/test';

test.describe('Application Shell', () => {
  test('should render all layout areas', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });

  test('should display feature placeholder on home page', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('[data-testid="feature-placeholder"]')).toBeVisible();
  });
});
