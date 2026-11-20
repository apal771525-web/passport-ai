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
  await expect(page.locator('#switchToCustom')).toBeVisible();
  await expect(page.locator('#downloadHelp')).toContainText(/Switch to Custom Photo/i);
});

test('switch-to-custom action exposes the working create and download flow', async ({ page }) => {
  await page.goto('/');
  await page.locator('#switchToCustom').click();
  await expect(page.locator('#document')).toHaveValue('custom');
  await expect(page.locator('#process')).toBeEnabled();
  await page.locator('#photo').setInputFiles({ name: 'custom-flow.png', mimeType: 'image/png', buffer: tinyPng });
  await page.locator('#process').click();
  await expect(page.locator('#download')).toBeEnabled();
  await expect(page.locator('#downloadHelp')).toContainText(/ready/i);
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

test('runs the photo quality check locally after a valid upload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#photo').setInputFiles({
    name: 'quality-test.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });
  await expect(page.locator('#qualityCheck')).toBeEnabled();
  await page.locator('#qualityCheck').click();
  await expect(page.locator('#qualityStatus')).toContainText('rough image-wide signals');
  await expect(page.locator('#qualityStatus')).toContainText('Analysis ran in this browser.');
});

test('shows the experimental AI face-quality model only after a valid photo is loaded', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#aiFaceQuality')).toBeDisabled();
  await expect(page.locator('#aiFaceQualityStatus')).toContainText('eDifFIQA-T');
  await page.locator('#photo').setInputFiles({
    name: 'ai-quality-test.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });
  await expect(page.locator('#aiFaceQuality')).toBeEnabled();
});

test('uses validated face framing metrics in the browser UI', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export const FilesetResolver = { forVisionTasks: async () => ({}) };
        export const FaceDetector = {
          createFromOptions: async () => ({
            detect: () => ({
              detections: [{
                boundingBox: { originX: 0.2, originY: 0.1, width: 0.5, height: 0.5 },
                categories: [{ score: 0.91 }]
              }]
            })
          })
        };
      `
    })
  );
  await page.goto('/');
  await page.locator('#photo').setInputFiles({
    name: 'face-test.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });
  await page.locator('#analyzeFace').click();
  await expect(page.locator('#faceStatus')).toContainText('One face detected');
  await expect(page.locator('#faceStatus')).toContainText('Face appears roughly centred horizontally.');
  await expect(page.locator('#faceStatus')).toContainText('Face appears around the middle vertically.');
  await expect(page.locator('#detectedFaceBox')).toHaveAttribute('width', '0.5');
});

test('falls back to the unpkg MediaPipe source when jsDelivr is unavailable', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs', route => route.abort());
  await page.route('https://unpkg.com/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `
      export const FilesetResolver = { forVisionTasks: async () => ({}) };
      export const FaceDetector = { createFromOptions: async () => ({ detect: () => ({ detections: [{ boundingBox: { originX: 0.2, originY: 0.1, width: 0.5, height: 0.5 }, categories: [{ score: 0.9 }] }] }) }) };
    `
  }));
  await page.goto('/');
  await page.locator('#photo').setInputFiles({ name: 'fallback-face.png', mimeType: 'image/png', buffer: tinyPng });
  await page.locator('#analyzeFace').click();
  await expect(page.locator('#faceStatus')).toContainText('One face detected');
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
