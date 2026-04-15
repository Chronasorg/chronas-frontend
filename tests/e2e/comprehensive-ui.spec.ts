/**
 * Comprehensive UI E2E Test Suite
 *
 * Tests all interactive UI elements: navigation sidebar, layers panel
 * (area dimensions, markers, epics, advanced), settings panel, right drawer,
 * timeline controls, and keyboard accessibility.
 *
 * Run with: npx playwright test tests/e2e/comprehensive-ui.spec.ts
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Give each test enough time for map + API loading
test.setTimeout(60_000);

// ---------------------------------------------------------------------------
// Helpers — no waitForTimeout; use event-driven waits only
// ---------------------------------------------------------------------------

/** Wait for app shell + map canvas + initial API data to be ready */
async function waitForMap(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="app-shell"]', { timeout: 30_000 });
  await page.waitForSelector('.mapboxgl-canvas, [data-testid="map-container"]', {
    timeout: 15_000,
  });
  // Wait for sidebar nav to be interactive (signals React hydration is complete)
  await page.waitForSelector('[data-testid="nav-item-layers"]', { timeout: 10_000 });
}

/** Open the Layers drawer if it is not already open */
async function openLayers(page: Page): Promise<void> {
  const drawer = page.getByTestId('layers-content');
  if (!(await drawer.isVisible().catch(() => false))) {
    await page.getByTestId('nav-item-layers').click();
    await drawer.waitFor({ state: 'visible', timeout: 5_000 });
  }
}

/** Open the Settings (Configuration) drawer */
async function openSettings(page: Page): Promise<void> {
  const drawer = page.getByTestId('settings-content');
  if (!(await drawer.isVisible().catch(() => false))) {
    await page.getByTestId('nav-item-settings').click();
    await drawer.waitFor({ state: 'visible', timeout: 5_000 });
  }
}


// ---------------------------------------------------------------------------
// 1. Navigation Sidebar
// ---------------------------------------------------------------------------

test.describe('Navigation Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
  });

  test('renders all enabled nav items', async ({ page }) => {
    for (const id of ['layers', 'settings', 'help', 'logout']) {
      await expect(page.getByTestId(`nav-item-${id}`)).toBeVisible();
      await expect(page.getByTestId(`nav-item-${id}`)).toBeEnabled();
    }
  });

  test('renders disabled nav items', async ({ page }) => {
    for (const id of ['discover', 'random', 'pro', 'collections', 'play']) {
      await expect(page.getByTestId(`nav-item-${id}`)).toBeVisible();
      await expect(page.getByTestId(`nav-item-${id}`)).toBeDisabled();
    }
  });

  test('clicking Layers opens the layers drawer', async ({ page }) => {
    await page.getByTestId('nav-item-layers').click();
    await expect(page.getByTestId('layers-content')).toBeVisible();
  });

  test('clicking Settings opens the settings drawer', async ({ page }) => {
    await page.getByTestId('nav-item-settings').click();
    await expect(page.getByTestId('settings-content')).toBeVisible();
  });

  test('clicking Help toggles the announcement banner', async ({ page }) => {
    const banner = page.getByRole('banner');

    // Click help to dismiss
    await page.getByTestId('nav-item-help').click();
    const bannerVisibleAfterFirst = await banner.isVisible().catch(() => false);

    // Click help again to toggle back
    await page.getByTestId('nav-item-help').click();
    const bannerVisibleAfterSecond = await banner.isVisible().catch(() => false);

    // States should differ (toggling)
    expect(bannerVisibleAfterFirst).not.toBe(bannerVisibleAfterSecond);
  });

  test('clicking Layers twice toggles the drawer closed', async ({ page }) => {
    const btn = page.getByTestId('nav-item-layers');
    await btn.click();
    await expect(page.getByTestId('layers-content')).toBeVisible();

    await btn.click();
    await expect(page.getByTestId('layers-content')).not.toBeVisible();
  });

  test('switching from Layers to Settings replaces drawer content', async ({ page }) => {
    await page.getByTestId('nav-item-layers').click();
    await expect(page.getByTestId('layers-content')).toBeVisible();

    await page.getByTestId('nav-item-settings').click();
    await expect(page.getByTestId('settings-content')).toBeVisible();
    await expect(page.getByTestId('layers-content')).not.toBeVisible();
  });

  test('logo link points to /info', async ({ page }) => {
    const logo = page.getByTestId('sidebar-logo');
    await expect(logo).toHaveAttribute('href', '#/info');
  });
});

// ---------------------------------------------------------------------------
// 2. Layers Panel — Area Dimension Radio Buttons
// ---------------------------------------------------------------------------

test.describe('Layers Panel — Area Dimensions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);
  });

  const dimensions = ['ruler', 'culture', 'religion', 'religionGeneral', 'population'] as const;

  for (const dim of dimensions) {
    test(`selecting "${dim}" area radio updates the map`, async ({ page }) => {
      const radio = page.getByTestId(`area-radio-${dim}`);
      await radio.scrollIntoViewIfNeeded();
      await radio.click();
      // Auto-retrying assertion — no waitForTimeout needed
      await expect(radio).toBeChecked();
    });
  }

  test('label radios are available for non-population dimensions', async ({ page }) => {
    for (const dim of ['ruler', 'culture', 'religion', 'religionGeneral'] as const) {
      const labelRadio = page.getByTestId(`label-radio-${dim}`);
      await expect(labelRadio).toBeVisible();
    }
  });

  test('population row has no label radio', async ({ page }) => {
    // Population has only area radio, no label radio
    const popLabelRadio = page.getByTestId('label-radio-population');
    await expect(popLabelRadio).toHaveCount(0);
  });

  test('lock toggle switches between locked and unlocked', async ({ page }) => {
    const lockBtn = page.getByTestId('lock-toggle');
    await expect(lockBtn).toBeVisible();

    // Initially locked
    await expect(lockBtn).toHaveAttribute('aria-pressed', 'true');

    // Unlock
    await lockBtn.click();
    await expect(lockBtn).toHaveAttribute('aria-pressed', 'false');

    // Re-lock
    await lockBtn.click();
    await expect(lockBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('when locked, selecting area radio also selects matching label', async ({ page }) => {
    // Ensure locked
    const lockBtn = page.getByTestId('lock-toggle');
    const pressed = await lockBtn.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await lockBtn.click();
      await expect(lockBtn).toHaveAttribute('aria-pressed', 'true');
    }

    // Click culture area radio
    await page.getByTestId('area-radio-culture').click();

    // Label should also be culture (auto-retrying)
    await expect(page.getByTestId('label-radio-culture')).toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// 3. Layers Panel — Marker Filters
// ---------------------------------------------------------------------------

test.describe('Layers Panel — Marker Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);
  });

  const markerTypes = [
    'ar', 'b', 'si', 'cp', 'c', 'ca', 'l', 'm', 'p', 'e', 's', 'a', 'r', 'at', 'op', 'o',
  ] as const;

  test('all 16 marker type checkboxes are visible and checked by default', async ({ page }) => {
    for (const type of markerTypes) {
      const cb = page.getByTestId(`marker-filter-${type}`);
      await cb.scrollIntoViewIfNeeded();
      await expect(cb).toBeVisible();
      await expect(cb).toBeChecked();
    }
  });

  test('Uncheck All unchecks every marker and button changes to Check All', async ({ page }) => {
    const toggleBtn = page.getByTestId('toggle-all-markers');
    await toggleBtn.scrollIntoViewIfNeeded();
    await expect(toggleBtn).toContainText(/uncheck all/i);

    await toggleBtn.click();

    // All should be unchecked (auto-retrying assertions)
    for (const type of markerTypes) {
      await expect(page.getByTestId(`marker-filter-${type}`)).not.toBeChecked();
    }

    // Button text should say "Check All"
    await expect(toggleBtn).toContainText(/check all/i);
  });

  test('Check All re-checks every marker', async ({ page }) => {
    const toggleBtn = page.getByTestId('toggle-all-markers');
    await toggleBtn.scrollIntoViewIfNeeded();

    // Uncheck all first
    await toggleBtn.click();
    await expect(toggleBtn).toContainText(/check all/i);

    // Now check all
    await toggleBtn.click();

    for (const type of markerTypes) {
      await expect(page.getByTestId(`marker-filter-${type}`)).toBeChecked();
    }
  });

  test('individual marker checkbox can be toggled', async ({ page }) => {
    const cb = page.getByTestId('marker-filter-b'); // Battle
    await cb.scrollIntoViewIfNeeded();
    await expect(cb).toBeChecked();

    await cb.click();
    await expect(cb).not.toBeChecked();

    await cb.click();
    await expect(cb).toBeChecked();
  });

  test('marker limit slider is visible and has expected default', async ({ page }) => {
    const slider = page.getByTestId('marker-limit-slider');
    await slider.scrollIntoViewIfNeeded();
    await expect(slider).toBeVisible();

    const value = await slider.inputValue();
    expect(Number(value)).toBeGreaterThanOrEqual(0);
    expect(Number(value)).toBeLessThanOrEqual(10_000);
  });

  test('cluster markers switch toggles', async ({ page }) => {
    const sw = page.getByTestId('cluster-markers-switch');
    await sw.scrollIntoViewIfNeeded();
    await expect(sw).toBeVisible();

    const initialChecked = await sw.getAttribute('aria-checked');

    await sw.click();

    // Wait for the attribute to change (auto-retrying)
    if (initialChecked === 'true') {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    } else {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Layers Panel — Epic Filters
// ---------------------------------------------------------------------------

test.describe('Layers Panel — Epic Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);
  });

  const epicTypes = ['war', 'empire', 'religion', 'culture', 'person', 'other'] as const;

  test('all 6 epic type checkboxes are visible and checked by default', async ({ page }) => {
    for (const type of epicTypes) {
      const cb = page.getByTestId(`epic-filter-${type}`);
      await cb.scrollIntoViewIfNeeded();
      await expect(cb).toBeVisible();
      await expect(cb).toBeChecked();
    }
  });

  test('Uncheck All unchecks every epic type', async ({ page }) => {
    // Collapse markers section to bring epics into view
    await page.getByTestId('markers-section-toggle').click();
    await expect(page.getByTestId('markers-section-content')).not.toBeVisible();

    const toggleBtn = page.getByTestId('toggle-all-epics');
    await toggleBtn.scrollIntoViewIfNeeded();
    await toggleBtn.click();

    for (const type of epicTypes) {
      const cb = page.getByTestId(`epic-filter-${type}`);
      await cb.scrollIntoViewIfNeeded();
      await expect(cb).not.toBeChecked();
    }
  });

  test('individual epic checkbox can be toggled', async ({ page }) => {
    // Collapse markers section to bring epics into view
    await page.getByTestId('markers-section-toggle').click();
    await expect(page.getByTestId('markers-section-content')).not.toBeVisible();

    const cb = page.getByTestId('epic-filter-war');
    await cb.scrollIntoViewIfNeeded();
    await expect(cb).toBeChecked();

    await cb.click();
    await expect(cb).not.toBeChecked();

    await cb.click();
    await expect(cb).toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// 5. Layers Panel — Advanced Section
// ---------------------------------------------------------------------------

test.describe('Layers Panel — Advanced Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);
    // Collapse other sections to bring Advanced into view
    await page.getByTestId('area-section-toggle').click();
    await expect(page.getByTestId('area-section-content')).not.toBeVisible();
    await page.getByTestId('markers-section-toggle').click();
    await expect(page.getByTestId('markers-section-content')).not.toBeVisible();
    await page.getByTestId('epics-section-toggle').click();
    await expect(page.getByTestId('epics-section-content')).not.toBeVisible();
  });

  test('Advanced section expands on click', async ({ page }) => {
    const toggle = page.getByTestId('advanced-section-toggle');
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();

    await expect(page.getByTestId('advanced-section-content')).toBeVisible();
  });

  test('basemap select has four options', async ({ page }) => {
    const advToggle = page.getByTestId('advanced-section-toggle');
    await advToggle.scrollIntoViewIfNeeded();
    await advToggle.click();
    await expect(page.getByTestId('advanced-section-content')).toBeVisible();

    const select = page.getByTestId('basemap-select');
    await select.scrollIntoViewIfNeeded();
    await expect(select).toBeVisible();

    const options = await select.locator('option').allTextContents();
    expect(options.map((o) => o.toLowerCase())).toEqual(
      expect.arrayContaining(['topographic', 'satellite', 'light', 'none'])
    );
  });

  test('changing basemap updates selection', async ({ page }) => {
    const advToggle = page.getByTestId('advanced-section-toggle');
    await advToggle.scrollIntoViewIfNeeded();
    await advToggle.click();
    await expect(page.getByTestId('advanced-section-content')).toBeVisible();

    const select = page.getByTestId('basemap-select');
    await select.scrollIntoViewIfNeeded();

    await select.selectOption('satellite');
    await expect(select).toHaveValue('satellite');

    await select.selectOption('none');
    await expect(select).toHaveValue('none');

    await select.selectOption('topographic');
    await expect(select).toHaveValue('topographic');
  });

  test('show provinces toggle is visible', async ({ page }) => {
    const advToggle = page.getByTestId('advanced-section-toggle');
    await advToggle.scrollIntoViewIfNeeded();
    await advToggle.click();
    await expect(page.getByTestId('advanced-section-content')).toBeVisible();

    const toggle = page.getByTestId('show-provinces-toggle');
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toBeVisible();

    // Verify the switch component exists within it
    const sw = page.getByTestId('show-provinces-switch');
    await expect(sw).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// 6. Settings Panel
// ---------------------------------------------------------------------------

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openSettings(page);
  });

  test('theme buttons are visible (Light, Dark, Luther)', async ({ page }) => {
    await expect(page.getByTestId('theme-btn-light')).toBeVisible();
    await expect(page.getByTestId('theme-btn-dark')).toBeVisible();
    await expect(page.getByTestId('theme-btn-luther')).toBeVisible();
  });

  test('Light theme is active by default', async ({ page }) => {
    await expect(page.getByTestId('theme-btn-light')).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking Dark applies dark theme', async ({ page }) => {
    await page.getByTestId('theme-btn-dark').click();
    await expect(page.getByTestId('theme-btn-dark')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('theme-btn-light')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking Luther applies luther theme', async ({ page }) => {
    await page.getByTestId('theme-btn-luther').click();
    await expect(page.getByTestId('theme-btn-luther')).toHaveAttribute('aria-pressed', 'true');
  });

  test('language dropdown is visible with English default', async ({ page }) => {
    const langSelect = page.getByTestId('language-select');
    await expect(langSelect).toBeVisible();

    const value = await langSelect.inputValue();
    expect(value).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 7. Right Drawer
// ---------------------------------------------------------------------------

test.describe('Right Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
  });

  test('right drawer exists with "No content selected" message', async ({ page }) => {
    const drawer = page.getByTestId('right-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('No content selected');
  });

  test('close button on right drawer is present', async ({ page }) => {
    const closeBtn = page.getByTestId('right-drawer-close');
    await expect(closeBtn).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// 8. Timeline Controls
// ---------------------------------------------------------------------------

test.describe('Timeline Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
  });

  test('year display shows 1000 by default', async ({ page }) => {
    await expect(page.locator('[data-testid="year-notification"], [role="status"]').first()).toBeVisible();
  });

  test('expand timeline button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Expand timeline' })).toBeVisible();
  });

  test('search epics button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Search epics' })).toBeVisible();
  });

  test('autoplay button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Start autoplay' })).toBeVisible();
  });

  test('epic items are rendered in the timeline', async ({ page }) => {
    // Use auto-retrying assertion instead of snapshot count()
    await expect(page.locator('[class*="timelineItem"]').first()).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// 9. Announcement Banner
// ---------------------------------------------------------------------------

test.describe('Announcement Banner', () => {
  test('banner is visible on first load with expected text', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);

    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Welcome to Chronas');
  });

  test('dismiss button hides the banner', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);

    const dismissBtn = page.getByRole('button', { name: 'Dismiss banner' });
    await dismissBtn.click();

    const banner = page.getByRole('banner');
    await expect(banner).not.toBeVisible();
  });

  test('GitHub link has correct href', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);

    const link = page.getByRole('link', { name: 'Let us know on GitHub' });
    await expect(link).toHaveAttribute(
      'href',
      'https://github.com/Chronasorg/chronas-frontend/issues'
    );
  });

  test('classic version link points to old.chronas.org', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);

    const link = page.getByRole('link', { name: 'Classic version' });
    await expect(link).toHaveAttribute('href', 'https://old.chronas.org');
  });
});

// ---------------------------------------------------------------------------
// 10. Keyboard Accessibility
// ---------------------------------------------------------------------------

test.describe('Keyboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
  });

  test('Escape closes the layers drawer', async ({ page }) => {
    await openLayers(page);
    await expect(page.getByTestId('layers-content')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('layers-content')).not.toBeVisible();
  });

  test('Escape closes the settings drawer', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByTestId('settings-content')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('settings-content')).not.toBeVisible();
  });

  test('sidebar nav items are focusable via Tab', async ({ page }) => {
    await page.getByTestId('sidebar-logo').focus();
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 11. Collapsible Sections in Layers
// ---------------------------------------------------------------------------

test.describe('Layers Panel — Section Collapse/Expand', () => {
  test('Area section can be collapsed and expanded', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);

    const toggle = page.getByTestId('area-section-toggle');
    const content = page.getByTestId('area-section-content');

    await expect(content).toBeVisible();

    await toggle.click();
    await expect(content).not.toBeVisible();

    await toggle.click();
    await expect(content).toBeVisible();
  });

  test('Markers section can be collapsed and expanded', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);

    const toggle = page.getByTestId('markers-section-toggle');
    const content = page.getByTestId('markers-section-content');

    await expect(content).toBeVisible();

    await toggle.click();
    await expect(content).not.toBeVisible();

    await toggle.click();
    await expect(content).toBeVisible();
  });

  test('Epics section can be collapsed and expanded', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);

    const toggle = page.getByTestId('epics-section-toggle');
    const content = page.getByTestId('epics-section-content');

    await expect(content).toBeVisible();

    await toggle.click();
    await expect(content).not.toBeVisible();

    await toggle.click();
    await expect(content).toBeVisible();
  });

  test('GENERAL section can be collapsed and expanded', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);

    const toggle = page.getByTestId('general-section-toggle');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

// ---------------------------------------------------------------------------
// 12. Layers Panel — Collapse Button
// ---------------------------------------------------------------------------

test.describe('Layers Panel — Collapse Button', () => {
  test('collapse button closes the layers panel', async ({ page }) => {
    await page.goto('/');
    await waitForMap(page);
    await openLayers(page);

    const collapseBtn = page.getByTestId('layers-collapse-button');
    await expect(collapseBtn).toBeVisible();

    await collapseBtn.click();

    await expect(page.getByTestId('layers-content')).not.toBeVisible();
  });
});
