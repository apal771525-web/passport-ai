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
  const manualFallback = page.locator("#downloadHelp a");
  await expect(manualFallback).toBeVisible();
  await expect(manualFallback).toHaveAttribute("download", /passport-ai-photo-/);
  await expect(manualFallback).toContainText(/tap here if the download did not start/i);
  const fallbackDownloadPromise = page.waitForEvent("download");
  await manualFallback.click();
  const fallbackDownload = await fallbackDownloadPromise;
  expect(fallbackDownload.suggestedFilename()).toBe(download.suggestedFilename());
});

test("a new upload clears the old output and manual download fallback", async ({ page }) => {
  await page.goto("/");
  await page.locator("#document").selectOption("custom");
  await page.locator("#photo").setInputFiles({ name: "first-photo.png", mimeType: "image/png", buffer: tinyPng });
  await page.locator("#process").click();
  await expect(page.locator("#download")).toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download").click();
  await downloadPromise;
  await expect(page.locator("#downloadHelp a")).toBeVisible();

  await page.locator("#photo").setInputFiles({ name: "second-photo.png", mimeType: "image/png", buffer: tinyPng });
  await expect(page.locator("#download")).toBeDisabled();
  await expect(page.locator("#canvas")).toBeHidden();
  await expect(page.locator("#downloadHelp a")).toHaveCount(0);
  await expect(page.locator("#previewWrap")).toBeVisible();
  await expect(page.locator("#status")).toContainText(/photo loaded/i);
});

test('invalidates stale exports whenever crop or image adjustments change', async ({ page }) => {
  await page.goto('/');
  await page.locator('#document').selectOption('custom');
  await page.locator('#photo').setInputFiles({
    name: 'stale-output.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });
  await page.locator('#process').click();
  await expect(page.locator('#download')).toBeEnabled();
  await expect(page.locator('#canvas')).toBeVisible();

  await page.locator('#zoom').evaluate(el => { el.value = '1.2'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#download')).toBeDisabled();
  await expect(page.locator('#printSheetButton')).toBeDisabled();
  await expect(page.locator('#canvas')).toBeHidden();
  await expect(page.locator('#status')).toContainText(/settings changed/i);

  await page.locator('#process').click();
  await expect(page.locator('#download')).toBeEnabled();
  await expect(page.locator('#canvas')).toBeVisible();

  await page.locator('#brightness').evaluate(el => { el.value = '110'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#download')).toBeDisabled();
  await expect(page.locator('#canvas')).toBeHidden();
});

test('shows a draggable crop frame in custom mode and syncs it with framing sliders', async ({ page }) => {
  await page.goto('/');
  await page.locator('#document').selectOption('custom');
  await page.locator('#photo').setInputFiles({
    name: 'crop-editor.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });
  await page.locator('#width').fill('413');
  await page.locator('#height').fill('531');
  await page.locator('#width').dispatchEvent('input');
  await expect(page.locator('#cropDragFrame')).toBeVisible();

  await page.locator('#cropDragFrame').scrollIntoViewIfNeeded();
  const initial = Number(await page.locator('#horizontal').inputValue());
  const frame = await page.locator('#cropDragFrame').boundingBox();
  expect(frame).not.toBeNull();
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
  await page.mouse.down();
  await page.mouse.move(frame.x + frame.width / 2 + 18, frame.y + frame.height / 2, { steps: 3 });
  await page.mouse.up();
  await expect.poll(async () => Number(await page.locator('#horizontal').inputValue())).toBeGreaterThan(initial);

  await page.locator('#cropDragFrame').focus();
  const beforeKeyboard = Number(await page.locator('#horizontal').inputValue());
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => Number(await page.locator('#horizontal').inputValue())).toBeGreaterThan(beforeKeyboard);
  await expect(page.locator('#download')).toBeDisabled();
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
