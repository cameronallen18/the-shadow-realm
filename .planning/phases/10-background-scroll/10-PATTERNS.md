# Phase 10: Background Scroll - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 3 (all modified, none created)
**Analogs found:** 3 / 3

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `components/samus-run/constants.ts` | config | static | Same file — existing constant blocks | exact |
| `components/samus-run/canvas/drawEnvironment.ts` | utility/renderer | request-response | `components/samus-run/canvas/drawSamus.ts` — `drawSamusSprite` | role-match |
| `components/samus-run/SamusRunGame.tsx` | component | event-driven / rAF | Same file — `animState` closure pattern inside Effect B | exact |

---

## Pattern Assignments

### `components/samus-run/constants.ts` (config, static)

**Analog:** Same file — existing constant group blocks.

**Current import structure** (lines 1-0, no imports — constants only):
```typescript
// No imports — pure constant declarations
```

**Pattern to follow — adding a standalone top-level constant** (lines 44-44):
```typescript
// Horizontal spacing between obstacles — fixed px so gap stays consistent across screen widths.
export const OBSTACLE_SPACING_PX = 480;
```

**Pattern to follow — adding to a named object group** (lines 32-40):
```typescript
export const PHYSICS = {
  gravity: 1200,            // CSS px/s^2 — downward acceleration
  jumpVelocity: 520,        // CSS px/s — upward velocity applied on tap (Flappy Bird style)
  terminalVelocity: 900,    // CSS px/s — max downward speed
  baseScrollSpeed: 220,     // CSS px/s — obstacle scroll speed at multiplier=1
  speedIncrement: 0.15,     // added to speedMultiplier every 10 obstacles cleared
  maxSpeedMultiplier: 2.5,  // cap — game becomes unplayable beyond ~2.5x
  dtCap: 0.05,              // max delta-time in seconds (prevents teleport on tab-switch)
} as const;
```

**What to add for Phase 10:**
- `BG_SCROLL_SPEED = 70` — standalone export (matches `OBSTACLE_SPACING_PX` pattern: not grouped, one line, inline comment explaining CSS px/s unit and independence from speedMultiplier)
- `TILE_WIDTH = 512` — standalone export (same pattern: one line, inline comment noting natural width of `norfair_upper.png`)
- Place both after `OBSTACLE_SPACING_PX` and before `COLLISION`, keeping the logical ordering (gameplay tuning → layout → collision)

---

### `components/samus-run/canvas/drawEnvironment.ts` (utility/renderer, request-response)

**Analog:** `components/samus-run/canvas/drawSamus.ts` — specifically `drawSamusSprite` for the `ctx.save()` / `imageSmoothingEnabled = false` / `Math.floor()` / `ctx.restore()` pattern.

**Current full file** (lines 1-57) — this is the base to extend:
```typescript
import { NORFAIR } from "../constants";

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
  // ... lava + shimmer + ground line + stalactites unchanged
}
```

**Pixel-perfect draw pattern to copy from `drawSamusSprite`** (lines 128-131 of `drawSamus.ts`):
```typescript
ctx.save();
ctx.imageSmoothingEnabled = false;
ctx.drawImage(spritesCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
ctx.restore();
```

**Math.floor() on all drawImage coordinates** (lines 117-126 of `drawSamus.ts`):
```typescript
const sx = Math.floor(frameIndex * cellSize + contentOffset);
const sy = Math.floor(section.sy + contentOffset);
// ...
const dx = Math.floor(x - dw / 2);
const dy = Math.floor(y - dh);
```

**What to add / change for Phase 10:**

1. Update `import` to include `BG_SCROLL_SPEED` and `TILE_WIDTH` from `../constants` (these are used inside `drawBackground`).

2. Add a new private `drawBackground` helper before `drawEnvironment`:
```typescript
function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: HTMLImageElement,
  width: number,
  height: number,
  offset: number
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const tileH = Math.floor(height);
  const startX = -Math.floor(offset);

  for (let x = startX; x < width; x += TILE_WIDTH) {
    ctx.drawImage(bg, Math.floor(x), 0, TILE_WIDTH, tileH);
  }

  ctx.restore();
}
```

3. Extend `drawEnvironment` signature and replace sky/midground fills with a `bg` branch:
```typescript
export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg?: HTMLImageElement | null,
  bgOffset?: number
): void {
  if (bg) {
    drawBackground(ctx, bg, width, height, bgOffset ?? 0);
  } else {
    // Fallback: existing solid fills (D-11 — no regression)
    ctx.fillStyle = NORFAIR.sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = NORFAIR.midground;
    ctx.fillRect(0, 0, width, height * 0.3);
  }

  // Lava floor (bottom 15%) — always drawn on top of background
  const floorY = height * 0.85;
  // ... rest of lava/shimmer/ground line/stalactites exactly as before
}
```

**Import line to update** (line 1 of `drawEnvironment.ts`):
```typescript
import { NORFAIR, TILE_WIDTH } from "../constants";
```
(`BG_SCROLL_SPEED` is not needed inside `drawEnvironment` — offset accumulation lives in the caller.)

---

### `components/samus-run/SamusRunGame.tsx` (component, event-driven/rAF)

**Analog:** Same file — the existing `animState` closure pattern inside Effect B is the exact template to follow for `bgScrollOffset`.

**`animState` closure pattern to copy** (lines 181-186):
```typescript
// AnimState lives in Effect B closure per D-10 — auto-resets on game restart
const animState = {
  frame: 0,
  accumulator: 0,
  isScrewAttack: false,
};
```
`bgScrollOffset` follows the same idiom: declare as `let bgScrollOffset = 0` directly inside Effect B, alongside `animState`. Auto-resets to 0 on game restart because Effect B re-runs when `state.screen` changes to `"playing"`.

**Frame advancement pattern to follow** (lines 238-243 — `animState.accumulator` advance):
```typescript
animState.accumulator += dt;
if (animState.accumulator >= FRAME_DURATION) {
  animState.accumulator -= FRAME_DURATION; // subtract, not reset — preserves leftover
  const section = isAirborne ? SPRITE_LAYOUT.screwAttackL : SPRITE_LAYOUT.runRight;
  animState.frame = (animState.frame + 1) % section.frames;
}
```
`bgScrollOffset` advance is simpler — one line, placed before the `drawScene` call each frame:
```typescript
bgScrollOffset = (bgScrollOffset + BG_SCROLL_SPEED * dt) % TILE_WIDTH;
```

**Current `drawScene` signature** (lines 54-62):
```typescript
function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  width: number,
  height: number,
  physics?: GamePhysicsState,
  sprites?: { samus: HTMLImageElement | null; bg: HTMLImageElement | null },
  animState?: { frame: number; accumulator: number; isScrewAttack: boolean }
): void {
```
Add `bgScrollOffset?: number` as the last optional parameter. All existing call sites remain valid (undefined = 0 fallback in `drawEnvironment`).

**Effect A call site** (line 147 — static render, no scroll):
```typescript
drawScene(ctx, state.screen, rect.width, rect.height, undefined, spritesRef.current, undefined);
```
Becomes:
```typescript
drawScene(ctx, state.screen, rect.width, rect.height, undefined, spritesRef.current, undefined, 0);
```
Or leave `bgScrollOffset` out — `undefined` is handled by `bgOffset ?? 0` inside `drawEnvironment`.

**Effect B call site** (line 259 — rAF loop, scrolling):
```typescript
drawScene(ctx, "playing", r.width, r.height, game, spritesRef.current, animState);
```
Becomes:
```typescript
drawScene(ctx, "playing", r.width, r.height, game, spritesRef.current, animState, bgScrollOffset);
```

**Inside `drawScene` body** — pass `bg` and `bgScrollOffset` through to `drawEnvironment` (line 64):
```typescript
// Current:
drawEnvironment(ctx, width, height);

// Phase 10:
drawEnvironment(ctx, width, height, sprites?.bg, bgScrollOffset);
```

**Import line to update** (line 9):
```typescript
// Current:
import { PHYSICS, GAME, SPRITE_LAYOUT } from "./constants";

// Phase 10 — add BG_SCROLL_SPEED and TILE_WIDTH:
import { PHYSICS, GAME, SPRITE_LAYOUT, BG_SCROLL_SPEED, TILE_WIDTH } from "./constants";
```

---

## Shared Patterns

### Pixel-Perfect Canvas Draw
**Source:** `components/samus-run/canvas/drawSamus.ts`, lines 128-131
**Apply to:** `drawBackground` helper in `drawEnvironment.ts`
```typescript
ctx.save();
ctx.imageSmoothingEnabled = false;
// all drawImage args through Math.floor()
ctx.restore();
```

### Closure Variable in Effect B (auto-reset on restart)
**Source:** `components/samus-run/SamusRunGame.tsx`, lines 181-186
**Apply to:** `bgScrollOffset` variable in Effect B
```typescript
// Declare inside useEffect(() => { ... }, [state.screen])
// so it resets to 0 every time the playing screen mounts
let bgScrollOffset = 0;
```

### Optional Parameter with ?? Fallback
**Source:** `components/samus-run/SamusRunGame.tsx`, lines 54-62 (existing optional params pattern)
**Apply to:** `bgOffset?: number` in `drawEnvironment`, `bgScrollOffset?: number` in `drawScene`
```typescript
// Consumer of optional param uses nullish coalescing:
drawBackground(ctx, bg, width, height, bgOffset ?? 0);
```

### dt-based Frame Advancement
**Source:** `components/samus-run/SamusRunGame.tsx`, lines 196, 238-243
**Apply to:** `bgScrollOffset` accumulation in Effect B loop
```typescript
const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, PHYSICS.dtCap);
// ... later, before drawScene:
bgScrollOffset = (bgScrollOffset + BG_SCROLL_SPEED * dt) % TILE_WIDTH;
```

---

## No Analog Found

None. All three modified files are self-analogous or have strong role-match analogs within the same codebase.

---

## Metadata

**Analog search scope:** `components/samus-run/` (all files read directly)
**Files scanned:** 4 source files (`constants.ts`, `drawEnvironment.ts`, `drawSamus.ts`, `SamusRunGame.tsx`)
**Pattern extraction date:** 2026-04-27
