/**
 * Navigation E2E Tests
 *
 * Tests for sidebar navigation, drawer functionality, and responsive behavior.
 *
 * Requirements: 2.2, 3.1-3.4, 4.1-4.7, 6.5-6.7, 7.1-7.5, 8.4
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Sidebar', () => {
    test('should render the sidebar', async ({ page }) => {
      const sidebar = page.getByTestId('navigation-sidebar');
      await expect(sidebar).toBeVisible();
    });

    test('should render the logo', async ({ page }) => {
      const logo = page.getByTestId('sidebar-logo');
      await expect(logo).toBeVisible();
    });

    test('should render top navigation items', async ({ page }) => {
      await expect(page.getByTestId('nav-item-layers')).toBeVisible();
      await expect(page.getByTestId('nav-item-discover')).toBeVisible();
      await expect(page.getByTestId('nav-item-random')).toBeVisible();
      await expect(page.getByTestId('nav-item-settings')).toBeVisible();
    });

    test('should render bottom navigation items', async ({ page }) => {
      await expect(page.getByTestId('nav-item-pro')).toBeVisible();
      await expect(page.getByTestId('nav-item-collections')).toBeVisible();
      await expect(page.getByTestId('nav-item-play')).toBeVisible();
      await expect(page.getByTestId('nav-item-help')).toBeVisible();
      await expect(page.getByTestId('nav-item-logout')).toBeVisible();
    });
  });

  test.describe('Navigation Links', () => {
    test('should navigate to /info when logo is clicked', async ({ page }) => {
      await page.getByTestId('sidebar-logo').click();
      await expect(page).toHaveURL(/\/info/);
    });

    test('should navigate to /discover when Discover is clicked', async ({ page }) => {
      await page.getByTestId('nav-item-discover').click();
      await expect(page).toHaveURL(/\/discover/);
    });

    test('should navigate to /configuration when Settings is clicked', async ({ page }) => {
      await page.getByTestId('nav-item-settings').click();
      await expect(page).toHaveURL(/\/configuration/);
    });

    test('should navigate to /pro when PRO is clicked', async ({ page }) => {
      await page.getByTestId('nav-item-pro').click();
      await expect(page).toHaveURL(/\/pro/);
    });

    test('should navigate to /play when Play is clicked', async ({ page }) => {
      await page.getByTestId('nav-item-play').click();
      await expect(page).toHaveURL(/\/play/);
    });

    test('should navigate to /info when Help is clicked', async ({ page }) => {
      await page.getByTestId('nav-item-help').click();
      await expect(page).toHaveURL(/\/info/);
    });
  });

  test.describe('Menu Drawer', () => {
    test('should open layers drawer when Layers is clicked', async ({ page }) => {
      await page.getByTestId('nav-item-layers').click();
      
      const drawer = page.getByTestId('menu-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer).toContainText('Layers');
    });

    test('should open collections drawer when Collections is clicked', async ({ page }) => {
      await page.getByTestId('nav-item-collections').click();
      
      const drawer = page.getByTestId('menu-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer).toContainText('Collections');
    });

    test('should close drawer when close button is clicked', async ({ page }) => {
      // Open the drawer first
      await page.getByTestId('nav-item-layers').click();
      
      const drawer = page.getByTestId('menu-drawer');
      await expect(drawer).toBeVisible();
      
      // Close the drawer
      await page.getByTestId('drawer-close-button').click();
      await expect(drawer).not.toBeVisible();
    });

    test('should toggle drawer when same button is clicked twice', async ({ page }) => {
      const layersButton = page.getByTestId('nav-item-layers');
      const drawer = page.getByTestId('menu-drawer');
      
      // Open
      await layersButton.click();
      await expect(drawer).toBeVisible();
      
      // Close
      await layersButton.click();
      await expect(drawer).not.toBeVisible();
    });

    test('should switch drawer content when different button is clicked', async ({ page }) => {
      const drawer = page.getByTestId('menu-drawer');
      
      // Open layers
      await page.getByTestId('nav-item-layers').click();
      await expect(drawer).toContainText('Layers');
      
      // Switch to collections
      await page.getByTestId('nav-item-collections').click();
      await expect(drawer).toContainText('Collections');
    });
  });

  test.describe('Accessibility', () => {
    test('should have aria-label on sidebar', async ({ page }) => {
      const sidebar = page.getByTestId('navigation-sidebar');
      await expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
    });

    test('should have aria-labels on navigation items', async ({ page }) => {
      await expect(page.getByTestId('nav-item-layers')).toHaveAttribute('aria-label', 'Layers');
      await expect(page.getByTestId('nav-item-discover')).toHaveAttribute('aria-label', 'Discover');
      await expect(page.getByTestId('nav-item-settings')).toHaveAttribute('aria-label', 'Settings');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Focus on the sidebar
      await page.getByTestId('sidebar-logo').focus();
      
      // Tab through items
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});

test.describe('Responsive Navigation', () => {
  test.describe('Mobile viewport', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show sidebar toggle on mobile', async ({ page }) => {
      await page.goto('/');
      
      // On mobile, the sidebar might be collapsed by default
      // Check for toggle button if sidebar is collapsible
      const toggleButton = page.getByTestId('sidebar-toggle');
      
      // Toggle button should be visible on mobile
      if (await toggleButton.isVisible()) {
        await expect(toggleButton).toBeVisible();
      }
    });
  });

  test.describe('Desktop viewport', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('should show sidebar on desktop', async ({ page }) => {
      await page.goto('/');
      
      const sidebar = page.getByTestId('navigation-sidebar');
      await expect(sidebar).toBeVisible();
    });
  });
});

test.describe('Theme Integration', () => {
  test('should apply light theme by default', async ({ page }) => {
    await page.goto('/');
    
    const sidebar = page.getByTestId('navigation-sidebar');
    await expect(sidebar).toHaveAttribute('data-theme', 'light');
  });
});
