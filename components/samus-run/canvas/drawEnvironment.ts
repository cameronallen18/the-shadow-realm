import { NORFAIR } from "../constants";

export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  // Deep cave base
  ctx.fillStyle = NORFAIR.sky;
  ctx.fillRect(0, 0, width, height);

  // Ceiling rock face — darker zone
  ctx.fillStyle = NORFAIR.midground;
  ctx.fillRect(0, 0, width, height * 0.15);

  // Mid-cave rock strata bands for depth
  ctx.save();
  ctx.fillStyle = NORFAIR.rock;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, height * 0.22, width, Math.max(2, height * 0.025));
  ctx.fillRect(0, height * 0.48, width, Math.max(2, height * 0.02));
  ctx.fillRect(0, height * 0.68, width, Math.max(2, height * 0.02));
  ctx.restore();

  // Lava floor (bottom 15% of viewport)
  const floorY = height * 0.85;
  ctx.fillStyle = NORFAIR.lavaGlow;
  ctx.fillRect(0, floorY, width, height - floorY);

  // Lava surface shimmer line
  ctx.strokeStyle = NORFAIR.lavaHighlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  // Ground line — slightly brighter boundary
  ctx.strokeStyle = NORFAIR.groundLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, floorY + 1);
  ctx.lineTo(width, floorY + 1);
  ctx.stroke();

  // Ceiling stalactite hints — downward triangles along top edge
  drawCeilingDetail(ctx, width);
}

function drawCeilingDetail(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.fillStyle = NORFAIR.rock;
  const count = Math.floor(width / 60);
  for (let i = 0; i < count; i++) {
    const x = i * 60 + 10 + (i % 3) * 8;
    const h = 12 + (i % 4) * 6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 8, 0);
    ctx.lineTo(x + 4, h);
    ctx.closePath();
    ctx.fill();
  }
}
