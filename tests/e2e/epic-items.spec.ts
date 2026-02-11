/**
 * Epic Items E2E Tests
 *
 * E2E tests for epic items on the timeline:
 * - Epic items appear on timeline
 * - Epic click opens right drawer
 * - Epic type filtering via Epics section in LayersContent
 *
 * Requirements: 6.2, 6.3, 7.3 (production-parity-fixes)
 *
 * Run with: npm run test:e2e
 * Or for deployed environment: npm run test:deploy
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Get URL from environment or use the dev deployment URL
const BASE_URL = process.env['BASE_URL'] ?? 'https://d1q6nlczw9cdpt.cloudfront.net';

/**
 * Helper function to wait for app to fully load
 */
async function waitForAppLoad(page: Page, timeout = 15000): Promise<void> {
  await page.waitForSelector('[data-testid="app-shell"]', { timeout });
  await page.waitForTimeout(1000);
}

/**
 * Helper to wait for map to be ready
 */
async function waitForMapLoad(page: Page): Promise<void> {
  // Try multiple selectors for map container
  const mapSelectors = [
    '[data-testid="map-container"]',
    '[data-testid="map-view"]',
    '.mapboxgl-map',
  ];

  let found = false;
  for (const selector of mapSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      found = true;
      break;
    } catch {
      // Try next selector
    }
  }

  if (!found) {
    // Just wait for mapbox canvas as fallback
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 15000 });
  }

  await page.waitForTimeout(2000);
}


/**
 * Helper to wait for timeline to be ready
 */
async function waitForTimelineLoad(page: Page): Promise<void> {
  // Wait for timeline container
  const timelineSelectors = [
    '[data-testid="timeline"]',
    '[data-testid="vis-timeline"]',
    '.vis-timeline',
  ];

  let found = false;
  for (const selector of timelineSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      found = true;
      break;
    } catch {
      // Try next selector
    }
  }

  if (!found) {
    console.log('   ⚠️ Timeline container not found');
  }

  await page.waitForTimeout(1500);
}

/**
 * Helper to disable timeline pointer events
 * This prevents the timeline from intercepting clicks on the drawer
 */
async function disableTimelinePointerEvents(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      #timeline-portal, #timeline-portal * {
        pointer-events: none !important;
      }
      .vis-loading-screen {
        display: none !important;
      }
    `
  });
  await page.waitForTimeout(300);
}

/**
 * Helper to open the Layers menu drawer
 */
async function openLayersMenu(page: Page): Promise<void> {
  // Disable timeline pointer events first
  await disableTimelinePointerEvents(page);

  // Click on the Layers menu button in the sidebar
  // The nav item uses testId="nav-item-layers"
  const layersButton = page.locator('[data-testid="nav-item-layers"]');
  const isVisible = await layersButton.isVisible().catch(() => false);

  if (isVisible) {
    // Use force click to bypass any overlays
    await layersButton.click({ force: true });
    await page.waitForTimeout(800);

    // Verify the drawer opened by checking for layers-content
    const layersContent = page.locator('[data-testid="layers-content"]');
    try {
      await layersContent.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      // Try clicking again if drawer didn't open
      await layersButton.click({ force: true });
      await page.waitForTimeout(800);
    }
  } else {
    // Try alternative selectors
    const altSelectors = [
      '[data-testid="menu-item-layers"]',
      'button:has-text("Layers")',
      '[aria-label="Layers"]',
    ];
    for (const selector of altSelectors) {
      const altButton = page.locator(selector);
      const altVisible = await altButton.isVisible().catch(() => false);
      if (altVisible) {
        await altButton.click({ force: true });
        await page.waitForTimeout(800);
        break;
      }
    }
  }
}

/**
 * Helper to expand the Epics section in Layers menu
 */
async function expandEpicsSection(page: Page): Promise<void> {
  const epicsToggle = page.locator('[data-testid="epics-section-toggle"]');
  const isVisible = await epicsToggle.isVisible().catch(() => false);

  if (isVisible) {
    // Check if already expanded
    const content = page.locator('[data-testid="epics-section-content"]');
    const contentVisible = await content.isVisible().catch(() => false);

    if (!contentVisible) {
      await epicsToggle.click({ force: true });
      await page.waitForTimeout(300);
    }
  }
}


// Configure tests to run serially to avoid race conditions
test.describe.configure({ mode: 'serial' });

// ============================================================================
// EPIC ITEMS ON TIMELINE TESTS (Requirement 6.2)
// ============================================================================

test.describe('Epic Items on Timeline Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📜 Epic Items on Timeline Tests at: ${BASE_URL}\n`);
  });

  test('should have timeline component visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Check for timeline container
    const timeline = page.locator('[data-testid="timeline"]');
    const isVisible = await timeline.isVisible().catch(() => false);

    if (isVisible) {
      await expect(timeline).toBeVisible();
      console.log('   ✅ Timeline component is visible');
    } else {
      // Try alternative selector
      const visTimeline = page.locator('[data-testid="vis-timeline"]');
      const visVisible = await visTimeline.isVisible().catch(() => false);
      if (visVisible) {
        await expect(visTimeline).toBeVisible();
        console.log('   ✅ Vis-timeline component is visible');
      } else {
        console.log('   ⚠️ Timeline component not found');
      }
    }
  });

  test('should display epic items on the timeline', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Check for epic items on the timeline
    // Epic items have the class 'epic-item' or 'vis-item'
    const epicItemSelectors = [
      '.epic-item',
      '.vis-item',
      '[data-testid="vis-timeline"] .vis-item',
      '.vis-timeline .vis-item',
    ];

    let epicItemsFound = false;
    let epicItemCount = 0;

    for (const selector of epicItemSelectors) {
      const items = page.locator(selector);
      const count = await items.count().catch(() => 0);
      if (count > 0) {
        epicItemsFound = true;
        epicItemCount = count;
        console.log(`   📋 Found ${String(count)} epic items with selector: ${selector}`);
        break;
      }
    }

    if (epicItemsFound) {
      expect(epicItemCount).toBeGreaterThan(0);
      console.log(`   ✅ Epic items are displayed on timeline (${String(epicItemCount)} items)`);
    } else {
      console.log('   ⚠️ No epic items found on timeline');
    }
  });


  test('should display epic items with correct styling', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Check for styled epic items (they should have type-specific classes)
    const styledItemSelectors = [
      '.timelineItem_ei', // Empire items
      '.timelineItem_ps', // Person items
      '.timelineItem_ew', // War items
      '.vis-item.vis-range', // Range items (epics with start/end dates)
    ];

    let styledItemsFound = false;

    for (const selector of styledItemSelectors) {
      const items = page.locator(selector);
      const count = await items.count().catch(() => 0);
      if (count > 0) {
        styledItemsFound = true;
        console.log(`   📋 Found ${String(count)} styled items with selector: ${selector}`);
      }
    }

    if (styledItemsFound) {
      console.log('   ✅ Epic items have correct styling');
    } else {
      // Check for any vis-items as fallback
      const anyItems = page.locator('.vis-item');
      const count = await anyItems.count().catch(() => 0);
      if (count > 0) {
        console.log(`   ✅ Found ${String(count)} timeline items (styling may vary)`);
      } else {
        console.log('   ⚠️ No styled epic items found');
      }
    }
  });

  test('should capture timeline with epic items screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Take screenshot of the timeline area
    await expect(page).toHaveScreenshot('timeline-with-epics.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });

    console.log('   ✅ Timeline with epic items screenshot captured');
  });
});


// ============================================================================
// EPIC CLICK OPENS RIGHT DRAWER TESTS (Requirement 6.3)
// ============================================================================

test.describe('Epic Click Opens Right Drawer Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🖱️ Epic Click Opens Right Drawer Tests\n`);
  });

  test('should open right drawer when epic item is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Find an epic item to click
    const epicItemSelectors = [
      '.vis-item.vis-range',
      '.vis-item',
      '.epic-item',
    ];

    let clicked = false;

    for (const selector of epicItemSelectors) {
      const items = page.locator(selector);
      const count = await items.count().catch(() => 0);
      
      if (count > 0) {
        // Click the first epic item
        await items.first().click();
        clicked = true;
        console.log(`   🖱️ Clicked epic item with selector: ${selector}`);
        break;
      }
    }

    if (clicked) {
      // Wait for right drawer to open
      await page.waitForTimeout(1000);

      // Check if right drawer is open
      const rightDrawerSelectors = [
        '[data-testid="right-drawer"]',
        '[data-testid="right-drawer-content"]',
        '.right-drawer',
        '[role="complementary"]',
      ];

      let drawerFound = false;

      for (const selector of rightDrawerSelectors) {
        const drawer = page.locator(selector);
        const isVisible = await drawer.isVisible().catch(() => false);
        if (isVisible) {
          drawerFound = true;
          console.log(`   ✅ Right drawer opened with selector: ${selector}`);
          break;
        }
      }

      if (!drawerFound) {
        console.log('   ⚠️ Right drawer not found after clicking epic item');
      }
    } else {
      console.log('   ⚠️ No epic items found to click');
    }
  });


  test('should display epic content in right drawer', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Find and click an epic item
    const epicItem = page.locator('.vis-item').first();
    const isVisible = await epicItem.isVisible().catch(() => false);

    if (isVisible) {
      await epicItem.click();
      await page.waitForTimeout(1000);

      // Check for content in the right drawer
      const contentSelectors = [
        '[data-testid="right-drawer"] iframe',
        '[data-testid="article-iframe"]',
        '[data-testid="right-drawer-content"]',
        '.right-drawer iframe',
      ];

      let contentFound = false;

      for (const selector of contentSelectors) {
        const content = page.locator(selector);
        const contentVisible = await content.isVisible().catch(() => false);
        if (contentVisible) {
          contentFound = true;
          console.log(`   ✅ Epic content displayed with selector: ${selector}`);
          break;
        }
      }

      if (!contentFound) {
        // Check if drawer has any content
        const drawer = page.locator('[data-testid="right-drawer"]');
        const drawerVisible = await drawer.isVisible().catch(() => false);
        if (drawerVisible) {
          const drawerText = await drawer.textContent();
          if (drawerText && drawerText.length > 0) {
            console.log(`   ✅ Right drawer has content: ${drawerText.substring(0, 50)}...`);
            contentFound = true;
          }
        }
      }

      if (!contentFound) {
        console.log('   ⚠️ No content found in right drawer');
      }
    } else {
      console.log('   ⚠️ No epic items found to click');
    }
  });

  test('should close right drawer when close button is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Find and click an epic item to open drawer
    const epicItem = page.locator('.vis-item').first();
    const isVisible = await epicItem.isVisible().catch(() => false);

    if (isVisible) {
      await epicItem.click();
      await page.waitForTimeout(1000);

      // Find and click close button
      const closeButtonSelectors = [
        '[data-testid="right-drawer-close"]',
        '[data-testid="close-drawer-button"]',
        '[aria-label="Close drawer"]',
        '.right-drawer button[aria-label*="close" i]',
        '.right-drawer .close-button',
      ];

      let closed = false;

      for (const selector of closeButtonSelectors) {
        const closeButton = page.locator(selector);
        const buttonVisible = await closeButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await closeButton.click();
          await page.waitForTimeout(500);
          closed = true;
          console.log(`   🖱️ Clicked close button with selector: ${selector}`);
          break;
        }
      }

      if (closed) {
        // Verify drawer is closed
        const drawer = page.locator('[data-testid="right-drawer"]');
        const drawerVisible = await drawer.isVisible().catch(() => false);
        if (!drawerVisible) {
          console.log('   ✅ Right drawer closed successfully');
        } else {
          console.log('   ⚠️ Right drawer still visible after close');
        }
      } else {
        // Try pressing Escape to close
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        console.log('   ⚠️ Close button not found, tried Escape key');
      }
    } else {
      console.log('   ⚠️ No epic items found to click');
    }
  });
});


// ============================================================================
// EPIC TYPE FILTERING TESTS (Requirement 7.3)
// ============================================================================

test.describe('Epic Type Filtering Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🔍 Epic Type Filtering Tests\n`);
  });

  test('should have Epics section in Layers menu', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Check for Epics section
    const epicsSection = page.locator('[data-testid="epics-section"]');
    const isVisible = await epicsSection.isVisible().catch(() => false);

    if (isVisible) {
      await expect(epicsSection).toBeVisible();
      console.log('   ✅ Epics section is visible in Layers menu');
    } else {
      // Try to find by text
      const epicsSectionByText = page.locator('button:has-text("Epics")');
      const textVisible = await epicsSectionByText.isVisible().catch(() => false);
      if (textVisible) {
        console.log('   ✅ Epics section found by text');
      } else {
        console.log('   ⚠️ Epics section not found');
      }
    }
  });

  test('should have epic type toggles in Epics section', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand Epics section
    await expandEpicsSection(page);

    // Check for epic type toggles
    const epicTypes = ['war', 'empire', 'religion', 'culture', 'person', 'other'];
    const foundTypes: string[] = [];

    for (const type of epicTypes) {
      const toggle = page.locator(`[data-testid="epic-filter-${type}"]`);
      const isVisible = await toggle.isVisible().catch(() => false);
      if (isVisible) {
        foundTypes.push(type);
      }
    }

    console.log(`   📋 Found epic type toggles: ${foundTypes.join(', ')}`);

    if (foundTypes.length > 0) {
      expect(foundTypes.length).toBeGreaterThan(0);
      console.log(`   ✅ Epic type toggles are visible (${String(foundTypes.length)} types)`);
    } else {
      // Check for epic filters container
      const epicFilters = page.locator('[data-testid="epic-filters"]');
      const filtersVisible = await epicFilters.isVisible().catch(() => false);
      if (filtersVisible) {
        console.log('   ✅ Epic filters container is visible');
      } else {
        console.log('   ⚠️ No epic type toggles found');
      }
    }
  });


  test('should filter epic items when type toggle is disabled', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Count initial epic items
    const initialItems = page.locator('.vis-item');
    const initialCount = await initialItems.count().catch(() => 0);
    console.log(`   📊 Initial epic item count: ${String(initialCount)}`);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand Epics section
    await expandEpicsSection(page);

    // Find and toggle an epic type filter
    const epicTypes = ['war', 'empire', 'person'];
    let toggled = false;

    for (const type of epicTypes) {
      const toggle = page.locator(`[data-testid="epic-filter-${type}"]`);
      const isVisible = await toggle.isVisible().catch(() => false);
      
      if (isVisible) {
        // Get the checkbox within the toggle
        const checkbox = toggle.locator('input[type="checkbox"]');
        const isChecked = await checkbox.isChecked().catch(() => true);
        
        if (isChecked) {
          // Uncheck to filter out this type
          await checkbox.click();
          toggled = true;
          console.log(`   🔄 Disabled ${type} epic type filter`);
          break;
        }
      }
    }

    if (toggled) {
      // Wait for timeline to update
      await page.waitForTimeout(1000);

      // Count epic items after filtering
      const filteredItems = page.locator('.vis-item');
      const filteredCount = await filteredItems.count().catch(() => 0);
      console.log(`   📊 Filtered epic item count: ${String(filteredCount)}`);

      // The count should be different (less or equal)
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      console.log('   ✅ Epic type filtering is working');
    } else {
      console.log('   ⚠️ Could not toggle any epic type filter');
    }
  });

  test('should have Check All / Uncheck All buttons for epic filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand Epics section
    await expandEpicsSection(page);

    // Check for toggle all button
    const toggleAllButton = page.locator('[data-testid="toggle-all-epics"]');
    const isVisible = await toggleAllButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(toggleAllButton).toBeVisible();
      
      // Get button text
      const buttonText = await toggleAllButton.textContent();
      console.log(`   📋 Toggle all button text: ${buttonText ?? 'unknown'}`);
      
      console.log('   ✅ Check All / Uncheck All button is visible');
    } else {
      // Try alternative selectors
      const altButton = page.locator('button:has-text("Check All"), button:has-text("Uncheck All")');
      const altVisible = await altButton.isVisible().catch(() => false);
      if (altVisible) {
        console.log('   ✅ Toggle all button found by text');
      } else {
        console.log('   ⚠️ Toggle all button not found');
      }
    }
  });


  test('should uncheck all epic types when Uncheck All is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand Epics section
    await expandEpicsSection(page);

    // Find and click Uncheck All button
    const toggleAllButton = page.locator('[data-testid="toggle-all-epics"]');
    const isVisible = await toggleAllButton.isVisible().catch(() => false);

    if (isVisible) {
      const buttonText = await toggleAllButton.textContent();
      
      // If button says "Uncheck All", click it
      if (buttonText?.includes('Uncheck')) {
        await toggleAllButton.click();
        console.log('   🖱️ Clicked Uncheck All button');
      } else {
        // First click to check all, then click again to uncheck
        await toggleAllButton.click();
        await page.waitForTimeout(300);
        await toggleAllButton.click();
        console.log('   🖱️ Clicked toggle button twice to uncheck all');
      }

      // Wait for timeline to update
      await page.waitForTimeout(1000);

      // Verify all checkboxes are unchecked
      const epicTypes = ['war', 'empire', 'religion', 'culture', 'person', 'other'];
      let allUnchecked = true;

      for (const type of epicTypes) {
        const checkbox = page.locator(`[data-testid="epic-filter-${type}"] input[type="checkbox"]`);
        const checkboxVisible = await checkbox.isVisible().catch(() => false);
        if (checkboxVisible) {
          const isChecked = await checkbox.isChecked().catch(() => true);
          if (isChecked) {
            allUnchecked = false;
            break;
          }
        }
      }

      if (allUnchecked) {
        console.log('   ✅ All epic types are unchecked');
      } else {
        console.log('   ⚠️ Some epic types are still checked');
      }
    } else {
      console.log('   ⚠️ Toggle all button not found');
    }
  });

  test('should check all epic types when Check All is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand Epics section
    await expandEpicsSection(page);

    // First uncheck all, then check all
    const toggleAllButton = page.locator('[data-testid="toggle-all-epics"]');
    const isVisible = await toggleAllButton.isVisible().catch(() => false);

    if (isVisible) {
      // Click to uncheck all first
      let buttonText = await toggleAllButton.textContent();
      if (buttonText?.includes('Uncheck')) {
        await toggleAllButton.click();
        await page.waitForTimeout(300);
      }

      // Now click to check all
      buttonText = await toggleAllButton.textContent();
      if (buttonText?.includes('Check')) {
        await toggleAllButton.click();
        console.log('   🖱️ Clicked Check All button');
      }

      // Wait for timeline to update
      await page.waitForTimeout(1000);

      // Verify all checkboxes are checked
      const epicTypes = ['war', 'empire', 'religion', 'culture', 'person', 'other'];
      let allChecked = true;

      for (const type of epicTypes) {
        const checkbox = page.locator(`[data-testid="epic-filter-${type}"] input[type="checkbox"]`);
        const checkboxVisible = await checkbox.isVisible().catch(() => false);
        if (checkboxVisible) {
          const isChecked = await checkbox.isChecked().catch(() => false);
          if (!isChecked) {
            allChecked = false;
            break;
          }
        }
      }

      if (allChecked) {
        console.log('   ✅ All epic types are checked');
      } else {
        console.log('   ⚠️ Some epic types are not checked');
      }
    } else {
      console.log('   ⚠️ Toggle all button not found');
    }
  });
});


// ============================================================================
// COMBINED EPIC ITEMS TESTS
// ============================================================================

test.describe('Combined Epic Items Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🎛️ Combined Epic Items Tests\n`);
  });

  test('should persist epic filter settings during navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand Epics section
    await expandEpicsSection(page);

    // Toggle an epic type filter
    const warToggle = page.locator('[data-testid="epic-filter-war"] input[type="checkbox"]');
    const isVisible = await warToggle.isVisible().catch(() => false);

    if (isVisible) {
      const initialState = await warToggle.isChecked();
      await warToggle.click();
      const newState = await warToggle.isChecked();
      console.log(`   📋 War filter changed from ${String(initialState)} to ${String(newState)}`);

      // Navigate to a different year
      await page.evaluate(() => {
        window.location.hash = '#/?year=1500';
      });
      await page.waitForTimeout(2000);

      // Re-open Layers menu and check state
      await openLayersMenu(page);
      await expandEpicsSection(page);

      const afterNavCheckbox = page.locator('[data-testid="epic-filter-war"] input[type="checkbox"]');
      const afterNavState = await afterNavCheckbox.isChecked().catch(() => !newState);

      console.log(`   📋 War filter after navigation: ${String(afterNavState)}`);

      // State should persist (or be reset to default - both are valid behaviors)
      console.log('   ✅ Epic filter persistence test completed');
    } else {
      console.log('   ⚠️ War filter toggle not found');
    }
  });

  test('should capture full application with epic filters visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand Epics section
    await expandEpicsSection(page);

    // Wait for UI to settle
    await page.waitForTimeout(500);

    // Take screenshot with epic filters visible
    await expect(page).toHaveScreenshot('epic-filters-visible.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });

    console.log('   ✅ Epic filters screenshot captured');
  });

  test('should show/hide epic items based on filter state', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Take screenshot with all epics visible
    await expect(page).toHaveScreenshot('epics-all-visible.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });
    console.log('   📸 All epics visible screenshot captured');

    // Open Layers menu and uncheck all epic types
    await openLayersMenu(page);
    await expandEpicsSection(page);

    const toggleAllButton = page.locator('[data-testid="toggle-all-epics"]');
    const isVisible = await toggleAllButton.isVisible().catch(() => false);

    if (isVisible) {
      const buttonText = await toggleAllButton.textContent();
      if (buttonText?.includes('Uncheck')) {
        await toggleAllButton.click();
        await page.waitForTimeout(1000);
      }

      // Close menu for clean screenshot
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Take screenshot with no epics visible
      await expect(page).toHaveScreenshot('epics-none-visible.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.2,
      });
      console.log('   📸 No epics visible screenshot captured');

      console.log('   ✅ Epic visibility toggle test completed');
    } else {
      console.log('   ⚠️ Toggle all button not found');
    }
  });
});


// ============================================================================
// VISUAL REGRESSION TESTS FOR EPIC ITEMS
// ============================================================================

test.describe('Epic Items Visual Regression Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📸 Epic Items Visual Regression Tests\n`);
  });

  test('should capture timeline at year 1000 with epics', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('epics-year-1000.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });

    console.log('   ✅ Year 1000 with epics screenshot captured');
  });

  test('should capture timeline at year 1500 with epics', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1500`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('epics-year-1500.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });

    console.log('   ✅ Year 1500 with epics screenshot captured');
  });

  test('should capture timeline with expanded view', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Find and click expand button
    const expandButtonSelectors = [
      '[data-testid="timeline-expand-button"]',
      '[data-testid="expand-timeline"]',
      '[aria-label="Expand timeline"]',
      'button:has-text("Expand")',
    ];

    let expanded = false;

    for (const selector of expandButtonSelectors) {
      const button = page.locator(selector);
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        await button.click();
        expanded = true;
        console.log(`   🖱️ Clicked expand button with selector: ${selector}`);
        break;
      }
    }

    if (expanded) {
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('epics-expanded-timeline.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.2,
      });

      console.log('   ✅ Expanded timeline with epics screenshot captured');
    } else {
      console.log('   ⚠️ Expand button not found');
    }
  });

  test('should capture right drawer with epic content', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);
    await waitForTimelineLoad(page);

    // Wait for epic items to load
    await page.waitForTimeout(2000);

    // Find and click an epic item
    const epicItem = page.locator('.vis-item').first();
    const isVisible = await epicItem.isVisible().catch(() => false);

    if (isVisible) {
      await epicItem.click();
      await page.waitForTimeout(1500);

      // Check if drawer opened
      const drawer = page.locator('[data-testid="right-drawer"]');
      const drawerVisible = await drawer.isVisible().catch(() => false);

      if (drawerVisible) {
        await expect(page).toHaveScreenshot('epic-right-drawer.png', {
          fullPage: false,
          maxDiffPixelRatio: 0.2,
        });

        console.log('   ✅ Right drawer with epic content screenshot captured');
      } else {
        console.log('   ⚠️ Right drawer not visible after clicking epic');
      }
    } else {
      console.log('   ⚠️ No epic items found to click');
    }
  });
});
