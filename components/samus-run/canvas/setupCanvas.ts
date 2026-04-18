/**
 * Sizes a canvas to match its CSS layout size * devicePixelRatio,
 * then scales the 2D context so draw calls use CSS-pixel coordinates.
 *
 * MUST be called on every resize because setting canvas.width/height
 * resets all context state (transforms, smoothing, styles).
 */
export function setupCanvas(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) return null;

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;

  return ctx;
}
