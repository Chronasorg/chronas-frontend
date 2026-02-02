/**
 * Navigation Visual Regression Tests
 *
 * Visual snapshot tests for sidebar and drawer components across themes and states.
 *
 * Requirements: 13.1-13.5
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Visual Regression', () => {
  test.describe('Sidebar Snapshots', () => {
    test.describe('Light Theme', () => {
      test('sidebar - light theme, logged out', async ({ page }) => {
        await page.goto('/');
        
        // Ensure light theme
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'light');
        });
        
        const sidebar = page.getByTestId('navigation-sidebar');
        await expect(sidebar).toHaveScreenshot('sidebar-light-logged-out.png');
      });
    });

    test.describe('Dark Theme', () => {
      test('sidebar - dark theme, logged out', async ({ page }) => {
        await page.goto('/');
        
        // Set dark theme
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'dark');
        });
        
        const sidebar = page.getByTestId('navigation-sidebar');
        await expect(sidebar).toHaveScreenshot('sidebar-dark-logged-out.png');
      });
    });

    test.describe('Luther Theme', () => {
      test('sidebar - luther theme, logged out', async ({ page }) => {
        await page.goto('/');
        
        // Set luther theme
        await page.evaluate(() => {
          document.documentElement.setAttribute('data-theme', 'luther');
        });
        
        const sidebar = page.getByTestId('navigation-sidebar');
        await expect(sidebar).toHaveScreenshot('sidebar-luther-logged-out.png');
      });
    });
  });

  test.describe('Menu Drawer Snapshots', () => {
    test('drawer - layers content, light theme', async ({ page }) => {
      await page.goto('/');
      
      // Open layers drawer
      await page.getByTestId('nav-item-layers').click();
      
      const drawer = page.getByTestId('menu-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveScreenshot('drawer-layers-light.png');
    });

    test('drawer - collections content, light theme', async ({ page }) => {
      await page.goto('/');
      
      // Open collections drawer
      await page.getByTestId('nav-item-collections').click();
      
      const drawer = page.getByTestId('menu-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveScreenshot('drawer-collections-light.png');
    });

    test('drawer - layers content, dark theme', async ({ page }) => {
      await page.goto('/');
      
      // Set dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      
      // Open layers drawer
      await page.getByTestId('nav-item-layers').click();
      
      const drawer = page.getByTestId('menu-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveScreenshot('drawer-layers-dark.png');
    });
  });

  test.describe('Viewport Snapshots', () => {
    test.describe('Mobile viewport', () => {
      test.use({ viewport: { width: 375, height: 667 } });

      test('sidebar - mobile viewport', async ({ page }) => {
        await page.goto('/');
        
        const sidebar = page.getByTestId('navigation-sidebar');
        await expect(sidebar).toHaveScreenshot('sidebar-mobile.png');
      });
    });

    test.describe('Desktop viewport', () => {
      test.use({ viewport: { width: 1280, height: 720 } });

      test('sidebar - desktop viewport', async ({ page }) => {
        await page.goto('/');
        
        const sidebar = page.getByTestId('navigation-sidebar');
        await expect(sidebar).toHaveScreenshot('sidebar-desktop.png');
      });
    });
  });

  test.describe('Interaction State Snapshots', () => {
    test('nav item - hover state', async ({ page }) => {
      await page.goto('/');
      
      const layersButton = page.getByTestId('nav-item-layers');
      await layersButton.hover();
      
      await expect(layersButton).toHaveScreenshot('nav-item-hover.png');
    });

    test('nav item - active state (drawer open)', async ({ page }) => {
      await page.goto('/');
      
      // Open layers drawer to make the button active
      await page.getByTestId('nav-item-layers').click();
      
      const layersButton = page.getByTestId('nav-item-layers');
      await expect(layersButton).toHaveScreenshot('nav-item-active.png');
    });
  });
});
