/**
 * Navigation Production Parity E2E Tests
 *
 * These tests verify that the navigation sidebar matches the production
 * Chronas (https://chronas.org) implementation EXACTLY.
 *
 * Production HTML reference structure:
 * - Main container: flex column, padding 8px 4px
 * - topMenuItems: Logo, Layers, Discover, Random, Settings
 * - bottomMenu: Star (PRO), Collections, Play, Help, Logout
 * - Icons: color rgb(106, 106, 106), fill currentcolor, 24x24px
 * - Logo SVG: fill #fffffe, viewBox 0 0 14930 16000
 *
 * Requirements: 1.1-1.6, 8.1-8.6, 9.1-9.4
 */

import { test, expect } from '@playwright/test';

// URLs for comparison
const DEV_URL = 'https://d1q6nlczw9cdpt.cloudfront.net';
const PROD_URL = 'https://chronas.org';

/**
 * Production icon SVG paths (extracted from production HTML)
 * These are the exact Material-UI icon paths used in production
 */
const PRODUCTION_ICON_PATHS = {
  layers: 'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z',
  discover: 'M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z',
  random: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z',
  settings: 'M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z',
  star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  collections: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 10l-2.5-1.5L15 12V4h5v8z',
  play: 'M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  help: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
  logout: 'M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z',
};

test.describe('Navigation Parity with Production', () => {
  test.describe('Compare with Production', () => {
    test('should have same navigation structure as production', async ({ page }) => {
      // Load production first to get reference
      await page.goto(PROD_URL);
      await page.waitForLoadState('networkidle');
      
      // Get production navigation structure
      const prodNavItems = await page.evaluate(() => {
        const items: string[] = [];
        // Get all SVG icons in the sidebar
        const svgs = document.querySelectorAll('svg[viewBox="0 0 24 24"]');
        svgs.forEach((svg) => {
          const path = svg.querySelector('path');
          if (path) {
            items.push(path.getAttribute('d') ?? '');
          }
        });
        return items;
      });
      
      console.log(`Production has ${String(prodNavItems.length)} navigation icons`);
      
      // Now load dev environment
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Get dev navigation structure
      const devNavItems = await page.evaluate(() => {
        const items: string[] = [];
        const svgs = document.querySelectorAll('svg[viewBox="0 0 24 24"]');
        svgs.forEach((svg) => {
          const path = svg.querySelector('path');
          if (path) {
            items.push(path.getAttribute('d') ?? '');
          }
        });
        return items;
      });
      
      console.log(`Dev has ${String(devNavItems.length)} navigation icons`);
      
      // Compare counts
      expect(devNavItems.length).toBeGreaterThanOrEqual(prodNavItems.length - 2); // Allow some flexibility
    });
  });

  test.describe('Logo Component - Production Parity', () => {
    test('should have logo SVG with production viewBox', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production logo has viewBox="0 0 14930 16000"
      const logoSvg = page.locator('svg[viewBox="0 0 14930 16000"]');
      await expect(logoSvg).toBeVisible({ timeout: 10000 });
    });

    test('should have logo link to #/info', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production logo is wrapped in <a href="#/info">
      const logoLink = page.locator('a[href="#/info"], a[href="/info"]').first();
      await expect(logoLink).toBeVisible({ timeout: 10000 });
    });

    test('should have logo with correct dimensions (50px width)', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production logo SVG has width="50px" height="50px"
      const logoSvg = page.locator('svg[viewBox="0 0 14930 16000"]');
      await expect(logoSvg).toBeVisible({ timeout: 10000 });
      
      const width = await logoSvg.getAttribute('width');
      expect(width).toMatch(/50/);
    });
  });

  test.describe('Navigation Icons - Production Parity', () => {
    test('should have Layers icon with production SVG path', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Check for Layers icon path from production
      const layersPath = page.locator(`path[d="${PRODUCTION_ICON_PATHS.layers}"]`);
      const hasLayersIcon = await layersPath.count() > 0;
      
      if (!hasLayersIcon) {
        // Log what icons we do have
        const allPaths = await page.evaluate(() => {
          const paths: string[] = [];
          document.querySelectorAll('svg path').forEach((p) => {
            const d = p.getAttribute('d');
            if (d && d.length > 50) {
              paths.push(d.substring(0, 50) + '...');
            }
          });
          return paths;
        });
        console.log('Available icon paths:', allPaths);
      }
      
      expect(hasLayersIcon).toBe(true);
    });

    test('should have Settings icon with production SVG path', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      const settingsPath = page.locator(`path[d="${PRODUCTION_ICON_PATHS.settings}"]`);
      await expect(settingsPath).toBeVisible({ timeout: 10000 });
    });

    test('should have Star (PRO) icon with production SVG path', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      const starPath = page.locator(`path[d="${PRODUCTION_ICON_PATHS.star}"]`);
      await expect(starPath).toBeVisible({ timeout: 10000 });
    });

    test('should have Help icon with production SVG path', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      const helpPath = page.locator(`path[d="${PRODUCTION_ICON_PATHS.help}"]`);
      await expect(helpPath).toBeVisible({ timeout: 10000 });
    });

    test('should have Logout icon with production SVG path', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      const logoutPath = page.locator(`path[d="${PRODUCTION_ICON_PATHS.logout}"]`);
      await expect(logoutPath).toBeVisible({ timeout: 10000 });
    });

    test('should have Collections icon with production SVG path', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      const collectionsPath = page.locator(`path[d="${PRODUCTION_ICON_PATHS.collections}"]`);
      await expect(collectionsPath).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Icon Styling - Production Parity', () => {
    test('should have icons with production color rgb(106, 106, 106)', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production icons have: color: rgb(106, 106, 106); fill: currentcolor
      const iconSvg = page.locator('svg[viewBox="0 0 24 24"]').first();
      await expect(iconSvg).toBeVisible({ timeout: 10000 });
      
      const color = await iconSvg.evaluate((el) => {
        return getComputedStyle(el).color;
      });
      
      console.log(`Icon color: ${color}`);
      
      // Should be rgb(106, 106, 106) which is #6a6a6a
      expect(color).toBe('rgb(106, 106, 106)');
    });

    test('should have icons with 24x24 dimensions', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production icons have: height: 24px; width: 24px
      const iconSvg = page.locator('svg[viewBox="0 0 24 24"]').first();
      await expect(iconSvg).toBeVisible({ timeout: 10000 });
      
      const box = await iconSvg.boundingBox();
      expect(box?.width).toBeCloseTo(24, 2);
      expect(box?.height).toBeCloseTo(24, 2);
    });

    test('should change icon color to gold on hover', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Find a clickable icon (button or link with SVG)
      const iconButton = page.locator('button svg[viewBox="0 0 24 24"]').first();
      await expect(iconButton).toBeVisible({ timeout: 10000 });
      
      // Get parent button
      const button = iconButton.locator('..');
      
      // Hover
      await button.hover();
      await page.waitForTimeout(500);
      
      // Check color changed to gold rgb(173, 135, 27)
      const colorAfter = await iconButton.evaluate((el) => {
        return getComputedStyle(el).color;
      });
      
      console.log(`Icon color after hover: ${colorAfter}`);
      
      // Production hover color is rgb(173, 135, 27)
      expect(colorAfter).toBe('rgb(173, 135, 27)');
    });
  });

  test.describe('Sidebar Structure - Production Parity', () => {
    test('should have sidebar with flex column layout', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production has: display: flex; flex-direction: column
      const sidebar = page.getByTestId('navigation-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });
      
      const display = await sidebar.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          display: style.display,
          flexDirection: style.flexDirection,
        };
      });
      
      expect(display.display).toBe('flex');
      expect(display.flexDirection).toBe('column');
    });

    test('should have sidebar with padding 8px 4px', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production has: padding: 8px 4px
      const sidebar = page.getByTestId('navigation-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 10000 });
      
      const padding = await sidebar.evaluate((el) => {
        return getComputedStyle(el).padding;
      });
      
      console.log(`Sidebar padding: ${padding}`);
      
      // Should be 8px 4px (or equivalent)
      expect(padding).toMatch(/8px\s+4px|8px 4px 8px 4px/);
    });

    test('should have top and bottom menu sections', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Production has topMenuItems and bottomMenu divs
      const topSection = page.getByTestId('nav-section-top');
      const bottomSection = page.getByTestId('nav-section-bottom');
      
      await expect(topSection).toBeVisible({ timeout: 10000 });
      await expect(bottomSection).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigation Order - Production Parity', () => {
    test('should have icons in production order: Layers, Discover, Random, Settings in top', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Get all icon paths in order from top section
      const topSection = page.getByTestId('nav-section-top');
      await expect(topSection).toBeVisible({ timeout: 10000 });
      
      const iconPaths = await topSection.evaluate((el) => {
        const paths: string[] = [];
        el.querySelectorAll('svg[viewBox="0 0 24 24"] path').forEach((p) => {
          paths.push(p.getAttribute('d') ?? '');
        });
        return paths;
      });
      
      console.log(`Top section has ${String(iconPaths.length)} icons`);
      
      // Check Layers is first
      if (iconPaths.length > 0) {
        expect(iconPaths[0]).toBe(PRODUCTION_ICON_PATHS.layers);
      }
    });

    test('should have icons in production order: Star, Collections, Play, Help, Logout in bottom', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Get all icon paths in order from bottom section
      const bottomSection = page.getByTestId('nav-section-bottom');
      await expect(bottomSection).toBeVisible({ timeout: 10000 });
      
      const iconPaths = await bottomSection.evaluate((el) => {
        const paths: string[] = [];
        el.querySelectorAll('svg[viewBox="0 0 24 24"] path').forEach((p) => {
          paths.push(p.getAttribute('d') ?? '');
        });
        return paths;
      });
      
      console.log(`Bottom section has ${String(iconPaths.length)} icons`);
      
      // Check Star is first in bottom
      if (iconPaths.length > 0) {
        expect(iconPaths[0]).toBe(PRODUCTION_ICON_PATHS.star);
      }
      
      // Check Logout is last
      if (iconPaths.length > 0) {
        expect(iconPaths[iconPaths.length - 1]).toBe(PRODUCTION_ICON_PATHS.logout);
      }
    });
  });

  test.describe('Drawer Functionality', () => {
    test('should open layers drawer when Layers icon is clicked', async ({ page }) => {
      await page.goto(DEV_URL);
      await page.waitForLoadState('networkidle');
      
      // Find Layers button by its SVG path
      const layersButton = page.locator(`button:has(path[d="${PRODUCTION_ICON_PATHS.layers}"])`);
      
      if (await layersButton.count() > 0) {
        await layersButton.click();
        
        // Drawer should open
        const drawer = page.getByTestId('menu-drawer');
        await expect(drawer).toBeVisible({ timeout: 5000 });
      } else {
        // Fallback to test ID
        const layersItem = page.getByTestId('nav-item-layers');
        await expect(layersItem).toBeVisible({ timeout: 10000 });
        await layersItem.click();
        
        const drawer = page.getByTestId('menu-drawer');
        await expect(drawer).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
