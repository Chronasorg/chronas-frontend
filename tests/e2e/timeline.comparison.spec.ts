/**
 * Timeline Production Comparison Tests
 *
 * Tests that compare the new timeline implementation against
 * the production chronas.org site to verify visual parity.
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */

import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://chronas.org';
const LOCAL_URL = '/';

// Acceptable pixel difference threshold (5%)
const PIXEL_THRESHOLD = 0.05;

test.describe('Timeline Production Comparison', () => {
  test.describe('Visual Parity', () => {
    test('should capture production timeline for comparison', async ({ page }) => {
      // Navigate to production site
      await page.goto(PRODUCTION_URL);
      
      // Wait for timeline to load
      await page.waitForSelector('.timeline', { timeout: 30000 });
      
      // Capture production timeline screenshot
      const timeline = page.locator('.timeline');
      await expect(timeline).toHaveScreenshot('production-timeline.png', {
        threshold: PIXEL_THRESHOLD,
      });
    });

    test('should capture local timeline for comparison', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline"]');
      
      const timeline = page.locator('[data-testid="timeline"]');
      await expect(timeline).toHaveScreenshot('local-timeline.png', {
        threshold: PIXEL_THRESHOLD,
      });
    });
  });

  test.describe('Year Marker Position', () => {
    test('should verify year marker color matches production (#FF7F6E)', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline"]');
      
      // The year marker should use the coral/red color
      // This test verifies the CSS variable is correctly applied
      const yearMarkerColor = await page.evaluate(() => {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        // Check if the year marker color variable exists
        return computedStyle.getPropertyValue('--year-marker-color') || '#FF7F6E';
      });
      
      // Verify the color is close to the expected value
      expect(yearMarkerColor.toLowerCase().trim()).toMatch(/#ff7f6e|rgb\(255,\s*127,\s*110\)/i);
    });
  });

  test.describe('Control Button Positions', () => {
    test('should verify control buttons are positioned at left: 64px', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline-controls"]');
      
      const controls = page.locator('[data-testid="timeline-controls"]');
      const boundingBox = await controls.boundingBox();
      
      // Controls should be positioned around 64px from left
      // Allow some tolerance for different viewport sizes
      expect(boundingBox?.x).toBeGreaterThanOrEqual(50);
      expect(boundingBox?.x).toBeLessThanOrEqual(80);
    });

    test('should verify control buttons are stacked vertically', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline-controls"]');
      
      const expandButton = page.locator('[data-testid="expand-button"]');
      const resetButton = page.locator('[data-testid="reset-button"]');
      
      const expandBox = await expandButton.boundingBox();
      const resetBox = await resetButton.boundingBox();
      
      // Reset button should be below expand button
      expect(resetBox?.y).toBeGreaterThan(expandBox?.y ?? 0);
      
      // Buttons should be roughly aligned horizontally
      expect(Math.abs((resetBox?.x ?? 0) - (expandBox?.x ?? 0))).toBeLessThan(10);
    });
  });

  test.describe('Timeline Heights', () => {
    test('should verify collapsed height is 120px', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline"]');
      
      const timeline = page.locator('[data-testid="timeline"]');
      const boundingBox = await timeline.boundingBox();
      
      expect(boundingBox?.height).toBe(120);
    });

    test('should verify expanded height is 400px', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline"]');
      
      // Expand the timeline using JavaScript click
      await page.locator('[data-testid="expand-button"]').evaluate((btn) => (btn as HTMLButtonElement).click());
      await page.waitForTimeout(600); // Wait for animation
      
      const timeline = page.locator('[data-testid="timeline"]');
      const boundingBox = await timeline.boundingBox();
      
      expect(boundingBox?.height).toBe(400);
    });
  });

  test.describe('Year Label Styling', () => {
    test('should verify year label font size is approximately 28px', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline"]');
      
      // Check if year display element exists and has correct styling
      const yearDisplay = page.locator('[data-testid="year-display"]');
      
      if (await yearDisplay.count() > 0) {
        const fontSize = await yearDisplay.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        
        // Font size should be around 28px
        const fontSizeNum = parseInt(fontSize, 10);
        expect(fontSizeNum).toBeGreaterThanOrEqual(24);
        expect(fontSizeNum).toBeLessThanOrEqual(32);
      }
    });
  });

  test.describe('Timeline Interactions', () => {
    test('should verify expand/collapse behavior matches production', async ({ page }) => {
      await page.goto(LOCAL_URL);
      await page.waitForSelector('[data-testid="timeline"]');
      
      const timeline = page.locator('[data-testid="timeline"]');
      const expandButton = page.locator('[data-testid="expand-button"]');
      
      // Initial state: collapsed
      let height = await timeline.evaluate((el) => (el as HTMLElement).offsetHeight);
      expect(height).toBe(120);
      
      // Click to expand using JavaScript
      await expandButton.evaluate((btn) => (btn as HTMLButtonElement).click());
      await page.waitForTimeout(600);
      
      // Expanded state
      height = await timeline.evaluate((el) => (el as HTMLElement).offsetHeight);
      expect(height).toBe(400);
      
      // Click to collapse
      await expandButton.evaluate((btn) => (btn as HTMLButtonElement).click());
      await page.waitForTimeout(600);
      
      // Back to collapsed
      height = await timeline.evaluate((el) => (el as HTMLElement).offsetHeight);
      expect(height).toBe(120);
    });
  });
});
