import { NORFAIR, TILE_WIDTH } from "../constants";

/**
 * Draws the loaded Norfair background image tiled horizontally across the full
 * canvas, with `offset` shifting the tile origin left to produce continuous
 * scroll. Uses pixel-perfect rendering (imageSmoothingEnabled = false, all
 * drawImage args through Math.floor()) consistent with QUAL-01.
 *
 * Loop draws tiles starting at x = -Math.floor(offset) (in range [-511, 0])
 * and steps by TILE_WIDTH (512) until x >= width. Because `offset` is bounded
 * to [0, TILE_WIDTH) by the caller, the leftmost tile always covers x=0
 * seamlessly — no blank gap possible at the wrap boundary.
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: HTMLImageElement,
  width: number,
  height: number,
  offset: number
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const tileH = Math.floor(height);
  const startX = -Math.floor(offset);

  for (let x = startX; x < width; x += TILE_WIDTH) {
    ctx.drawImage(bg, Math.floor(x), 0, TILE_WIDTH, tileH);
  }

  ctx.restore();
}

/**
 * Draws the Norfair cave environment: tiled background (or solid-fill fallback),
 * lava floor, shimmer line, ceiling detail.
 *
 * When `bg` is provided, the image is tiled horizontally with `bgOffset` shift.
 * When `bg` is null/undefined, the original solid-fill sky + midground render
 * (Phase 9 behavior) — no regression.
 *
 * Lava floor, shimmer, ground line, and ceiling stalactites always draw on top.
 */
export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg?: HTMLImageElement | null,
  bgOffset?: number
): void {
  if (bg) {
    drawBackground(ctx, bg, width, height, bgOffset ?? 0);
  } else {
    // Fallback: existing solid fills (D-11 — no regression when bg unloaded)
    ctx.fillStyle = NORFAIR.sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = NORFAIR.midground;
    ctx.fillRect(0, 0, width, height * 0.3);
  }

  // 3. Lava floor (bottom 15% of viewport) — always drawn on top of background
  const floorY = height * 0.85;
  ctx.fillStyle = NORFAIR.lavaGlow;
  ctx.fillRect(0, floorY, width, height - floorY);

  // 4. Lava surface shimmer line
  ctx.strokeStyle = NORFAIR.lavaHighlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  // 5. Ground line — slightly brighter boundary
  ctx.strokeStyle = NORFAIR.groundLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, floorY + 1);
  ctx.lineTo(width, floorY + 1);
  ctx.stroke();

  // 6. Ceiling stalactite hints — downward triangles along top edge
  drawCeilingDetail(ctx, width);
}

function drawCeilingDetail(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.fillStyle = NORFAIR.rock;
  const count = Math.floor(width / 60);
  for (let i = 0; i < count; i++) {
    const x = i * 60 + 10 + (i % 3) * 8; // slightly irregular spacing
    const h = 12 + (i % 4) * 6; // varying heights: 12, 18, 24, 30
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 8, 0);
    ctx.lineTo(x + 4, h);
    ctx.closePath();
    ctx.fill();
  }
}
