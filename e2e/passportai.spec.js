import { test, expect } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/S9sAAAAASUVORK5CYII=',
  'base64'
);

test('loads the app and keeps official document export blocked by default', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Passport AI/);
  await expect(page.getByRole('heading', { name: 'Your Identity. Perfectly Framed.' })).toBeVisible();
  await expect(page.locator('#process')).toBeDisabled();
  await expect(page.locator('#download')).toBeDisabled();
  await expect(page.locator('#processHelp')).toContainText(/official document/i);
});

test('custom photo upload renders a result and enables a real file download', async ({ page }) => {
  await page.goto('/');
  await page.locator('#document').selectOption('custom');
  await expect(page.locator('#process')).toBeEnabled();

  await page.locator('#photo').setInputFiles({
    name: 'test-photo.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });
  await expect(page.locator('#previewWrap')).toBeVisible();
  await expect(page.locator('#imageInfo')).toContainText('Loaded successfully');

  await page.locator('#process').click();
  await expect(page.locator('#canvas')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Photo created successfully');
  await expect(page.locator('#download')).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(jpg|png)$/i);
});

test('rejects fake image bytes even when MIME metadata claims PNG', async ({ page }) => {
  await page.goto('/');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#photo').setInputFiles({
    name: 'fake.png',
    mimeType: 'image/png',
    buffer: Buffer.from('this is not an image')
  });
  await expect(page.locator('#photo')).toHaveValue('');
  await expect(page.locator('#previewWrap')).toBeHidden();
});

test('changing away from custom mode disables general-purpose processing', async ({ page }) => {
  await page.goto('/');
  await page.locator('#document').selectOption('custom');
  await expect(page.locator('#process')).toBeEnabled();
  await page.locator('#document').selectOption('passport-paper');
  await expect(page.locator('#process')).toBeDisabled();
  await expect(page.locator('#download')).toBeDisabled();
});
