import { NORFAIR } from "../constants";

// Scales tile to fill destW (aspect-ratio preserved), then tiles vertically.
function fillTiled(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(destX, destY, destW, destH);
  ctx.clip();

  if (img) {
    ctx.imageSmoothingEnabled = false;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = destW / iw;
    const drawH = Math.ceil(ih * scale);
    for (let ty = destY; ty < destY + destH; ty += drawH) {
      ctx.drawImage(img, destX, ty, destW, drawH);
    }
  } else {
    ctx.fillStyle = NORFAIR.rock;
    ctx.fillRect(destX, destY, destW, destH);
  }

  ctx.restore();
}

export function drawRockWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  gapTop: number,
  gapBottom: number,
  width: number,
  canvasHeight: number,
  pillarImg?: HTMLImageElement | null,
): void {
  // Top column
  fillTiled(ctx, pillarImg ?? null, x, 0, width, gapTop);
  ctx.fillStyle = NORFAIR.rockEdge;
  ctx.fillRect(x, gapTop - 4, width, 4);

  // Bottom column
  fillTiled(ctx, pillarImg ?? null, x, gapBottom, width, canvasHeight - gapBottom);
  ctx.fillStyle = NORFAIR.rockEdge;
  ctx.fillRect(x, gapBottom, width, 4);
}
