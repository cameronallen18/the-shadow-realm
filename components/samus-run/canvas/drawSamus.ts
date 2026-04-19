import { SAMUS } from "../constants";

/**
 * Draws Samus in the idle/standing varia suit pose.
 * x = center X, y = bottom of feet (standing on floor).
 */
export function drawSamusIdle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1
): void {
  const w = 24 * scale;
  const h = 48 * scale;

  // Body core
  ctx.fillStyle = SAMUS.body;
  ctx.fillRect(x - w * 0.4, y - h * 0.6, w * 0.8, h * 0.5);

  // Shoulder pads (wider than body, raised)
  ctx.fillStyle = SAMUS.highlight;
  ctx.fillRect(x - w * 0.6, y - h * 0.65, w * 0.25, h * 0.15);
  ctx.fillRect(x + w * 0.35, y - h * 0.65, w * 0.25, h * 0.15);

  // Helmet (circle)
  ctx.fillStyle = SAMUS.body;
  ctx.beginPath();
  ctx.arc(x, y - h * 0.82, w * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Visor slit (horizontal bright rectangle)
  ctx.fillStyle = SAMUS.visor;
  ctx.fillRect(x - w * 0.2, y - h * 0.87, w * 0.4, h * 0.06);

  // Arm cannon (right side)
  ctx.fillStyle = SAMUS.shadow;
  ctx.fillRect(x + w * 0.35, y - h * 0.5, w * 0.35, h * 0.12);

  // Legs
  ctx.fillStyle = SAMUS.legs;
  ctx.fillRect(x - w * 0.3, y - h * 0.1, w * 0.22, h * 0.1);
  ctx.fillRect(x + w * 0.08, y - h * 0.1, w * 0.22, h * 0.1);
}

/**
 * Draws Samus in the space jump / curled pose.
 * x = center X, y = bottom of bounding box.
 */
export function drawSamusJump(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1
): void {
  const w = 24 * scale;
  const h = 40 * scale; // shorter when curled

  // Body (slightly rotated forward lean)
  ctx.save();
  ctx.translate(x, y - h * 0.5);
  ctx.rotate(-0.15);
  ctx.fillStyle = SAMUS.body;
  ctx.fillRect(-w * 0.35, -h * 0.35, w * 0.7, h * 0.4);
  ctx.restore();

  // Helmet
  ctx.fillStyle = SAMUS.body;
  ctx.beginPath();
  ctx.arc(x, y - h * 0.78, w * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Visor
  ctx.fillStyle = SAMUS.visor;
  ctx.fillRect(x - w * 0.2, y - h * 0.83, w * 0.4, h * 0.06);

  // Arm cannon extended further
  ctx.fillStyle = SAMUS.shadow;
  ctx.fillRect(x + w * 0.3, y - h * 0.55, w * 0.45, h * 0.11);

  // Legs tucked up
  ctx.fillStyle = SAMUS.legs;
  ctx.fillRect(x - w * 0.2, y - h * 0.15, w * 0.18, h * 0.15);
  ctx.fillRect(x + w * 0.02, y - h * 0.15, w * 0.18, h * 0.15);
}
