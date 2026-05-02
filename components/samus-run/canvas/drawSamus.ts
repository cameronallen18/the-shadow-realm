import { SPRITE_LAYOUT, COLLISION } from "../constants";

interface AnimState {
  frame: number;
  accumulator: number;
  isScrewAttack: boolean;
}

const DEBUG_HITBOX = false;

/**
 * Draws Samus from the sprite sheet.
 * x = center X, y = bottom Y (feet on floor).
 * Ground → running animation; air → screw attack spin.
 */
export function drawSamusSprite(
  ctx: CanvasRenderingContext2D,
  spritesCanvas: HTMLImageElement,
  x: number,
  y: number,
  scale: number,
  animState: AnimState | undefined,
  isAirborne: boolean,
  isIdle = false
): void {
  const { cellSize, contentSize, contentOffset, idle, runRight, screwAttackL } = SPRITE_LAYOUT;

  const section = isIdle ? idle : isAirborne ? screwAttackL : runRight;
  const frameIndex = (animState?.frame ?? 0) % section.frames;

  // sx: +1 skips the 1px black cell-border pixel at x=contentOffset (confirmed via pixel inspection).
  // sw: -6 preserves right edge at (sx+sw=93) after the +1 shift.
  // sh/footRow: per-section overrides for sections whose sprites don't fit the default 56px window.
  const sx = Math.floor(frameIndex * cellSize + contentOffset + 1);
  const sy = Math.floor(section.sy + contentOffset);
  const sw = contentSize - 6;
  const sh = (section as { sh?: number }).sh ?? (contentSize - 25);
  const FOOT_ROW = (section as { footRow?: number }).footRow ?? 42;

  const dw = Math.floor(sw * scale);
  const dx = Math.floor(x - dw / 2);
  const dy = Math.floor(y - FOOT_ROW * scale); // align feet row to y (floor position)

  const dh = Math.floor(sh * scale);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spritesCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();

  if (DEBUG_HITBOX) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.floor(x - COLLISION.samusWidth / 2),
      Math.floor(y - COLLISION.samusHeight),
      COLLISION.samusWidth,
      COLLISION.samusHeight
    );
    ctx.restore();
  }
}
