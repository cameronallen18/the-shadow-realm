# Phase 9: Sprite Animation - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 4
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `components/samus-run/canvas/drawSamus.ts` | utility (draw) | request-response | same file — existing `drawSamusIdle` / `drawSamusJump` functions | exact (add alongside) |
| `components/samus-run/SamusRunGame.tsx` | component | event-driven + rAF | same file — Effect B rAF loop and `drawScene` | exact (extend in place) |
| `components/samus-run/constants.ts` | config | — | same file — `COLLISION` and `GAME` constants block | exact (update values) |
| `components/samus-run/gameLoop.ts` | service (physics) | batch/update | same file — `GamePhysicsState` interface and `createInitialGameState` | exact (add field) |

All four files are self-referential — Phase 9 extends existing code in the same files. The analogs are the current implementations being built upon.

---

## Pattern Assignments

### `components/samus-run/canvas/drawSamus.ts` — ADD `drawSamusSprite()`

**Analog:** existing functions `drawSamusIdle` and `drawSamusJump` in the same file.

**Imports pattern** (lines 1):
```typescript
import { SAMUS } from "../constants";
```
Phase 9 must ADD `SPRITE_LAYOUT`, `GAME`, `COLLISION` to this import, and the new function does not use `SAMUS` at all.

**Function signature pattern** (lines 7-12 and 49-54):
```typescript
export function drawSamusIdle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1
): void {
```
```typescript
export function drawSamusJump(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1
): void {
```
New `drawSamusSprite` follows the same `(ctx, x, y, scale)` base signature; adds `spritesCanvas: HTMLCanvasElement`, `animState: AnimState | undefined`, and `isAirborne: boolean` as additional parameters.

**Anchor convention — bottom-Y semantics** (lines 13-18 in `drawSamusIdle`):
```typescript
const w = 24 * scale;
const h = 48 * scale;

// Body core
ctx.fillStyle = SAMUS.body;
ctx.fillRect(x - w * 0.4, y - h * 0.6, w * 0.8, h * 0.5);
```
`y` is the bottom of the sprite. The sprite content is drawn upward from `y`. The new `drawSamusSprite` must use `dy = Math.floor(y - dh)` to anchor the bottom of the drawn image at `y`. This matches the shape-Samus convention exactly.

**ctx.save/restore pattern for canvas state** (lines 59-64 in `drawSamusJump`):
```typescript
ctx.save();
ctx.translate(x, y - h * 0.5);
ctx.rotate(-0.15);
ctx.fillStyle = SAMUS.body;
ctx.fillRect(-w * 0.35, -h * 0.35, w * 0.7, h * 0.4);
ctx.restore();
```
Use `ctx.save()` / `ctx.restore()` when mutating canvas state (`imageSmoothingEnabled`, `globalCompositeOperation`, `strokeStyle`). The screw attack overlay and DEBUG_HITBOX block both need this wrapper.

---

### `components/samus-run/SamusRunGame.tsx` — ADD AnimState, extend `drawScene`

**Analog:** Effect B rAF loop and `drawScene` function in the same file.

**Current `drawScene` signature** (lines 54-60):
```typescript
function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  width: number,
  height: number,
  physics?: GamePhysicsState
): void {
```
Phase 9 adds two trailing optional parameters:
```typescript
  sprites?: { samus: HTMLCanvasElement | null; bg: HTMLImageElement | null },
  animState?: { frame: number; accumulator: number; isScrewAttack: boolean }
```

**Current Samus draw branch inside `drawScene`** (lines 64-84):
```typescript
if (physics && screen === "playing") {
  // Dynamic obstacle positions from physics state
  for (const obs of physics.obstacles) {
    drawRockWall(ctx, obs.x, obs.gapTop, obs.gapBottom, GAME.obstacleWidth, height);
  }
  // Samus at physics-driven position
  const samusX = width * GAME.samusXRatio;
  const useJump = physics.samusVY < 0; // moving upward = jump sprite
  if (useJump) {
    drawSamusJump(ctx, samusX, physics.samusY, GAME.samusScale);
  } else {
    drawSamusIdle(ctx, samusX, physics.samusY, GAME.samusScale);
  }
} else {
  // Static idle/gameover scene (Phase 5 behavior preserved)
  const obstacleX = width * GAME.obstacleXRatio;
  drawRockWall(ctx, obstacleX, height * 0.15, height * 0.6, GAME.obstacleWidth, height);
  const samusX = width * GAME.samusXRatio;
  const samusY = height * GAME.floorRatio;
  drawSamusIdle(ctx, samusX, samusY, GAME.samusScale);
}
```
Both branches call a shape-draw function. Phase 9 replaces each call with: `if (sprites?.samus) { drawSamusSprite(...) } else { drawSamusIdle/drawSamusJump(...) }`.

**Effect B rAF loop — variable declaration zone** (lines 167-169):
```typescript
let rafId: number;
let lastTs: number | null = null;
let lastScore = 0;
```
`animState` is declared in this same zone, as a plain mutable object (not `useRef`), immediately before `rafId`. This matches D-10.

**Effect B rAF loop — full structure** (lines 171-214):
```typescript
function loop(ts: number) {
  const game = gameRef.current;
  if (!game) return;

  const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, PHYSICS.dtCap);
  lastTs = ts;

  updateGame(game, dt, canvasWidthRef.current, canvasHeightRef.current);

  // Sync live score ref and DOM display (avoids React re-render per frame)
  scoreRef.current = game.obstaclesCleared;
  if (scoreDisplayRef.current) {
    scoreDisplayRef.current.textContent = String(game.obstaclesCleared);
  }

  // Score sound — fires when obstaclesCleared increments
  if (game.obstaclesCleared > lastScore) {
    lastScore = game.obstaclesCleared;
    audioRef.current?.playScore();
  }

  const cvs = canvasRef.current;
  if (cvs) {
    const ctx = setupCanvas(cvs);
    if (ctx) {
      const r = cvs.getBoundingClientRect();
      canvasWidthRef.current = r.width;
      canvasHeightRef.current = r.height;
      drawScene(ctx, "playing", r.width, r.height, game);
    }
  }

  // Check game over (floor fall-through or future collision)
  if (game.gameOver) {
    audioRef.current?.playDeath();
    dispatch({ type: "GAME_OVER", score: game.obstaclesCleared });
    return; // stop loop
  }

  rafId = requestAnimationFrame(loop);
}
```
Phase 9 insertions within this loop:
1. After `updateGame(...)`: consume `game.pendingScrewAttack` and advance `animState` frames.
2. The `drawScene(...)` call site gains `spritesRef.current` and `animState` as trailing arguments.
3. WR-03 fix: move the `game.gameOver` check BEFORE the `drawScene` block (currently it is after).

**`handleInput` — playing branch** (lines 227-233):
```typescript
} else if (screenRef.current === "playing") {
  const game = gameRef.current;
  if (game) {
    triggerJump(game);
    audioRef.current.playJump();
  }
}
```
Phase 9 adds airborne detection here, before `triggerJump`:
```typescript
if (game.samusVY !== 0) {
  game.pendingScrewAttack = true;
}
```
WR-02 fix applies here too: `audioRef.current.playJump()` → `audioRef.current?.playJump()`.

**Effect A call site** (line 137):
```typescript
drawScene(ctx, state.screen, rect.width, rect.height);
```
Phase 9 extends to:
```typescript
drawScene(ctx, state.screen, rect.width, rect.height, undefined, spritesRef.current, undefined);
```

**IN-03 fix — idle "tap to start" button** (lines 356-360):
```typescript
<button
  onClick={() => dispatch({ type: "START" })}
  className="text-[#ededed] text-xs uppercase tracking-widest py-3 px-4"
>
```
Replace `onClick={() => dispatch({ type: "START" })}` with `onClick={handleInput}`.

---

### `components/samus-run/constants.ts` — UPDATE `COLLISION.samusWidth` / `samusHeight`

**Analog:** existing `COLLISION` block in the same file.

**Current `COLLISION` block** (lines 47-51):
```typescript
export const COLLISION = {
  hitboxScale: 0.65,   // 65% of sprite size per D-04 (~60-70% range)
  samusWidth: 28,      // approximate sprite width in CSS pixels (from drawSamus dimensions)
  samusHeight: 36,     // approximate sprite height in CSS pixels (from drawSamus dimensions)
} as const;
```
`samusWidth` and `samusHeight` are the only values changing. `hitboxScale` stays at 0.65. Final values are determined by the DEBUG_HITBOX visual tuning workflow (D-07); placeholder range from RESEARCH.md: 30-45px wide, 40-55px tall.

**Current `SPRITE_LAYOUT` block** (lines 57-68) — READ ONLY, consumed not modified:
```typescript
export const SPRITE_LAYOUT = {
  cellSize: 96,
  contentSize: 81,
  contentOffset: 17,
  idle:         { sy: 49,   frames: 1 },
  spinJumpR:    { sy: 3249, frames: 9 },
  spinJumpL:    { sy: 3377, frames: 9 },
  screwAttackR: { sy: 3505, frames: 9 },
  screwAttackL: { sy: 3633, frames: 9 },
} as const;
```

**`GAME` block** (lines 23-29) — `samusScale` consumed in draw calls, not modified:
```typescript
export const GAME = {
  floorRatio: 0.85,
  samusXRatio: 0.2,
  obstacleXRatio: 0.65,
  obstacleWidth: 40,
  samusScale: 1,
} as const;
```

---

### `components/samus-run/gameLoop.ts` — ADD `pendingScrewAttack` to state

**Analog:** existing `pendingJump` field in `GamePhysicsState` and `createInitialGameState` in the same file.

**`GamePhysicsState` interface** (lines 12-20):
```typescript
export interface GamePhysicsState {
  samusY: number;
  samusVY: number;
  obstacles: Obstacle[];
  obstaclesCleared: number;
  speedMultiplier: number;
  gameOver: boolean;
  pendingJump: boolean;     // set true on first input; consumed by first loop frame
}
```
`pendingScrewAttack: boolean` is added after `pendingJump`, following the same naming convention and the same comment style.

**`createInitialGameState` return value** (lines 46-65):
```typescript
return {
  samusY: canvasHeight * GAME.floorRatio,
  samusVY: 0,
  obstacles: [
    {
      x: canvasWidth + 100,
      ...randomGap(canvasHeight),
      scored: false,
    },
    {
      x: canvasWidth + 100 + OBSTACLE_SPACING_PX,
      ...randomGap(canvasHeight),
      scored: false,
    },
  ],
  obstaclesCleared: 0,
  speedMultiplier: 1,
  gameOver: false,
  pendingJump: false,
};
```
`pendingScrewAttack: false` is added after `pendingJump: false` in this return object. If it is not initialized here, TypeScript will error because the interface requires it.

**`triggerJump` function** (lines 167-169) — READ ONLY, not modified:
```typescript
export function triggerJump(state: GamePhysicsState): void {
  state.samusVY = -PHYSICS.jumpVelocity; // Flappy Bird style — always apply, even mid-air
}
```
`handleInput` calls `triggerJump` after setting `game.pendingScrewAttack = true` when airborne. `triggerJump` itself is not modified.

---

## Shared Patterns

### `ctx.save()` / `ctx.restore()` for canvas state mutation
**Source:** `drawSamusJump` in `components/samus-run/canvas/drawSamus.ts` lines 59-64
**Apply to:** `drawSamusSprite` — wrap `imageSmoothingEnabled = false` + `drawImage`, screw attack overlay block, and DEBUG_HITBOX block each in their own save/restore pair (or one save/restore wrapping all three if `imageSmoothingEnabled` is set once at the top of the function).

### Optional-chaining null guard on `audioRef`
**Source:** `audioRef.current?.playScore()` at `SamusRunGame.tsx` line 189 (already uses optional chaining for `playScore`)
**Apply to:** `audioRef.current.playJump()` at line 231 — change to `audioRef.current?.playJump()` as part of WR-02 fix. The pattern `audioRef.current?.method()` is already established one line above in the same loop.

### `as const` on exported constant objects
**Source:** Every constant in `components/samus-run/constants.ts` (lines 11, 20, 29, 51, 68)
**Apply to:** Any new constant added to `constants.ts` (e.g., `SPIN_FPS` if promoted from a local variable to a module-level export).

### Floor detection via `canvasHeightRef * GAME.floorRatio`
**Source:** `updateGame` in `gameLoop.ts` line 90: `if (state.samusY >= canvasHeight * GAME.floorRatio)`
**Apply to:** `isOnFloor` check inside the Effect B loop for AnimState reset. Use `game.samusY >= canvasHeightRef.current * GAME.floorRatio - 1` (within 1px — matches clamp logic and avoids apex ambiguity per RESEARCH.md open question 2).

---

## No Analog Found

None. All four files are self-referential — Phase 9 extends the files it modifies. The existing code is the analog.

---

## Metadata

**Analog search scope:** `components/samus-run/` (all four files read in full)
**Files scanned:** 4
**Pattern extraction date:** 2026-04-24
