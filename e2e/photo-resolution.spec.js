import { test, expect } from "@playwright/test";

test("custom photo keeps original aspect ratio and source resolution through export", async ({ page }) => {
  await page.goto("/");
  await page.locator("#document").selectOption("custom");

  const pngDataUrl = await page.evaluate(() => {
    const source = document.createElement("canvas");
    source.width = 720;
    source.height = 1600;
    const context = source.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 720, 1600);
    gradient.addColorStop(0, "#d9e8ff");
    gradient.addColorStop(1, "#243b64");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 720, 1600);
    context.fillStyle = "#ffffff";
    context.fillRect(280, 420, 160, 300);
    return source.toDataURL("image/png");
  });
  const base64 = pngDataUrl.split(",")[1];
  await page.locator("#photo").setInputFiles({
    name: "source-portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64")
  });

  await expect(page.locator("#preview")).toBeVisible();
  await expect(page.locator("#width")).toHaveValue("720");
  await expect(page.locator("#height")).toHaveValue("1600");

  await page.locator("#process").click();
  await expect(page.locator("#canvas")).toBeVisible();
  await expect(page.locator("#canvas")).toHaveAttribute("width", "720");
  await expect(page.locator("#canvas")).toHaveAttribute("height", "1600");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("passport-ai-photo-720x1600.jpg");
  await expect(page.locator("#downloadHelp")).toContainText("720 × 1600 px");
});
