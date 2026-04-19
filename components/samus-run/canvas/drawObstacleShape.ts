import { NORFAIR } from "../constants";

/**
 * Draws a rock wall obstacle pair (top column + bottom column with a gap between).
 * x = left edge of the column.
 * gapTop/gapBottom define the opening Samus flies through.
 */
export function drawRockWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  gapTop: number,
  gapBottom: number,
  width: number,
  canvasHeight: number
): void {
  // Top column (from ceiling down to gapTop)
  ctx.fillStyle = NORFAIR.rock;
  ctx.fillRect(x, 0, width, gapTop);

  // Bottom edge highlight of top column
  ctx.fillStyle = NORFAIR.rockEdge;
  ctx.fillRect(x, gapTop - 4, width, 4);

  // Bottom column (from gapBottom to floor)
  ctx.fillStyle = NORFAIR.rock;
  ctx.fillRect(x, gapBottom, width, canvasHeight - gapBottom);

  // Top edge highlight of bottom column
  ctx.fillStyle = NORFAIR.rockEdge;
  ctx.fillRect(x, gapBottom, width, 4);
}
