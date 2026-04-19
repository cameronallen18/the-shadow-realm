import { NORFAIR } from "../constants";

/**
 * Draws the Norfair cave environment: sky, lava floor, shimmer line, ceiling detail.
 */
export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // 1. Sky / cave background — fills entire canvas
  ctx.fillStyle = NORFAIR.sky;
  ctx.fillRect(0, 0, width, height);

  // 2. Midground cave wall band (top 30%)
  ctx.fillStyle = NORFAIR.midground;
  ctx.fillRect(0, 0, width, height * 0.3);

  // 3. Lava floor (bottom 15% of viewport)
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
