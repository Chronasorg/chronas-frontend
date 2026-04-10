/**
 * Locale Metadata E2E Tests
 *
 * Verifies that switching language in the settings panel:
 * 1. Triggers a localized metadata API call
 * 2. Keeps map layers (colored provinces) visible
 * 3. Does not break the standard metadata (colors, wiki, icons)
 *
 * Run with: npx playwright test tests/e2e/locale-metadata.spec.ts
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Increase timeout for network-dependent tests
test.setTimeout(60_000);
test.use({ actionTimeout: 15_000 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForMap(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="app-shell"]', { timeout: 30_000 });
  // Let map tiles and API calls settle
  await page.waitForTimeout(3_000);
}

async function openSettings(page: Page): Promise<void> {
  await page.getByTestId('nav-item-settings').click();
  await page.getByTestId('settings-content').waitFor({ state: 'visible', timeout: 5_000 });
}

// ---------------------------------------------------------------------------
// 1. Metadata API calls on locale switch
// ---------------------------------------------------------------------------

test.describe('Locale metadata loading', () => {
  test('should load standard metadata on initial page load (English)', async ({ page }) => {
    const metadataRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/metadata') && url.includes('type=g')) {
        metadataRequests.push(url);
      }
    });

    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);
    await page.waitForTimeout(2_000);

    // Should have made at least one standard metadata request
    const standardRequests = metadataRequests.filter(
      (u) => u.includes('f=provinces') && !u.includes('locale=')
    );
    expect(standardRequests.length).toBeGreaterThan(0);
  });

  test('should make localized metadata request when switching to German', async ({ page }) => {
    const metadataRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/metadata') && url.includes('type=g')) {
        metadataRequests.push(url);
      }
    });

    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    // Open settings and switch language to German
    await openSettings(page);
    const langSelect = page.getByTestId('language-select');
    await expect(langSelect).toBeVisible();
    await langSelect.selectOption('de');

    // Wait for the localized metadata fetch
    await page.waitForTimeout(3_000);

    // Should have a localized metadata request with locale=de
    const localizedRequests = metadataRequests.filter((u) => u.includes('locale=de'));
    expect(localizedRequests.length).toBeGreaterThan(0);

    // The localized request should ask for locale-suffixed fields
    const locReq = localizedRequests[0]!;
    expect(locReq).toContain('ruler_de');
    expect(locReq).toContain('culture_de');
    expect(locReq).toContain('religion_de');
  });

  test('should also re-fetch standard metadata when switching locale', async ({ page }) => {
    const metadataRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/metadata') && url.includes('type=g')) {
        metadataRequests.push(url);
      }
    });

    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    const requestsBefore = metadataRequests.length;

    // Switch to Spanish
    await openSettings(page);
    const langSelect = page.getByTestId('language-select');
    await langSelect.selectOption('es');
    await page.waitForTimeout(3_000);

    // Should have new requests after locale switch
    const requestsAfter = metadataRequests.length;
    expect(requestsAfter).toBeGreaterThan(requestsBefore);

    // Standard metadata request (with provinces, ruler, culture...) should still be made
    const standardAfterSwitch = metadataRequests
      .slice(requestsBefore)
      .filter((u) => u.includes('f=provinces,ruler,culture'));
    expect(standardAfterSwitch.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Map layers remain visible after locale switch
// ---------------------------------------------------------------------------

test.describe('Map layers after locale switch', () => {
  test('should keep map canvas visible after switching to German', async ({ page }) => {
    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    // Switch to German
    await openSettings(page);
    await page.getByTestId('language-select').selectOption('de');
    await page.waitForTimeout(3_000);

    // Map canvas should still be visible
    const canvas = page.locator('.mapboxgl-canvas');
    await expect(canvas.first()).toBeVisible();
  });

  test('should not show error messages after locale switch', async ({ page }) => {
    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    // Switch to French
    await openSettings(page);
    await page.getByTestId('language-select').selectOption('fr');
    await page.waitForTimeout(3_000);

    const errorMessages = ['No Data Available', 'Error loading', 'Failed to load'];
    for (const errorText of errorMessages) {
      const errorElement = page.locator(`text=${errorText}`);
      const isVisible = await errorElement.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
  });

  test('should receive valid metadata responses for both standard and localized', async ({
    page,
  }) => {
    const metadataResponses: { url: string; status: number; hasData: boolean }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/metadata') && url.includes('type=g') && response.status() === 200) {
        try {
          const data = await response.json();
          const keys = Object.keys(data as object);
          metadataResponses.push({ url, status: 200, hasData: keys.length > 0 });
        } catch {
          metadataResponses.push({ url, status: 200, hasData: false });
        }
      }
    });

    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    // Switch to German
    await openSettings(page);
    await page.getByTestId('language-select').selectOption('de');
    await page.waitForTimeout(3_000);

    // All metadata responses should have data
    expect(metadataResponses.length).toBeGreaterThan(0);
    for (const resp of metadataResponses) {
      expect(resp.hasData).toBe(true);
    }
  });

  test('should not have critical console errors after locale switch', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    // Switch language
    await openSettings(page);
    await page.getByTestId('language-select').selectOption('de');
    await page.waitForTimeout(3_000);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('ResizeObserver') &&
        !err.includes('third-party') &&
        !err.includes('favicon')
    );

    expect(criticalErrors.length).toBeLessThan(3);
  });
});

// ---------------------------------------------------------------------------
// 3. Switching back to English restores original names
// ---------------------------------------------------------------------------

test.describe('Locale round-trip', () => {
  test('should restore English metadata when switching back from German', async ({ page }) => {
    const metadataRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/metadata') && url.includes('type=g')) {
        metadataRequests.push(url);
      }
    });

    await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded' });
    await waitForMap(page);

    // Switch to German
    await openSettings(page);
    const langSelect = page.getByTestId('language-select');
    await langSelect.selectOption('de');
    await page.waitForTimeout(3_000);

    const afterDe = metadataRequests.length;

    // Switch back to English
    await langSelect.selectOption('en');
    await page.waitForTimeout(3_000);

    // Should have made new metadata requests for English
    expect(metadataRequests.length).toBeGreaterThan(afterDe);

    // Map should still be visible
    const canvas = page.locator('.mapboxgl-canvas');
    await expect(canvas.first()).toBeVisible();
  });
});
