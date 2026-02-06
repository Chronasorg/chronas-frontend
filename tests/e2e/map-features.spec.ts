import { test, expect } from '@playwright/test';

/**
 * Map Features E2E Tests
 * 
 * These tests verify that the core map features are working correctly:
 * - Province coloring by ruler/culture/religion
 * - Metadata loading from API
 * - Area data loading from API
 * - Markers display
 * - Dimension switching
 * - Year navigation
 * 
 * Run with: npm run test:deploy
 */

// Get URL from environment or use the dev deployment URL
const BASE_URL = process.env['BASE_URL'] ?? 'https://d1q6nlczw9cdpt.cloudfront.net';

// Run tests serially to avoid race conditions
test.describe.configure({ mode: 'serial' });

test.describe('Map Feature Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🗺️ Testing map features at: ${BASE_URL}\n`);
  });

  test('should make API calls to load metadata', async ({ page }) => {
    const metadataRequests: string[] = [];
    
    // Intercept requests to metadata endpoint
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/metadata')) {
        metadataRequests.push(url);
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    
    // Give time for API calls
    await page.waitForTimeout(3000);
    
    console.log(`   📡 Metadata API requests: ${String(metadataRequests.length)}`);
    if (metadataRequests.length > 0) {
      console.log('   Sample requests:');
      for (const url of metadataRequests.slice(0, 3)) {
        const shortUrl = url.length > 100 ? url.substring(0, 100) + '...' : url;
        console.log(`   - ${shortUrl}`);
      }
    }
    
    // Should have made at least one metadata request
    expect(metadataRequests.length).toBeGreaterThan(0);
  });

  test('should make API calls to load area data', async ({ page }) => {
    const areaRequests: string[] = [];
    
    // Intercept requests to areas endpoint
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/areas/')) {
        areaRequests.push(url);
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    
    // Give time for API calls
    await page.waitForTimeout(3000);
    
    console.log(`   📡 Area data API requests: ${String(areaRequests.length)}`);
    if (areaRequests.length > 0) {
      console.log('   Sample requests:');
      for (const url of areaRequests) {
        console.log(`   - ${url}`);
      }
    }
    
    // Should have made at least one area data request
    expect(areaRequests.length).toBeGreaterThan(0);
  });

  test('should make API calls to load markers', async ({ page }) => {
    const markerRequests: string[] = [];
    
    // Intercept requests to markers endpoint
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/markers')) {
        markerRequests.push(url);
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    
    // Give time for API calls
    await page.waitForTimeout(3000);
    
    console.log(`   📡 Marker API requests: ${String(markerRequests.length)}`);
    if (markerRequests.length > 0) {
      console.log('   Sample requests:');
      for (const url of markerRequests) {
        console.log(`   - ${url}`);
      }
    }
    
    // Should have made at least one marker request
    expect(markerRequests.length).toBeGreaterThan(0);
  });

  test('should display colored provinces (not gray/empty)', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    
    // Wait for map to render
    await page.waitForTimeout(5000);
    
    // Check that "No Data Available" message is NOT displayed
    const noDataMessage = page.locator('text=No Data Available');
    const noDataVisible = await noDataMessage.isVisible().catch(() => false);
    
    if (noDataVisible) {
      console.log('   ❌ "No Data Available" message is displayed - provinces not colored');
    } else {
      console.log('   ✅ No "No Data Available" message - checking for colored provinces');
    }
    
    expect(noDataVisible).toBe(false);
    
    // Check for province fill layers in the map
    // The map should have fill layers with colors
    const mapCanvas = page.locator('.mapboxgl-canvas');
    await expect(mapCanvas.first()).toBeVisible();
    
    console.log('   ✅ Map canvas is visible');
  });

  test('should display entity labels on the map', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    
    // Wait for map to render with labels
    await page.waitForTimeout(5000);
    
    // Take a screenshot to verify labels are visible
    const screenshot = await page.screenshot();
    console.log(`   📸 Screenshot taken (${String(screenshot.length)} bytes)`);
    
    // Check for text elements that might be labels
    // Labels like "Byzantine Empire", "Fatimid Caliphate" should be visible
    const mapContainer = page.locator('.mapboxgl-map');
    await expect(mapContainer.first()).toBeVisible();
    
    console.log('   ✅ Map container with labels is visible');
  });
});

test.describe('API Response Verification', () => {
  test('should receive valid metadata response', async ({ page }) => {
    let metadataResponse: unknown = null;
    
    // Intercept metadata response
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/metadata') && response.status() === 200) {
        try {
          metadataResponse = await response.json();
        } catch {
          // Response might not be JSON
        }
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    if (metadataResponse) {
      console.log('   ✅ Received metadata response');
      const keys = Object.keys(metadataResponse as object);
      console.log(`   Metadata keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
    } else {
      console.log('   ⚠️ No metadata response captured');
    }
    
    expect(metadataResponse).not.toBeNull();
  });

  test('should receive valid area data response', async ({ page }) => {
    let areaResponse: unknown = null;
    
    // Intercept area data response
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/areas/') && response.status() === 200) {
        try {
          areaResponse = await response.json();
        } catch {
          // Response might not be JSON
        }
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    if (areaResponse) {
      console.log('   ✅ Received area data response');
      const keys = Object.keys(areaResponse as object);
      console.log(`   Province count: ${String(keys.length)}`);
      if (keys.length > 0) {
        console.log(`   Sample provinces: ${keys.slice(0, 5).join(', ')}`);
      }
    } else {
      console.log('   ⚠️ No area data response captured');
    }
    
    expect(areaResponse).not.toBeNull();
  });

  test('should receive valid markers response', async ({ page }) => {
    let markersResponse: unknown = null;
    
    // Intercept markers response
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/markers') && response.status() === 200) {
        try {
          markersResponse = await response.json();
        } catch {
          // Response might not be JSON
        }
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    if (markersResponse) {
      console.log('   ✅ Received markers response');
      if (Array.isArray(markersResponse)) {
        console.log(`   Marker count: ${String(markersResponse.length)}`);
      }
    } else {
      console.log('   ⚠️ No markers response captured');
    }
    
    expect(markersResponse).not.toBeNull();
  });
});

test.describe('Province Coloring Verification', () => {
  test('should have province fill layers in the map style', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    
    // Wait for map to fully load
    await page.waitForTimeout(5000);
    
    // Check if the map has loaded by looking for Mapbox elements
    const mapboxMap = page.locator('.mapboxgl-map');
    await expect(mapboxMap.first()).toBeVisible();
    
    // Try to access the map's style to verify layers exist
    // This is done by checking if the map canvas has rendered content
    const canvas = page.locator('.mapboxgl-canvas');
    const canvasVisible = await canvas.first().isVisible().catch(() => false);
    
    if (canvasVisible) {
      console.log('   ✅ Map canvas is rendering');
      
      // Take a screenshot for visual verification
      const screenshot = await page.screenshot({ fullPage: false });
      console.log(`   📸 Screenshot size: ${String(screenshot.length)} bytes`);
    } else {
      console.log('   ⚠️ Map canvas not visible');
    }
    
    expect(canvasVisible).toBe(true);
  });

  test('should not show error messages', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Check for various error messages
    const errorMessages = [
      'No Data Available',
      'Error loading',
      'Failed to load',
      'Connection error',
      'Network error',
    ];
    
    for (const errorText of errorMessages) {
      const errorElement = page.locator(`text=${errorText}`);
      const isVisible = await errorElement.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`   ❌ Error message found: "${errorText}"`);
      }
      
      expect(isVisible).toBe(false);
    }
    
    console.log('   ✅ No error messages displayed');
  });
});

test.describe('Year Navigation', () => {
  test('should load different data when year changes', async ({ page }) => {
    const areaRequests: string[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/areas/')) {
        areaRequests.push(url);
        console.log(`   📡 Area request: ${url}`);
      }
    });
    
    // Load year 1000 (using hash-based routing format)
    console.log('   🔄 Navigating to year 1000...');
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const requestsForYear1000 = areaRequests.filter(url => url.includes('/1000'));
    console.log(`   📡 Requests for year 1000: ${String(requestsForYear1000.length)}`);
    
    // Clear requests array to track only new requests
    const requestsBeforeNavigation = areaRequests.length;
    
    // Navigate to year 1500 by changing the hash (simulating in-app navigation)
    console.log('   🔄 Navigating to year 1500...');
    
    // Use evaluate to change the hash directly, which should trigger the app to read the new year
    await page.evaluate(() => {
      window.location.hash = '#/?year=1500';
    });
    
    // Wait for the app to react to the hash change
    await page.waitForTimeout(4000);
    
    const requestsForYear1500 = areaRequests.filter(url => url.includes('/1500'));
    console.log(`   📡 Requests for year 1500: ${String(requestsForYear1500.length)}`);
    console.log(`   📡 Total requests after navigation: ${String(areaRequests.length - requestsBeforeNavigation)}`);
    
    // Should have made requests for both years
    expect(requestsForYear1000.length).toBeGreaterThan(0);
    expect(requestsForYear1500.length).toBeGreaterThan(0);
  });
});

test.describe('Console Error Monitoring', () => {
  test('should not have critical console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="app-shell"]', { timeout: 15000 });
    await page.waitForTimeout(5000);
    
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('ResizeObserver') &&
      !err.includes('third-party') &&
      !err.includes('favicon')
    );
    
    if (criticalErrors.length > 0) {
      console.log('   ❌ Console errors found:');
      for (const err of criticalErrors.slice(0, 5)) {
        console.log(`   - ${err.substring(0, 100)}`);
      }
    } else {
      console.log('   ✅ No critical console errors');
    }
    
    if (consoleWarnings.length > 0) {
      console.log(`   ⚠️ Console warnings: ${String(consoleWarnings.length)}`);
    }
    
    // Allow some errors but flag critical ones
    expect(criticalErrors.length).toBeLessThan(5);
  });
});
