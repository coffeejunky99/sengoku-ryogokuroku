import { expect, test } from '@playwright/test';

const viewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1280, height: 720 },
] as const;

for (const viewport of viewports) {
  test(`boots at ${String(viewport.width)}x${String(viewport.height)}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByTestId('app-root')).toBeVisible();
    await expect(page.getByRole('heading', { name: '戦国領国録' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('起動完了');
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('keeps one canvas after a viewport resize', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });

  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas')).toBeVisible();
});
