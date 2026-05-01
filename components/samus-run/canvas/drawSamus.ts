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
  isAirborne: boolean
): void {
  const { cellSize, contentSize, contentOffset, runRight, screwAttackL } = SPRITE_LAYOUT;

  const section = isAirborne ? screwAttackL : runRight;
  const frameIndex = (animState?.frame ?? 0) % section.frames;

  // sx: +1 skips the 1px black cell-border pixel at x=contentOffset (confirmed via pixel inspection).
  // sw: -6 preserves right edge at (sx+sw=93) after the +1 shift.
  // sh: 56 = contentSize-25 — cuts the 2-px solid-black bottom border (rows 56-57) and all
  //     transparent rows between feet and border; rows 0-55 span head through feet.
  // dy: anchored to feet row 42 within the source rect so Samus stands on the floor (y = samusY).
  const sx = Math.floor(frameIndex * cellSize + contentOffset + 1);
  const sy = Math.floor(section.sy + contentOffset);
  const sw = contentSize - 6;
  const sh = contentSize - 25; // 56 — head(0) to just before black border(56)
  const FOOT_ROW = 42;         // last meaningful foot content row (pixel-inspected)

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
