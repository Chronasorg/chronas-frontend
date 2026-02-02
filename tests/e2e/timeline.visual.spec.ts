/**
 * Timeline Visual Regression Tests
 *
 * Visual snapshot tests for the timeline component.
 * Captures snapshots in different states and themes.
 *
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { test, expect } from '@playwright/test';

test.describe('Timeline Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="timeline"]');
  });

  test.describe('Collapsed State', () => {
    test('should match snapshot in collapsed state', async ({ page }) => {
      const timeline = page.locator('[data-testid="timeline"]');
      await expect(timeline).toHaveScreenshot('timeline-collapsed.png');
    });

    test('should match snapshot with control buttons visible', async ({ page }) => {
      const controls = page.locator('[data-testid="timeline-controls"]');
      await expect(controls).toHaveScreenshot('timeline-controls.png');
    });
  });

  test.describe('Expanded State', () => {
    test('should match snapshot in expanded state', async ({ page }) => {
      // Expand the timeline using JavaScript click
      await page.locator('[data-testid="expand-button"]').evaluate((btn) => (btn as HTMLButtonElement).click());
      await page.waitForTimeout(600); // Wait for animation
      
      const timeline = page.locator('[data-testid="timeline"]');
      await expect(timeline).toHaveScreenshot('timeline-expanded.png');
    });
  });

  test.describe('Theme Variations', () => {
    test('should match snapshot in light theme', async ({ page }) => {
      // Ensure light theme (default)
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
      });
      
      const timeline = page.locator('[data-testid="timeline"]');
      await expect(timeline).toHaveScreenshot('timeline-light-theme.png');
    });

    test('should match snapshot in dark theme', async ({ page }) => {
      // Set dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.waitForTimeout(100); // Wait for theme to apply
      
      const timeline = page.locator('[data-testid="timeline"]');
      await expect(timeline).toHaveScreenshot('timeline-dark-theme.png');
    });

    test('should match snapshot in luther theme', async ({ page }) => {
      // Set luther theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'luther');
      });
      await page.waitForTimeout(100); // Wait for theme to apply
      
      const timeline = page.locator('[data-testid="timeline"]');
      await expect(timeline).toHaveScreenshot('timeline-luther-theme.png');
    });
  });

  test.describe('Button States', () => {
    test('should match snapshot with expand button hovered', async ({ page }) => {
      const expandButton = page.locator('[data-testid="expand-button"]');
      // Use dispatchEvent to trigger hover state
      await expandButton.evaluate((btn) => {
        btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      });
      await page.waitForTimeout(100);
      
      await expect(expandButton).toHaveScreenshot('expand-button-hover.png');
    });

    test('should match snapshot with reset button disabled', async ({ page }) => {
      const resetButton = page.locator('[data-testid="reset-button"]');
      await expect(resetButton).toHaveScreenshot('reset-button-disabled.png');
    });

    test('should match snapshot with tooltip visible', async ({ page }) => {
      const expandButton = page.locator('[data-testid="expand-button"]');
      // Use dispatchEvent to trigger hover state for tooltip
      await expandButton.evaluate((btn) => {
        btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      });
      await page.waitForTimeout(500); // Wait for tooltip
      
      // Capture the button wrapper which includes tooltip
      const buttonWrapper = expandButton.locator('..');
      await expect(buttonWrapper).toHaveScreenshot('button-with-tooltip.png');
    });
  });

  test.describe('Full Page Context', () => {
    test('should match full page snapshot with timeline', async ({ page }) => {
      await expect(page).toHaveScreenshot('full-page-with-timeline.png', {
        fullPage: true,
      });
    });

    test('should match full page snapshot with expanded timeline', async ({ page }) => {
      // Use JavaScript click to bypass pointer event issues
      await page.locator('[data-testid="expand-button"]').evaluate((btn) => (btn as HTMLButtonElement).click());
      await page.waitForTimeout(600);
      
      await expect(page).toHaveScreenshot('full-page-timeline-expanded.png', {
        fullPage: true,
      });
    });
  });
});
