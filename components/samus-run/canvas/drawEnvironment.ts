import { NORFAIR } from "../constants";

// Scales bg to fill canvas height (aspect-ratio preserved), then tiles horizontally with parallax.
function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: HTMLImageElement,
  width: number,
  height: number,
  offset: number,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const iw = bg.naturalWidth;
  const ih = bg.naturalHeight;
  // Scale so image fills the full canvas height, width scales proportionally
  const scale = height / ih;
  const drawW = Math.ceil(iw * scale);
  const startX = -Math.floor(offset % drawW);
  for (let tx = startX; tx < width; tx += drawW) {
    ctx.drawImage(bg, Math.floor(tx), 0, drawW, height);
  }
  ctx.restore();
}

export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg?: HTMLImageElement | null,
  bgOffset?: number,
): void {
  if (bg) {
    drawBackground(ctx, bg, width, height, bgOffset ?? 0);
  } else {
    // Solid-fill fallback if image hasn't loaded yet
    ctx.fillStyle = NORFAIR.sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = NORFAIR.midground;
    ctx.fillRect(0, 0, width, height * 0.15);
  }

  // Lava floor (bottom 15%)
  const floorY = height * 0.85;
  ctx.fillStyle = NORFAIR.lavaGlow;
  ctx.fillRect(0, floorY, width, height - floorY);

  ctx.strokeStyle = NORFAIR.lavaHighlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  ctx.strokeStyle = NORFAIR.groundLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, floorY + 1);
  ctx.lineTo(width, floorY + 1);
  ctx.stroke();

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
