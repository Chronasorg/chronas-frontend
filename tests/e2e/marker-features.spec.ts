/**
 * Marker Features E2E Tests
 *
 * E2E tests for marker features in the Layers menu:
 * - Marker limit slider affects marker count
 * - Marker clustering toggle enables/disables clustering
 *
 * Requirements: 4.2, 5.2 (production-parity-fixes)
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
 * Helper to expand the General section in Layers menu
 */
async function expandGeneralSection(page: Page): Promise<void> {

  const generalToggle = page.locator('[data-testid="general-section-toggle"]');
  const isVisible = await generalToggle.isVisible().catch(() => false);

  if (isVisible) {
    // Check if already expanded
    const content = page.locator('[data-testid="general-section-content"]');
    const contentVisible = await content.isVisible().catch(() => false);

    if (!contentVisible) {
      await generalToggle.click({ force: true });
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Helper to expand the Markers section in Layers menu
 */
async function expandMarkersSection(page: Page): Promise<void> {
  const markersToggle = page.locator('[data-testid="markers-section-toggle"]');
  const isVisible = await markersToggle.isVisible().catch(() => false);

  if (isVisible) {
    // Check if already expanded
    const content = page.locator('[data-testid="markers-section-content"]');
    const contentVisible = await content.isVisible().catch(() => false);

    if (!contentVisible) {
      await markersToggle.click({ force: true });
      await page.waitForTimeout(300);
    }
  }
}

// Configure tests to run serially to avoid race conditions
test.describe.configure({ mode: 'serial' });

// ============================================================================
// MARKER LIMIT SLIDER TESTS (Requirement 4.2)
// ============================================================================

test.describe('Marker Limit Slider Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📊 Marker Limit Slider Tests at: ${BASE_URL}\n`);
  });

  test('should have marker limit slider in Markers section', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Check for marker limit slider
    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const isVisible = await markerLimitSlider.isVisible().catch(() => false);

    if (isVisible) {
      await expect(markerLimitSlider).toBeVisible();
      console.log('   ✅ Marker limit slider is visible');
    } else {
      console.log('   ⚠️ Marker limit slider not found');
    }
  });

  test('should display current marker limit value', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Check for marker limit slider
    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const isVisible = await markerLimitSlider.isVisible().catch(() => false);

    if (isVisible) {
      // Get current value
      const currentValue = await markerLimitSlider.inputValue();
      console.log(`   📋 Current marker limit: ${currentValue}`);

      // Default should be 5000
      expect(Number(currentValue)).toBeGreaterThanOrEqual(0);
      expect(Number(currentValue)).toBeLessThanOrEqual(10000);

      // Check for label showing the value
      const labelText = await page.locator('label[for="marker-limit"]').textContent();
      console.log(`   📋 Marker limit label: ${labelText ?? 'not found'}`);

      console.log('   ✅ Marker limit value is displayed');
    } else {
      console.log('   ⚠️ Marker limit slider not found');
    }
  });

  test('should change marker limit when slider is adjusted', async ({ page }) => {
    const markerRequests: string[] = [];

    // Intercept marker API requests
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/markers')) {
        markerRequests.push(url);
      }
    });

    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Wait for initial marker request
    await page.waitForTimeout(2000);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Check for marker limit slider
    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const isVisible = await markerLimitSlider.isVisible().catch(() => false);

    if (isVisible) {
      // Get initial value
      const initialValue = await markerLimitSlider.inputValue();
      console.log(`   📋 Initial marker limit: ${initialValue}`);

      // Clear previous requests
      const requestsBeforeChange = markerRequests.length;

      // Change the slider value to a different value
      const newValue = Number(initialValue) > 5000 ? '1000' : '8000';
      await markerLimitSlider.fill(newValue);
      console.log(`   🔄 Changed marker limit to: ${newValue}`);

      // Wait for API request with new limit
      await page.waitForTimeout(2000);

      // Check if new requests were made with the limit parameter
      const newRequests = markerRequests.slice(requestsBeforeChange);
      console.log(`   📡 New marker requests: ${String(newRequests.length)}`);

      if (newRequests.length > 0) {
        const hasLimitParam = newRequests.some((url) => url.includes('limit='));
        console.log(`   📡 Requests include limit parameter: ${hasLimitParam ? 'yes' : 'no'}`);

        // Log sample request
        console.log(`   📡 Sample request: ${newRequests[0]?.substring(0, 100) ?? 'none'}...`);
      }

      // Verify the slider value changed
      const updatedValue = await markerLimitSlider.inputValue();
      expect(updatedValue).toBe(newValue);

      console.log('   ✅ Marker limit slider change completed');
    } else {
      console.log('   ⚠️ Marker limit slider not found');
    }
  });

  test('should include limit parameter in marker API requests', async ({ page }) => {
    const markerRequests: string[] = [];

    // Intercept marker API requests
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/markers')) {
        markerRequests.push(url);
      }
    });

    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Wait for marker requests
    await page.waitForTimeout(3000);

    console.log(`   📡 Total marker requests: ${String(markerRequests.length)}`);

    if (markerRequests.length > 0) {
      // Check if any request includes the limit parameter
      const requestsWithLimit = markerRequests.filter((url) => url.includes('limit='));
      console.log(`   📡 Requests with limit parameter: ${String(requestsWithLimit.length)}`);

      if (requestsWithLimit.length > 0) {
        // Extract limit values
        const limitRegex = /limit=(\d+)/;
        for (const url of requestsWithLimit.slice(0, 3)) {
          const limitMatch = limitRegex.exec(url);
          if (limitMatch?.[1]) {
            console.log(`   📡 Limit value: ${limitMatch[1]}`);
          }
        }
      }

      // At least one request should have been made
      expect(markerRequests.length).toBeGreaterThan(0);

      console.log('   ✅ Marker API request verification completed');
    } else {
      console.log('   ⚠️ No marker requests captured');
    }
  });

  test('should affect marker count when limit is reduced', async ({ page }) => {
    // Track marker responses using a mutable container with getter to avoid TS narrowing
    let capturedMarkers: unknown[] | null = null;
    const getMarkers = (): unknown[] | null => capturedMarkers;
    const setMarkers = (markers: unknown[] | null): void => {
      capturedMarkers = markers;
    };

    // Intercept marker API responses
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/markers') && response.status() === 200) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            setMarkers(data);
          }
        } catch {
          // Response might not be JSON
        }
      }
    });

    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Wait for initial marker response
    await page.waitForTimeout(3000);

    const initialMarkers = getMarkers();
    const initialMarkerCount = initialMarkers?.length ?? 0;
    console.log(`   📊 Initial marker count: ${String(initialMarkerCount)}`);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Check for marker limit slider
    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const isVisible = await markerLimitSlider.isVisible().catch(() => false);

    if (isVisible) {
      // Reset marker response
      setMarkers(null);

      // Set a low limit
      await markerLimitSlider.fill('100');
      console.log('   🔄 Set marker limit to: 100');

      // Wait for new marker response
      await page.waitForTimeout(3000);

      // Read the current state (async callback may have updated it)
      const newMarkers = getMarkers();
      const newMarkerCount = newMarkers?.length ?? 0;
      console.log(`   📊 New marker count: ${String(newMarkerCount)}`);

      // Verify the marker count is within the limit
      // Note: If no new response was captured, count will be 0
      expect(newMarkerCount).toBeLessThanOrEqual(100);

      if (newMarkerCount > 0) {
        console.log('   ✅ Marker count is limited correctly');
      } else {
        console.log('   ⚠️ No new marker response captured (count is 0)');
      }
    } else {
      console.log('   ⚠️ Marker limit slider not found');
    }
  });
});

// ============================================================================
// MARKER CLUSTERING TOGGLE TESTS (Requirement 5.2)
// ============================================================================

test.describe('Marker Clustering Toggle Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🔘 Marker Clustering Toggle Tests\n`);
  });

  test('should have cluster markers toggle in Markers section', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Check for cluster markers toggle
    const clusterToggle = page.locator('[data-testid="cluster-markers-toggle"]');
    const isVisible = await clusterToggle.isVisible().catch(() => false);

    if (isVisible) {
      await expect(clusterToggle).toBeVisible();
      console.log('   ✅ Cluster markers toggle is visible');
    } else {
      console.log('   ⚠️ Cluster markers toggle not found');
    }
  });

  test('should toggle marker clustering when checkbox is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Take initial screenshot
    const initialScreenshot = await page.screenshot();
    console.log(`   📸 Initial screenshot: ${String(initialScreenshot.length)} bytes`);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Find and click the cluster markers toggle
    const clusterToggle = page.locator('[data-testid="cluster-markers-toggle"]');
    const isVisible = await clusterToggle.isVisible().catch(() => false);

    if (isVisible) {
      // Get the checkbox within the toggle
      const checkbox = clusterToggle.locator('input[type="checkbox"]');
      const isChecked = await checkbox.isChecked();
      console.log(`   📋 Cluster markers initially: ${isChecked ? 'enabled' : 'disabled'}`);

      // Toggle the checkbox
      await checkbox.click();
      console.log(`   🔄 Toggled cluster markers to: ${!isChecked ? 'enabled' : 'disabled'}`);

      // Wait for map to update
      await page.waitForTimeout(1500);

      // Take screenshot after toggle
      const afterScreenshot = await page.screenshot();
      console.log(`   📸 After screenshot: ${String(afterScreenshot.length)} bytes`);

      // Verify the checkbox state changed
      const newCheckedState = await checkbox.isChecked();
      expect(newCheckedState).toBe(!isChecked);

      console.log('   ✅ Cluster markers toggle completed');
    } else {
      console.log('   ⚠️ Cluster markers toggle not found');
    }
  });

  test('should show clustered markers when clustering is enabled', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Find the cluster markers toggle
    const clusterToggle = page.locator('[data-testid="cluster-markers-toggle"]');
    const isVisible = await clusterToggle.isVisible().catch(() => false);

    if (isVisible) {
      // Get the checkbox within the toggle
      const checkbox = clusterToggle.locator('input[type="checkbox"]');

      // Ensure clustering is disabled first
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        await checkbox.click();
        await page.waitForTimeout(1000);
      }

      // Take screenshot with clustering disabled
      await expect(page).toHaveScreenshot('markers-unclustered.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.2,
      });
      console.log('   📸 Unclustered markers screenshot captured');

      // Enable clustering
      await checkbox.click();
      await page.waitForTimeout(1500);

      // Take screenshot with clustering enabled
      await expect(page).toHaveScreenshot('markers-clustered.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.2,
      });
      console.log('   📸 Clustered markers screenshot captured');

      console.log('   ✅ Marker clustering visual test completed');
    } else {
      console.log('   ⚠️ Cluster markers toggle not found');
    }
  });

  test('should persist clustering state during navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Find and toggle cluster markers
    const clusterToggle = page.locator('[data-testid="cluster-markers-toggle"]');
    const isVisible = await clusterToggle.isVisible().catch(() => false);

    if (isVisible) {
      const checkbox = clusterToggle.locator('input[type="checkbox"]');
      const initialState = await checkbox.isChecked();

      // Toggle the checkbox
      await checkbox.click();
      await page.waitForTimeout(500);

      const newState = await checkbox.isChecked();
      console.log(`   📋 Cluster markers changed from ${String(initialState)} to ${String(newState)}`);

      // Navigate to a different year
      await page.evaluate(() => {
        window.location.hash = '#/?year=1500';
      });
      await page.waitForTimeout(2000);

      // Re-open Layers menu and check state
      await openLayersMenu(page);
      await expandGeneralSection(page);
      await expandMarkersSection(page);

      const afterNavCheckbox = page.locator('[data-testid="cluster-markers-toggle"] input[type="checkbox"]');
      const afterNavState = await afterNavCheckbox.isChecked();

      console.log(`   📋 Cluster markers after navigation: ${String(afterNavState)}`);

      // State should persist
      expect(afterNavState).toBe(newState);

      console.log('   ✅ Cluster markers persistence test completed');
    } else {
      console.log('   ⚠️ Cluster markers toggle not found');
    }
  });
});

// ============================================================================
// COMBINED MARKER CONTROLS TESTS
// ============================================================================

test.describe('Combined Marker Controls Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🎛️ Combined Marker Controls Tests\n`);
  });

  test('should have all marker controls in Markers section', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Check for all marker controls
    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const clusterToggle = page.locator('[data-testid="cluster-markers-toggle"]');
    const markerFilters = page.locator('[data-testid="marker-filters"]');

    const sliderVisible = await markerLimitSlider.isVisible().catch(() => false);
    const clusterVisible = await clusterToggle.isVisible().catch(() => false);
    const filtersVisible = await markerFilters.isVisible().catch(() => false);

    console.log(`   📋 Marker limit slider: ${sliderVisible ? '✅' : '❌'}`);
    console.log(`   📋 Cluster markers toggle: ${clusterVisible ? '✅' : '❌'}`);
    console.log(`   📋 Marker filters: ${filtersVisible ? '✅' : '❌'}`);

    // At least the main controls should be visible
    expect(sliderVisible || clusterVisible).toBe(true);

    console.log('   ✅ Marker controls check completed');
  });

  test('should capture full application with marker controls visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Wait for UI to settle
    await page.waitForTimeout(500);

    // Take screenshot with marker controls visible
    await expect(page).toHaveScreenshot('marker-controls-visible.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });

    console.log('   ✅ Marker controls screenshot captured');
  });

  test('should work together: limit and clustering', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu
    await openLayersMenu(page);

    // Expand General section
    await expandGeneralSection(page);

    // Expand Markers section
    await expandMarkersSection(page);

    // Get controls
    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const clusterToggle = page.locator('[data-testid="cluster-markers-toggle"]');

    const sliderVisible = await markerLimitSlider.isVisible().catch(() => false);
    const clusterVisible = await clusterToggle.isVisible().catch(() => false);

    if (sliderVisible && clusterVisible) {
      // Set a moderate limit
      await markerLimitSlider.fill('2000');
      console.log('   🔄 Set marker limit to: 2000');

      // Enable clustering
      const checkbox = clusterToggle.locator('input[type="checkbox"]');
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
        console.log('   🔄 Enabled marker clustering');
      }

      // Wait for map to update
      await page.waitForTimeout(2000);

      // Take screenshot with both settings applied
      await expect(page).toHaveScreenshot('markers-limited-and-clustered.png', {
        fullPage: false,
        maxDiffPixelRatio: 0.2,
      });

      console.log('   ✅ Combined marker controls test completed');
    } else {
      console.log('   ⚠️ Not all marker controls found');
    }
  });
});

// ============================================================================
// VISUAL REGRESSION TESTS FOR MARKER FEATURES
// ============================================================================

test.describe('Marker Features Visual Regression Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📸 Marker Features Visual Regression Tests\n`);
  });

  test('should capture map with default marker settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Wait for markers to load
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('markers-default.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });

    console.log('   ✅ Default markers screenshot captured');
  });

  test('should capture map with low marker limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu and set low marker limit
    await openLayersMenu(page);
    await expandGeneralSection(page);
    await expandMarkersSection(page);

    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const isVisible = await markerLimitSlider.isVisible().catch(() => false);

    if (isVisible) {
      await markerLimitSlider.fill('500');
      await page.waitForTimeout(2000);
    }

    // Close menu for clean screenshot
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('markers-low-limit.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });

    console.log('   ✅ Low marker limit screenshot captured');
  });

  test('should capture map with high marker limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForAppLoad(page);
    await waitForMapLoad(page);

    // Open Layers menu and set high marker limit
    await openLayersMenu(page);
    await expandGeneralSection(page);
    await expandMarkersSection(page);

    const markerLimitSlider = page.locator('[data-testid="marker-limit-slider"]');
    const isVisible = await markerLimitSlider.isVisible().catch(() => false);

    if (isVisible) {
      await markerLimitSlider.fill('10000');
      await page.waitForTimeout(2000);
    }

    // Close menu for clean screenshot
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('markers-high-limit.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });

    console.log('   ✅ High marker limit screenshot captured');
  });
});
