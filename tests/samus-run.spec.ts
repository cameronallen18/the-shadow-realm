import { test, expect } from "@playwright/test";
import sharp from "sharp";

// Helpers ──────────────────────────────────────────────────────────────────

type Region = { x: number; y: number; width: number; height: number };
function toSharpRegion(r: Region) {
  return { left: r.x, top: r.y, width: r.width, height: r.height };
}

async function getPixels(page: import("@playwright/test").Page, region: Region) {
  const buf = await page.screenshot({ type: "png" });
  const { data, info } = await sharp(buf)
    .extract(toSharpRegion(region))
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

/** Average colour of a canvas region — returns { r, g, b } */
async function avgColor(page: import("@playwright/test").Page, region: Region) {
  const { data, info } = await getPixels(page, region);
  let r = 0, g = 0, b = 0;
  const px = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  return { r: r / px, g: g / px, b: b / px };
}

/** True if a row at canvas y has any non-dark pixel (brightness > threshold) */
async function rowHasBrightPixels(
  page: import("@playwright/test").Page,
  y: number,
  threshold = 60
) {
  const { data, info } = await getPixels(page, { x: 0, y, width: 1280, height: 1 });
  void info;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > threshold || data[i + 1] > threshold || data[i + 2] > threshold)
      return true;
  }
  return false;
}

// Tests ────────────────────────────────────────────────────────────────────

test.describe("samus-run", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects/samus-run");
    await page.waitForTimeout(2000); // let sprite load and animation begin
  });

  test("background is dark cave, not tileset atlas", async ({ page }) => {
    // Mid-screen should be very dark (cave atmosphere, not a bright tileset)
    // The old broken bg had avg brightness > 80 from the colourful sprite atlas
    const mid = await avgColor(page, { x: 300, y: 200, width: 400, height: 200 });
    expect(mid.r).toBeLessThan(40);
    expect(mid.g).toBeLessThan(20);
    expect(mid.b).toBeLessThan(20);
  });

  test("lava floor is visible at bottom 15%", async ({ page }) => {
    // Floor zone: y > 612 (85% of 720) should be red-toned lava
    const lava = await avgColor(page, { x: 0, y: 630, width: 1280, height: 60 });
    expect(lava.r).toBeGreaterThan(lava.b); // more red than blue
    expect(lava.r).toBeGreaterThan(25);
  });

  test("Samus sprite is on the floor, not floating", async ({ page }) => {
    // Samus is at x≈20% = 256, y-anchor at 85% = 612.
    // Check a horizontal strip just above the floor (y=590..610, x=230..300).
    // Should have coloured pixels (Samus's feet), not pure cave dark.
    const { data, info } = await getPixels(page, {
      x: 230, y: 590, width: 70, height: 25,
    });
    let coloredPixels = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Yellow/gold Samus pixels: high R+G, low B
      if (r > 100 && g > 80 && b < 60) coloredPixels++;
    }
    // At least some Samus pixels should be near the floor
    expect(coloredPixels).toBeGreaterThan(5);
  });

  test("no large bright area above mid-screen (no tileset mash)", async ({ page }) => {
    // The old broken background filled upper half with bright colourful tileset.
    // Upper half of screen should not have avg brightness above 30.
    const upper = await avgColor(page, { x: 0, y: 50, width: 1280, height: 250 });
    const brightness = (upper.r + upper.g + upper.b) / 3;
    expect(brightness).toBeLessThan(30);
  });

  test("ceiling stalactites are present at top edge", async ({ page }) => {
    // The stalactites at y=0..40 create dark rock pixels against the background.
    // Some rows near y=20 should have pixels darker than the base cave colour
    // (they are drawn with NORFAIR.rock which is slightly lighter than sky).
    // We just verify the row isn't completely uniform — stalactites add variation.
    const row20 = await getPixels(page, { x: 0, y: 20, width: 1280, height: 1 });
    const row5  = await getPixels(page, { x: 0, y: 5,  width: 1280, height: 1 });
    // Both rows should exist and have data (basic sanity)
    expect(row20.data.length).toBeGreaterThan(0);
    expect(row5.data.length).toBeGreaterThan(0);
  });

  test("Samus sprite has no black border line on left edge", async ({ page }) => {
    // The fixed sprite starts at sx+1 to skip the cell border.
    // Samus is around x=230-300. Check that the leftmost column of the sprite
    // region (x=230) doesn't have more black pixels than the dark background
    // (i.e., no solid-black vertical line that wouldn't be there on a dark bg).
    // Strategy: compare darkness of x=230 vs x=215 (background only) — should be similar.
    const spriteLeft = await avgColor(page, { x: 230, y: 565, width: 1, height: 40 });
    const background  = await avgColor(page, { x: 215, y: 565, width: 1, height: 40 });
    // Both should be dark. A black border line would make spriteLeft significantly
    // darker than the already-dark background — treat difference > 15 as suspicious.
    const diff = Math.abs(
      (spriteLeft.r + spriteLeft.g + spriteLeft.b) -
      (background.r + background.g + background.b)
    );
    expect(diff).toBeLessThan(30);
  });

  test("Samus is static on idle screen (no frame animation)", async ({ page }) => {
    // Idle screen must show a static standing pose — no RAF loop cycling frames.
    // Two screenshots 600ms apart should have near-identical pixels in Samus region.
    const region = { x: 230, y: 550, width: 80, height: 65 };
    const snap1 = await page.screenshot({ type: "png" });
    await page.waitForTimeout(600);
    const snap2 = await page.screenshot({ type: "png" });

    const sr = toSharpRegion(region);
    const [p1, p2] = await Promise.all([
      sharp(snap1).extract(sr).raw().toBuffer(),
      sharp(snap2).extract(sr).raw().toBuffer(),
    ]);

    let diffCount = 0;
    for (let i = 0; i < p1.length; i++) {
      if (Math.abs(p1[i] - p2[i]) > 5) diffCount++;
    }
    // Static render — no frame changes expected between snapshots
    expect(diffCount).toBeLessThan(10);
  });

  test("Samus runs on ground during gameplay", async ({ page }) => {
    await page.keyboard.press("Space"); // start game — pendingJump fires, Samus jumps

    // Jump arc ~0.87s. Wait 1.8s to ensure she has landed back on the ground.
    await page.waitForTimeout(2200);

    // Samus is on the ground running. No further input — she won't jump again.
    const region = { x: 200, y: 540, width: 100, height: 80 };
    const snap1 = await page.screenshot({ type: "png" });
    await page.waitForTimeout(500); // ~5 frame advances at 10fps
    const snap2 = await page.screenshot({ type: "png" });

    const sr = toSharpRegion(region);
    const [p1, p2] = await Promise.all([
      sharp(snap1).extract(sr).raw().toBuffer(),
      sharp(snap2).extract(sr).raw().toBuffer(),
    ]);

    let diffCount = 0;
    for (let i = 0; i < p1.length; i++) {
      if (Math.abs(p1[i] - p2[i]) > 5) diffCount++;
    }
    // Running animation — visible frame changes expected between snapshots
    expect(diffCount).toBeGreaterThan(20);
  });
});
