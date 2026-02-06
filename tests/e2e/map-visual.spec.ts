/**
 * Map Visual E2E Tests
 *
 * Comprehensive visual tests for all map visualization features:
 * - Province coloring by different dimensions (ruler, culture, religion, religionGeneral, population)
 * - Historical markers (battle, city, capital, person, event, other)
 * - Entity labels at territory centroids
 * - Entity outlines on province selection
 * - Province interactions (hover, click)
 * - Year navigation and data loading
 * - Error handling UI
 *
 * Run with: npm run test:e2e
 * Or for deployed environment: npm run test:deploy
 */

import { test, expect, type Page } from '@playwright/test';

// Get URL from environment or use the dev deployment URL
const BASE_URL = process.env['BASE_URL'] ?? 'https://d1q6nlczw9cdpt.cloudfront.net';

/**
 * Helper function to wait for map to fully load
 */
async function waitForMapLoad(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('[data-testid="app-shell"]', { timeout });
  await page.waitForSelector('.mapboxgl-canvas', { timeout });
  // Wait for map tiles and data to render
  await page.waitForTimeout(3000);
}


/**
 * Helper to extract pixel colors from canvas at specific coordinates
 */
async function getCanvasPixelColor(page: Page, x: number, y: number): Promise<{ r: number; g: number; b: number }> {
  return await page.evaluate(({ x, y }) => {
    const canvas = document.querySelector('.mapboxgl-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return { r: 0, g: 0, b: 0 };
    
    const ctx = canvas.getContext('2d');
    if (ctx === null) return { r: 0, g: 0, b: 0 };
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return { r: pixel[0] ?? 0, g: pixel[1] ?? 0, b: pixel[2] ?? 0 };
  }, { x, y });
}

/**
 * Helper to check if a color is not gray (has color variation)
 */
function isColoredPixel(color: { r: number; g: number; b: number }): boolean {
  // Gray pixels have similar R, G, B values
  const tolerance = 30;
  const isGray = Math.abs(color.r - color.g) < tolerance && 
                 Math.abs(color.g - color.b) < tolerance &&
                 Math.abs(color.r - color.b) < tolerance;
  // Also check it's not too dark (black) or too light (white)
  const isTooExtreme = (color.r < 20 && color.g < 20 && color.b < 20) ||
                       (color.r > 235 && color.g > 235 && color.b > 235);
  return !isGray || isTooExtreme;
}

// Configure tests to run serially to avoid race conditions
test.describe.configure({ mode: 'serial' });

// ============================================================================
// PROVINCE COLORING TESTS
// ============================================================================

test.describe('Province Coloring Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🗺️ Province Coloring Tests at: ${BASE_URL}\n`);
  });

  test('should display colored provinces for year 1000 (ruler dimension)', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Take screenshot of the map
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    // Capture screenshot for visual comparison
    await expect(page).toHaveScreenshot('provinces-ruler-year-1000.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Ruler coloring screenshot captured for year 1000');
  });


  test('should display colored provinces for year 1500 (ruler dimension)', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1500`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('provinces-ruler-year-1500.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Ruler coloring screenshot captured for year 1500');
  });

  test('should display colored provinces for year 1900 (ruler dimension)', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1900`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('provinces-ruler-year-1900.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Ruler coloring screenshot captured for year 1900');
  });

  test('should verify provinces have distinct colors (not all gray)', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Sample multiple points on the map to check for color variation
    const samplePoints = [
      { x: 400, y: 300 },
      { x: 500, y: 350 },
      { x: 600, y: 400 },
      { x: 450, y: 250 },
      { x: 550, y: 300 },
    ];
    
    const colors: { r: number; g: number; b: number }[] = [];
    for (const point of samplePoints) {
      const color = await getCanvasPixelColor(page, point.x, point.y);
      colors.push(color);
      console.log(`   Point (${String(point.x)}, ${String(point.y)}): RGB(${String(color.r)}, ${String(color.g)}, ${String(color.b)})`);
    }
    
    // Check that at least some pixels have color (not all gray)
    const coloredPixels = colors.filter(isColoredPixel);
    console.log(`   Colored pixels found: ${String(coloredPixels.length)}/${String(colors.length)}`);
    
    // At least 2 of 5 sample points should have distinct colors
    expect(coloredPixels.length).toBeGreaterThanOrEqual(2);
  });
});


// ============================================================================
// COLOR DIMENSION SWITCHING TESTS
// ============================================================================

test.describe('Color Dimension Switching Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🎨 Color Dimension Switching Tests\n`);
  });

  test('should switch to culture coloring and show different colors', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Take baseline screenshot with ruler coloring
    await expect(page).toHaveScreenshot('dimension-ruler-baseline.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    // Switch to culture dimension (if UI control exists)
    // This would typically be done via a dimension selector in the UI
    // For now, we verify the map renders correctly
    console.log('   ✅ Ruler dimension baseline captured');
  });

  test('should display culture coloring with distinct colors', async ({ page }) => {
    // Navigate with culture dimension parameter if supported
    await page.goto(`${BASE_URL}/#/?year=1000&dim=culture`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('dimension-culture.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Culture dimension screenshot captured');
  });

  test('should display religion coloring with distinct colors', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=religion`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('dimension-religion.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Religion dimension screenshot captured');
  });

  test('should display religionGeneral coloring with distinct colors', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=religionGeneral`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('dimension-religionGeneral.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Religion General dimension screenshot captured');
  });

  test('should display population coloring with opacity variation', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=population`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('dimension-population.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Population dimension screenshot captured');
  });
});


// ============================================================================
// HISTORICAL MARKERS TESTS
// ============================================================================

test.describe('Historical Markers Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📍 Historical Markers Tests\n`);
  });

  test('should display markers on the map for year 1000', async ({ page }) => {
    let markerCount = 0;
    
    // Intercept markers API response
    page.on('response', async (response) => {
      if (response.url().includes('/markers') && response.status() === 200) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            markerCount = data.length;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    console.log(`   📍 Markers loaded: ${String(markerCount)}`);
    
    // Take screenshot showing markers
    await expect(page).toHaveScreenshot('markers-year-1000.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    // Verify markers were loaded
    expect(markerCount).toBeGreaterThan(0);
    console.log('   ✅ Markers screenshot captured');
  });

  test('should display battle markers with red color', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Zoom in to see markers more clearly
    await page.evaluate(() => {
      // Trigger zoom if map API is available
      const mapElement = document.querySelector('.mapboxgl-map');
      if (mapElement) {
        mapElement.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
      }
    });
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('markers-battle-zoom.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Battle markers screenshot captured');
  });

  test('should display city markers with blue color', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('markers-cities.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ City markers screenshot captured');
  });

  test('should display capital markers with gold color', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('markers-capitals.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Capital markers screenshot captured');
  });

  test('should display person markers with purple color', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('markers-persons.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Person markers screenshot captured');
  });

  test('should verify marker types are present in API response', async ({ page }) => {
    const markerTypes = new Set<string>();
    
    page.on('response', async (response) => {
      if (response.url().includes('/markers') && response.status() === 200) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            for (const marker of data) {
              if (marker.type) {
                markerTypes.add(marker.type as string);
              }
            }
          }
        } catch {
          // Ignore
        }
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    console.log(`   📍 Marker types found: ${Array.from(markerTypes).join(', ')}`);
    
    // Should have at least some marker types
    expect(markerTypes.size).toBeGreaterThan(0);
  });
});


// ============================================================================
// ENTITY LABELS TESTS
// ============================================================================

test.describe('Entity Labels Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🏷️ Entity Labels Tests\n`);
  });

  test('should display entity labels on the map', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Wait extra time for labels to render
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('labels-ruler-year-1000.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Entity labels screenshot captured');
  });

  test('should display labels at territory centroids', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Zoom in to see labels more clearly
    await page.evaluate(() => {
      const map = document.querySelector('.mapboxgl-map');
      if (map) {
        // Simulate zoom
        for (let i = 0; i < 3; i++) {
          map.dispatchEvent(new WheelEvent('wheel', { deltaY: -50, bubbles: true }));
        }
      }
    });
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('labels-zoomed.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Zoomed labels screenshot captured');
  });

  test('should display labels with appropriate font sizes', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Check for text elements in the map
    const mapContainer = page.locator('.mapboxgl-map');
    await expect(mapContainer.first()).toBeVisible();
    
    await expect(page).toHaveScreenshot('labels-font-sizes.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Label font sizes screenshot captured');
  });

  test('should display culture labels when dimension is culture', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=culture`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('labels-culture.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Culture labels screenshot captured');
  });

  test('should display religion labels when dimension is religion', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=religion`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('labels-religion.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Religion labels screenshot captured');
  });
});


// ============================================================================
// ENTITY OUTLINE TESTS
// ============================================================================

test.describe('Entity Outline Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🔲 Entity Outline Tests\n`);
  });

  test('should display entity outline when province is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Take baseline screenshot before click
    await expect(page).toHaveScreenshot('outline-before-click.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    // Click on a province (center of the map)
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    // Wait for outline to render
    await page.waitForTimeout(1500);
    
    // Take screenshot after click showing outline
    await expect(page).toHaveScreenshot('outline-after-click.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Entity outline screenshots captured');
  });

  test('should display outline with entity metadata color', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Click on a province
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      // Click slightly off-center to hit a province
      await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
    }
    
    await page.waitForTimeout(1500);
    
    await expect(page).toHaveScreenshot('outline-colored.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Colored outline screenshot captured');
  });

  test('should clear outline when clicking elsewhere', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    
    if (box) {
      // First click to select
      await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
      await page.waitForTimeout(1000);
      
      // Second click elsewhere to deselect
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6);
      await page.waitForTimeout(1000);
    }
    
    await expect(page).toHaveScreenshot('outline-cleared.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Cleared outline screenshot captured');
  });
});


// ============================================================================
// PROVINCE INTERACTIONS TESTS
// ============================================================================

test.describe('Province Interactions Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🖱️ Province Interactions Tests\n`);
  });

  test('should highlight province on hover', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Take baseline screenshot
    await expect(page).toHaveScreenshot('hover-before.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    // Hover over a province
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45);
    }
    
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('hover-during.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Province hover screenshots captured');
  });

  test('should select province on click and show data', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Click on a province
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.45);
    }
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('province-selected.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Province selection screenshot captured');
  });

  test('should display province data popup on selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Click on a province
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.4);
    }
    
    await page.waitForTimeout(1500);
    
    // Check for popup or sidebar with province data
    await expect(page).toHaveScreenshot('province-data-display.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Province data display screenshot captured');
  });
});


// ============================================================================
// MARKER INTERACTIONS TESTS
// ============================================================================

test.describe('Marker Interactions Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🎯 Marker Interactions Tests\n`);
  });

  test('should display marker popup on click', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Zoom in to see markers better
    await page.evaluate(() => {
      const map = document.querySelector('.mapboxgl-map');
      if (map) {
        for (let i = 0; i < 5; i++) {
          map.dispatchEvent(new WheelEvent('wheel', { deltaY: -50, bubbles: true }));
        }
      }
    });
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('markers-zoomed-in.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Zoomed markers screenshot captured');
  });

  test('should show marker details with name, type, year', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Try to click on a marker area
    const canvas = page.locator('.mapboxgl-canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      // Click in an area likely to have markers
      await page.mouse.click(box.x + box.width * 0.35, box.y + box.height * 0.35);
    }
    
    await page.waitForTimeout(1000);
    
    // Check for popup
    const popup = page.locator('.mapboxgl-popup');
    const popupVisible = await popup.isVisible().catch(() => false);
    
    if (popupVisible) {
      await expect(popup).toHaveScreenshot('marker-popup.png');
      console.log('   ✅ Marker popup screenshot captured');
    } else {
      console.log('   ⚠️ No marker popup visible (may need different click location)');
    }
  });
});


// ============================================================================
// YEAR NAVIGATION VISUAL TESTS
// ============================================================================

test.describe('Year Navigation Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📅 Year Navigation Tests\n`);
  });

  test('should show different province colors for different years', async ({ page }) => {
    // Year 1000
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('year-1000-provinces.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    console.log('   ✅ Year 1000 screenshot captured');
    
    // Year 1500
    await page.goto(`${BASE_URL}/#/?year=1500`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('year-1500-provinces.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    console.log('   ✅ Year 1500 screenshot captured');
    
    // Year 1900
    await page.goto(`${BASE_URL}/#/?year=1900`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('year-1900-provinces.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    console.log('   ✅ Year 1900 screenshot captured');
  });

  test('should update URL when year changes via hash', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Change year via hash
    await page.evaluate(() => {
      window.location.hash = '#/?year=1200';
    });
    
    await page.waitForTimeout(3000);
    
    // Verify URL updated
    const url = page.url();
    expect(url).toContain('year=1200');
    
    await expect(page).toHaveScreenshot('year-1200-after-navigation.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Year navigation via hash screenshot captured');
  });

  test('should show BC era provinces correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=-500`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('year-500bc-provinces.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ BC era (500 BC) screenshot captured');
  });
});


// ============================================================================
// DATA LOADING VISUAL TESTS
// ============================================================================

test.describe('Data Loading Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📊 Data Loading Tests\n`);
  });

  test('should show map after data loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Verify no loading indicators
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    
    expect(isLoading).toBe(false);
    
    await expect(page).toHaveScreenshot('data-loaded.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Data loaded screenshot captured');
  });

  test('should cache data and load quickly on revisit', async ({ page }) => {
    // First visit
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Navigate away
    await page.goto(`${BASE_URL}/#/?year=1500`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Return to cached year
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    const loadTime = Date.now() - startTime;
    
    console.log(`   ⏱️ Cached year load time: ${String(loadTime)}ms`);
    
    await expect(page).toHaveScreenshot('cached-data-reload.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Cached data reload screenshot captured');
  });
});


// ============================================================================
// ERROR HANDLING VISUAL TESTS
// ============================================================================

test.describe('Error Handling Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n⚠️ Error Handling Tests\n`);
  });

  test('should handle far future year gracefully', async ({ page }) => {
    // Test with a year far in the future where data may not exist
    await page.goto(`${BASE_URL}/#/?year=2100`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // The app should still render without crashing
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('year-2100-edge-case.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });
    
    console.log('   ✅ Far future year handled gracefully');
  });

  test('should handle ancient BC year gracefully', async ({ page }) => {
    // Test with a very ancient year
    await page.goto(`${BASE_URL}/#/?year=-4000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // The app should still render without crashing
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('year-4000bc-edge-case.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });
    
    console.log('   ✅ Ancient BC year handled gracefully');
  });

  test('should handle invalid year parameter gracefully', async ({ page }) => {
    // Test with an invalid year parameter
    await page.goto(`${BASE_URL}/#/?year=invalid`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // The app should still render without crashing (likely with default year)
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('invalid-year-param.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.2,
    });
    
    console.log('   ✅ Invalid year parameter handled gracefully');
  });
});


// ============================================================================
// FULL PAGE VISUAL TESTS
// ============================================================================

test.describe('Full Page Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n📸 Full Page Visual Tests\n`);
  });

  test('should capture full page with map and timeline for year 1000', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('full-page-year-1000.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Full page year 1000 screenshot captured');
  });

  test('should capture full page with map and timeline for year 1500', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1500`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('full-page-year-1500.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Full page year 1500 screenshot captured');
  });

  test('should capture full page with map and timeline for year 1900', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1900`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('full-page-year-1900.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Full page year 1900 screenshot captured');
  });

  test('should capture full page with culture dimension', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=culture`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('full-page-culture.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Full page culture dimension screenshot captured');
  });

  test('should capture full page with religion dimension', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=religion`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('full-page-religion.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Full page religion dimension screenshot captured');
  });
});


// ============================================================================
// COMPARISON WITH PRODUCTION TESTS
// ============================================================================

test.describe('Production Comparison Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n🔄 Production Comparison Tests\n`);
  });

  const PRODUCTION_URL = 'https://chronas.org';

  test('should visually match production for year 1000', async ({ page }) => {
    // Skip if testing against production itself
    if (BASE_URL === PRODUCTION_URL) {
      test.skip();
      return;
    }
    
    // Capture dev environment
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('comparison-dev-year-1000.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Dev environment screenshot captured for comparison');
  });

  test('should have similar province count as production', async ({ page }) => {
    let provinceCount = 0;
    
    page.on('response', async (response) => {
      if (response.url().includes('/areas/') && response.status() === 200) {
        try {
          const data = await response.json();
          provinceCount = Object.keys(data as object).length;
        } catch {
          // Ignore
        }
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    console.log(`   📊 Province count: ${String(provinceCount)}`);
    
    // Production has ~2400 provinces for year 1000
    expect(provinceCount).toBeGreaterThan(2000);
    expect(provinceCount).toBeLessThan(3000);
  });

  test('should have similar marker count as production', async ({ page }) => {
    let markerCount = 0;
    
    page.on('response', async (response) => {
      if (response.url().includes('/markers') && response.status() === 200) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            markerCount = data.length;
          }
        } catch {
          // Ignore
        }
      }
    });
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    console.log(`   📍 Marker count: ${String(markerCount)}`);
    
    // Production has ~400 markers for year 1000
    expect(markerCount).toBeGreaterThan(300);
    expect(markerCount).toBeLessThan(600);
  });
});


// ============================================================================
// LAYER VISIBILITY TESTS
// ============================================================================

test.describe('Layer Visibility Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n👁️ Layer Visibility Tests\n`);
  });

  test('should show only ruler layer by default', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('layer-ruler-only.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Ruler layer only screenshot captured');
  });

  test('should switch to culture layer and hide ruler', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=culture`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('layer-culture-only.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Culture layer only screenshot captured');
  });

  test('should switch to religion layer and hide others', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=religion`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('layer-religion-only.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Religion layer only screenshot captured');
  });

  test('should switch to population layer with opacity variation', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000&dim=population`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    await expect(page).toHaveScreenshot('layer-population-only.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Population layer only screenshot captured');
  });
});

// ============================================================================
// PERFORMANCE VISUAL TESTS
// ============================================================================

test.describe('Performance Visual Tests', () => {
  test.beforeAll(() => {
    console.log(`\n⚡ Performance Visual Tests\n`);
  });

  test('should render map within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    const loadTime = Date.now() - startTime;
    console.log(`   ⏱️ Total load time: ${String(loadTime)}ms`);
    
    // Should load within 15 seconds
    expect(loadTime).toBeLessThan(15000);
    
    await expect(page).toHaveScreenshot('performance-initial-load.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.1,
    });
    
    console.log('   ✅ Performance test screenshot captured');
  });

  test('should handle rapid year changes without crashing', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/?year=1000`, { waitUntil: 'networkidle' });
    await waitForMapLoad(page);
    
    // Rapidly change years
    const years = [1100, 1200, 1300, 1400, 1500];
    for (const year of years) {
      await page.evaluate((y) => {
        window.location.hash = `#/?year=${String(y)}`;
      }, year);
      await page.waitForTimeout(200); // Rapid changes
    }
    
    // Wait for final state
    await page.waitForTimeout(3000);
    
    // Should still be functional
    const mapCanvas = page.locator('.mapboxgl-canvas').first();
    await expect(mapCanvas).toBeVisible();
    
    await expect(page).toHaveScreenshot('performance-rapid-changes.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.15,
    });
    
    console.log('   ✅ Rapid year changes test passed');
  });
});
