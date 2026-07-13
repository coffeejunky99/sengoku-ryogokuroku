import { expect, test } from '@playwright/test';

const viewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1280, height: 720 },
] as const;

const INITIAL_CAMERA_CENTER = { x: 800, y: 600 } as const;
const INITIAL_ZOOM = 0.75;
const KAIZU_CASTLE_POSITION = { x: 720, y: 430 } as const;

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

test('selects a castle and shows its formal summary at a smartphone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('起動完了');
  await expect(page.getByRole('heading', { name: '城を選択してください' })).toBeVisible();

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }));
  const canvasBounds = await canvas.boundingBox();
  if (canvasBounds === null) {
    throw new Error('The map canvas has no visible bounds.');
  }
  const castleScreenX = canvasBounds.x + canvasBounds.width / 2 +
    (KAIZU_CASTLE_POSITION.x - INITIAL_CAMERA_CENTER.x) * INITIAL_ZOOM;
  const castleScreenY = canvasBounds.y + canvasBounds.height / 2 +
    (KAIZU_CASTLE_POSITION.y - INITIAL_CAMERA_CENTER.y) * INITIAL_ZOOM;

  await page.mouse.click(castleScreenX, castleScreenY);

  const panel = page.getByTestId('selected-castle-panel');
  await expect(panel.getByRole('heading', { name: '海津城' })).toBeVisible();
  await expect(panel.getByText('北信濃')).toBeVisible();
  await expect(panel.getByText('武田家')).toBeVisible();
  await expect(panel.getByText('武田菱')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
