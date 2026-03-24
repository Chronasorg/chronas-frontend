import { test } from '@playwright/test';

test('layout gap fix', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/?year=-271');
  await page.waitForTimeout(10000);

  // Open layers panel
  const layersNav = page.locator('[data-testid="nav-item-layers"]').first();
  if (await layersNav.count() > 0) {
    await layersNav.click();
    await page.waitForTimeout(600);
  }

  // Click a province/epic to open right drawer
  await page.mouse.click(600, 350);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/layout-gap-fix.png' });

  // Also try with just right drawer (no layers)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  if (await layersNav.count() > 0) {
    await layersNav.click(); // close layers
    await page.waitForTimeout(400);
  }
  await page.mouse.click(800, 280);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/layout-right-drawer-only.png' });
});
