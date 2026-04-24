# Architecture Research — Sprite Animation + Background Integration

**Domain:** Canvas game loop sprite sheet animation and level background rendering
**Researched:** 2026-04-23
**Confidence:** HIGH — derived from direct inspection of all existing source files

---

## System Overview: Current vs After Integration

### Current Architecture

```
SamusRunGame.tsx (React)
  useReducer: screen, score, highScore
  useRef: canvasRef, gameRef, screenRef, scoreDisplayRef, audioRef
  Effect A: static render (idle/gameover) + ResizeObserver
  Effect B: rAF loop (playing only)
    └─ updateGame(game, dt, w, h)          [gameLoop.ts — pure physics]
    └─ drawScene(ctx, screen, w, h, game)  [local fn in SamusRunGame.tsx]
         └─ drawEnvironment(ctx, w, h)     [canvas/drawEnvironment.ts]
         └─ drawRockWall(...)              [canvas/drawObstacleShape.ts]
         └─ drawSamusIdle/Jump(...)        [canvas/drawSamus.ts]
  Effect C: input listeners (mount only)
  audioManager.ts: standalone, triggered by input and game events
```

### After Integration

```
SamusRunGame.tsx (React)
  useReducer: screen, score, highScore         [unchanged]
  useRef: canvasRef, gameRef, screenRef,       [unchanged refs]
          scoreDisplayRef, audioRef,
          spritesRef                           [NEW: { samus, bg } HTMLImageElement refs]
  Effect A: static render + ResizeObserver     [signature change: pass spritesRef]
  Effect B: rAF loop (playing only)
    local vars: lastTs, lastScore              [unchanged]
    local vars: anim (AnimState)              [NEW — frame-scoped, resets each game]
                bgOffset (number)             [NEW — frame-scoped, resets each game]
    └─ updateGame(game, dt, w, h)             [gameLoop.ts — UNCHANGED]
    └─ updateAnimation(anim, dt, game)        [NEW — canvas/animState.ts]
    └─ bgOffset += speed * game.speedMultiplier * dt  [NEW — inline in loop]
    └─ drawScene(ctx, screen, w, h, game,     [extended signature]
                 anim, bgOffset,
                 spritesRef.current)
         └─ drawEnvironment(ctx, w, h,        [MODIFIED — scrollOffset, bgImage params]
                            bgOffset,
                            sprites.bg)
         └─ drawRockWall(...) or              [MODIFIED — sprite fallback added]
            drawObstacleSprite(...)           [NEW canvas/drawObstacleSprite.ts]
         └─ drawSamusSprite(...) or           [NEW canvas/drawSamusSprite.ts]
            drawSamusIdle/Jump(...)           [kept as fallback]
  Effect D: asset loading (mount only)        [NEW — loads samus.png, bg.png into spritesRef]
  Effect C: input listeners (mount only)      [unchanged]
  audioManager.ts                             [unchanged]
```

---

## Component Responsibilities

| File | Action | Responsibility |
|------|--------|----------------|
| `gameLoop.ts` | **Unchanged** | Pure physics: samusY, samusVY, obstacles, collision, scoring, speedMultiplier. Zero rendering knowledge. |
| `SamusRunGame.tsx` | **Modified** | Add Effect D (asset loading), `spritesRef`, `anim` and `bgOffset` locals in Effect B, extended `drawScene` signature |
| `canvas/drawEnvironment.ts` | **Modified** | Accept `scrollOffset` and `bgImage` params. Tile-draw background when image loaded; fall back to solid fills when not. |
| `canvas/drawSamus.ts` | **Kept unchanged** | Shape-based Samus (fallback). Not deleted until sprites confirmed working in production. |
| `canvas/drawSamusSprite.ts` | **New** | Sprite-based Samus: slices correct frame from sheet, draws at position with scale. Primary path when image loaded. |
| `canvas/drawObstacleSprite.ts` | **New (Phase E, optional)** | Textured obstacle columns using tilesheet slice. Cosmetic only — physics geometry unchanged. |
| `canvas/spriteSheet.ts` | **New** | `loadImage(url): Promise<HTMLImageElement>` helper. `SpriteSheet` type with frame layout. |
| `canvas/animState.ts` | **New** | `AnimState` interface. `updateAnimation(anim, dt, physics)` function. |
| `constants.ts` | **Modified** | Add `SPRITE_FRAMES` (frame counts per mode), `SPRITE_FPS` (playback rate per mode), `SPRITE_LAYOUT` (sheet dimensions, frame size). |

---

## Recommended File Structure After Integration

```
components/samus-run/
├── SamusRunGame.tsx          # modified
├── gameLoop.ts               # UNCHANGED
├── audioManager.ts           # unchanged
├── constants.ts              # modified — sprite frame constants added
└── canvas/
    ├── setupCanvas.ts        # unchanged
    ├── drawEnvironment.ts    # modified — scrollOffset + bgImage params
    ├── drawSamus.ts          # kept — shape fallback, not deleted
    ├── animState.ts          # NEW — AnimState interface + updateAnimation
    ├── spriteSheet.ts        # NEW — loadImage helper + SpriteSheet type
    ├── drawSamusSprite.ts    # NEW — sprite-based Samus draw
    └── drawObstacleSprite.ts # NEW (Phase E, optional)

public/sprites/
    ├── samus.png             # sprite sheet — downloaded, committed to repo
    └── norfair-bg.png        # background image (or tileset)
```

`public/sprites/` is served at `/sprites/samus.png` in dev and production on Vercel. No config needed — Next.js serves `public/` as static assets at root URL by default.

---

## Architectural Patterns

### Pattern 1: Animation State Lives in the rAF Closure

**What:** `AnimState` is declared as a local `let` variable inside Effect B, alongside `lastTs` and `lastScore`. It is updated by `updateAnimation` each frame and reset automatically when Effect B re-runs (on game restart).

**When to use:** Always for this project. This is the correct location because:
- Animation state is frame-scoped — it has no meaning between game sessions
- It must not be in `GamePhysicsState` (rendering concern in physics module)
- It must not be a React ref (would persist across restarts, causing stale frame index on new game)
- It must not be React state (re-renders on every frame update would destroy performance)

**Trade-offs:** Resetting on restart is automatic and free. The animation state cannot be inspected outside the rAF closure, which is fine — nothing else needs it.

```typescript
// Inside Effect B in SamusRunGame.tsx
const anim: AnimState = { mode: "idle", frame: 0, timer: 0 };
let bgOffset = 0;
let lastTs: number | null = null;
let lastScore = 0;

function loop(ts: number) {
  const game = gameRef.current;
  if (!game) return;
  const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, PHYSICS.dtCap);
  lastTs = ts;

  updateGame(game, dt, w, h);                              // physics, unchanged
  updateAnimation(anim, dt, game);                         // derive mode, advance frame
  bgOffset = (bgOffset + PHYSICS.baseScrollSpeed * game.speedMultiplier * dt)
             % BG_IMAGE_WIDTH;                             // scroll accumulation

  const ctx = setupCanvas(cvs);
  if (ctx) {
    drawScene(ctx, "playing", w, h, game, anim, bgOffset, spritesRef.current);
  }
  ...
}
```

### Pattern 2: Animation Mode Derived from PhysicsState Each Frame

**What:** `updateAnimation` reads `GamePhysicsState` (samusVY, samusY, gameOver) to determine which animation clip to run. If the mode changes, frame and timer reset to 0. Then the frame timer advances by `dt`; when it exceeds `1/fps`, frame increments and wraps.

**When to use:** Always. The physics → animation dependency is one-directional and read-only.

```typescript
// canvas/animState.ts
export type AnimMode = "idle" | "run" | "jump" | "screw_attack";

export interface AnimState {
  mode: AnimMode;
  frame: number;
  timer: number;
}

export function updateAnimation(
  anim: AnimState,
  dt: number,
  physics: GamePhysicsState
): void {
  const next = deriveMode(physics);
  if (next !== anim.mode) {
    anim.mode = next;
    anim.frame = 0;
    anim.timer = 0;
  }
  const fps = SPRITE_FPS[anim.mode];
  const frameCount = SPRITE_FRAMES[anim.mode];
  anim.timer += dt;
  if (anim.timer >= 1 / fps) {
    anim.timer -= 1 / fps;
    anim.frame = (anim.frame + 1) % frameCount;
  }
}

function deriveMode(physics: GamePhysicsState): AnimMode {
  // samusVY < 0 = moving up = jump
  if (physics.samusVY < -50) return "jump";
  // samusVY near zero but off floor = apex / screw attack
  // (screw attack can be triggered by separate flag if needed)
  return "idle";
}
```

### Pattern 3: Image Loading via useRef, Loaded Once on Mount

**What:** A single `useEffect` on mount (Effect D) creates `HTMLImageElement` objects and stores them in `spritesRef.current` when loaded. The rAF loop reads from the ref on each frame.

**When to use:** Always for image assets in a canvas game. Creating `new Image()` inside the rAF loop would re-request the image 60 times per second and `onload` would never fire reliably.

```typescript
// In SamusRunGame.tsx — new Effect D (mount only, before Effects A/B)
const spritesRef = useRef<{ samus: HTMLImageElement | null; bg: HTMLImageElement | null }>({
  samus: null,
  bg: null,
});

useEffect(() => {
  const samusImg = new Image();
  samusImg.onload = () => { spritesRef.current.samus = samusImg; };
  samusImg.src = "/sprites/samus.png";

  const bgImg = new Image();
  bgImg.onload = () => { spritesRef.current.bg = bgImg; };
  bgImg.src = "/sprites/norfair-bg.png";
  // No cleanup needed — Image load is fire-and-forget
}, []);
```

### Pattern 4: Background Scroll Offset as rAF Closure Local Variable

**What:** `bgOffset` advances each frame at the same pixel rate as obstacle scroll speed, using `game.speedMultiplier` so it speeds up in sync with obstacles. It is passed to `drawEnvironment` and used to tile the background image.

**Why not in GamePhysicsState:** Background scroll is a rendering concern. The physics engine does not care about background position. Keeping it out of `gameLoop.ts` preserves the separation between physics and rendering.

**Why not a useRef:** Same restart problem as AnimState. A `useRef` persists across game sessions; a local variable in Effect B resets to `0` when the effect re-runs on restart.

**Parallax (optional):** Pass separate offsets for different depth layers:

```typescript
const bgOffsetFar  = (bgOffsetFar  + speed * 0.3 * dt) % BG_FAR_W;
const bgOffsetMid  = (bgOffsetMid  + speed * 0.6 * dt) % BG_MID_W;
// obstacles scroll at 1x already via physics
```

**Background tiling in drawEnvironment:**

```typescript
// canvas/drawEnvironment.ts — modified signature
export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scrollOffset: number = 0,       // NEW param, default 0 preserves existing calls
  bgImage: HTMLImageElement | null = null  // NEW param
): void {
  if (bgImage) {
    const imgW = bgImage.naturalWidth;
    const imgH = bgImage.naturalHeight;
    const x1 = -(scrollOffset % imgW);
    ctx.drawImage(bgImage, x1, 0, imgW, height);
    // Second copy to fill the gap on the right
    if (x1 + imgW < width) {
      ctx.drawImage(bgImage, x1 + imgW, 0, imgW, height);
    }
  } else {
    // Existing solid-fill background — unchanged
    ctx.fillStyle = NORFAIR.sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = NORFAIR.midground;
    ctx.fillRect(0, 0, width, height * 0.3);
  }
  // Lava floor, ceiling detail — drawn on top of background, always
  ...
}
```

The existing `drawEnvironment(ctx, width, height)` call in `drawScene` continues to work unchanged because both new params have defaults.

### Pattern 5: Graceful Fallback at Every Sprite Draw Call

**What:** Every location that draws Samus or obstacles checks whether the sprite image is loaded before using it. If not loaded, it calls the existing shape-drawing function.

**When to use:** Always. On slow connections the image may not load before the first game starts. The shape fallback ensures the game is always playable, even if ugly.

```typescript
// In drawScene (SamusRunGame.tsx)
const samusImg = spritesRef.current.samus;
if (samusImg) {
  drawSamusSprite(ctx, samusImg, anim, samusX, physics.samusY, GAME.samusScale);
} else {
  // Existing shape fallback
  if (physics.samusVY < 0) {
    drawSamusJump(ctx, samusX, physics.samusY, GAME.samusScale);
  } else {
    drawSamusIdle(ctx, samusX, physics.samusY, GAME.samusScale);
  }
}
```

---

## Sprite Drawing Implementation

### Frame Slice from Sheet

```typescript
// canvas/drawSamusSprite.ts
import { SPRITE_LAYOUT } from "../constants";

export function drawSamusSprite(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  anim: AnimState,
  x: number,
  y: number,
  scale: number
): void {
  const layout = SPRITE_LAYOUT[anim.mode];
  const srcX = anim.frame * layout.frameW;
  const srcY = layout.row * layout.frameH;
  const destW = layout.frameW * scale;
  const destH = layout.frameH * scale;
  // x/y is center-bottom (matching existing shape draw conventions)
  ctx.drawImage(
    sheet,
    srcX, srcY, layout.frameW, layout.frameH,   // source rect
    x - destW / 2, y - destH, destW, destH      // dest rect
  );
}
```

### Frame Layout Constants (to add to constants.ts)

```typescript
// Frame counts and playback rates — fill in after sprite sheet is obtained
export const SPRITE_FRAMES: Record<AnimMode, number> = {
  idle: 4,         // breathing animation: typically 4-6 frames
  run: 6,          // run cycle (if used)
  jump: 3,         // jump arc frames
  screw_attack: 8, // screw attack spin
};

export const SPRITE_FPS: Record<AnimMode, number> = {
  idle: 6,
  run: 10,
  jump: 8,
  screw_attack: 14,
};

// Filled in after sprite sheet dimensions are confirmed from rip source
export const SPRITE_LAYOUT: Record<AnimMode, { row: number; frameW: number; frameH: number }> = {
  idle:         { row: 0, frameW: 32, frameH: 48 },
  run:          { row: 1, frameW: 32, frameH: 48 },
  jump:         { row: 2, frameW: 32, frameH: 48 },
  screw_attack: { row: 3, frameW: 48, frameH: 48 },
};
```

These values are placeholders — exact values must be filled in after the sprite sheet is downloaded and its frame layout confirmed (row count, frame dimensions, padding pixels). The constants structure is the right shape regardless.

---

## Data Flow

### Per-Frame Render Flow

```
rAF tick (ts)
    ↓
dt = min((ts - lastTs) / 1000, PHYSICS.dtCap)
    ↓
updateGame(game, dt, w, h)
  → mutates: samusY, samusVY, obstacles, obstaclesCleared,
             speedMultiplier, gameOver, pendingJump
    ↓
updateAnimation(anim, dt, game)
  → reads: game.samusVY (to derive mode)
  → mutates: anim.mode, anim.frame, anim.timer
    ↓
bgOffset += PHYSICS.baseScrollSpeed * game.speedMultiplier * dt
bgOffset %= bgImageWidth
    ↓
drawScene(ctx, screen, w, h, game, anim, bgOffset, sprites)
    ├── drawEnvironment(ctx, w, h, bgOffset, sprites.bg)
    │     IF sprites.bg: tiled drawImage at -bgOffset
    │     ELSE: solid fill fallback (existing code path)
    ├── for each obs in game.obstacles:
    │     drawRockWall(ctx, obs.x, ...) [existing — unchanged]
    │     OR drawObstacleSprite (Phase E)
    └── IF sprites.samus loaded:
          drawSamusSprite(ctx, sprites.samus, anim, samusX, game.samusY, scale)
        ELSE:
          drawSamusIdle/Jump (existing shape functions)
```

### State Ownership

| State | Owner | Rationale |
|-------|-------|-----------|
| `samusY`, `samusVY`, `obstacles`, `gameOver`, `speedMultiplier`, `obstaclesCleared` | `gameRef.current` (GamePhysicsState) | Physics domain — pure function |
| `screen`, `score`, `highScore` | `useReducer` | React screen transitions trigger re-renders |
| `anim.mode`, `anim.frame`, `anim.timer` | local var in Effect B closure | Rendering domain, auto-resets each game start |
| `bgOffset` | local var in Effect B closure | Rendering domain, auto-resets each game start |
| `spritesRef.current.samus`, `.bg` | `useRef` in component | Loaded once; available across effects without re-renders |

---

## Build Order (Suggested Phases)

### Phase A: Asset Pipeline

1. Scout and download sprite sheet to `public/sprites/samus.png`
2. Scout and download background image to `public/sprites/norfair-bg.png`
3. Create `canvas/spriteSheet.ts` with `loadImage(url)` helper and `SpriteSheet` type stub
4. Add Effect D to `SamusRunGame.tsx` — load both images into `spritesRef`
5. Verify images load in browser network tab (no rendering change yet)

**Exit criterion:** Both images load with HTTP 200 from `/sprites/`. No canvas changes.

### Phase B: Animation State Machine

1. Define `AnimState` interface and `updateAnimation` in `canvas/animState.ts`
2. Add `SPRITE_FRAMES`, `SPRITE_FPS`, `SPRITE_LAYOUT` stubs to `constants.ts` (values can be placeholder until sheet is measured)
3. Add `anim` local variable in Effect B, call `updateAnimation(anim, dt, game)` in loop
4. Console-log `anim.mode` and `anim.frame` each frame for one test session
5. Verify: mode transitions idle→jump on tap, jump→idle on landing

**Exit criterion:** Console output confirms correct mode transitions. Zero visual change.

### Phase C: Samus Sprite Drawing

1. Measure the downloaded sprite sheet: frame width, frame height, row per animation, pixel padding
2. Fill in `SPRITE_LAYOUT` constants with real values
3. Create `canvas/drawSamusSprite.ts`
4. In `drawScene`, add sprite/fallback branch: if `spritesRef.current.samus`, call `drawSamusSprite`; else existing shape functions
5. Pass `anim` and `spritesRef.current` to `drawScene`
6. Test: sprite Samus appears, animates on idle/jump, shape fallback visible if image is cleared from network

**Exit criterion:** Sprite Samus renders, animates correctly, no physics regression (collision hitbox unchanged — sprite is purely cosmetic).

**Critical:** Collision constants (`COLLISION.samusWidth`, `COLLISION.samusHeight`) in `gameLoop.ts` represent the gameplay hitbox and are independent of the sprite sheet dimensions. The sprite can be any size — hitbox stays at 28×36px until explicitly tuned.

### Phase D: Background Scrolling

1. Measure background image width for wrap calculation
2. Modify `drawEnvironment` signature to accept `scrollOffset` and `bgImage`
3. Add `bgOffset` local variable to Effect B, accumulate each frame
4. Pass `bgOffset` and `spritesRef.current.bg` into `drawScene` → `drawEnvironment`
5. Test: background scrolls. Speed matches obstacles. On restart, bgOffset resets to 0.
6. Verify: existing solid-fill background still renders when image is null

**Exit criterion:** Parallax background scrolls in sync with obstacle speed. Restart starts from offset 0 without visual jump.

### Phase E: Obstacle Textures (optional, lowest priority)

1. Create `canvas/drawObstacleSprite.ts`
2. Wire into `drawScene` with same fallback pattern as Samus
3. Obstacle physics geometry (`obs.x`, `obs.gapTop`, `obs.gapBottom`, `GAME.obstacleWidth`) is unchanged — only the draw call changes

**Exit criterion:** Textured obstacles render. Collision behavior unchanged (verified by gameplay test).

---

## Anti-Patterns

### Anti-Pattern 1: Adding Animation Fields to GamePhysicsState

**What people do:** Add `currentFrame: number` and `frameTimer: number` to `GamePhysicsState` in `gameLoop.ts`.

**Why it's wrong:** Couples rendering to physics. `updateGame` is a pure physics function — it must not know about frame rates or sprite sheets. The physics object would need to import sprite constants. Testing physics independently becomes impossible.

**Do this instead:** `AnimState` in the rAF closure. `updateAnimation` reads physics as input but lives in `canvas/`.

### Anti-Pattern 2: Loading Images Inside the rAF Loop

**What people do:** `new Image()` inside `drawScene` or `loop()` because the image ref is null.

**Why it's wrong:** Creates a new `Image` object every frame (60/s). `onload` never fires reliably. No caching. Immediate crash-level performance problem.

**Do this instead:** Effect D on mount. Store in `useRef`. Read on each frame.

### Anti-Pattern 3: bgOffset in useRef at Component Level

**What people do:** `const bgOffsetRef = useRef(0)` at the top of the component, mutate in Effect B.

**Why it's wrong:** `useRef` persists across Effect B re-runs. When the user restarts, Effect B re-runs with a fresh game but `bgOffsetRef.current` still holds the previous session's offset. The background snaps to a non-zero position at game start.

**Do this instead:** `let bgOffset = 0` inside Effect B. Automatically resets on each game start.

### Anti-Pattern 4: Fetching Sprites from External URLs at Runtime

**What people do:** `img.src = "https://www.spriters-resource.com/..."` directly in the image loader.

**Why it's wrong:** External sprite rip sites lack CORS headers. Canvas `drawImage` with a cross-origin image that didn't pass CORS will throw `SecurityError: The canvas has been tainted by cross-origin data`. The entire canvas becomes unreadable and all subsequent draw operations fail silently.

**Do this instead:** Download the file. Commit it to `public/sprites/`. Serve from same origin. Zero CORS risk.

### Anti-Pattern 5: Using imageRendering: "auto" on the Canvas

**What people do:** Remove or change `style={{ imageRendering: "pixelated" }}` on the canvas element.

**Why it's wrong:** The canvas is already set to `pixelated` in `SamusRunGame.tsx`. Removing it causes the browser to bilinear-interpolate pixel art when scaled — classic blurry sprite look. Super Metroid assets are pixel art and require nearest-neighbor scaling.

**Do this instead:** Keep `imageRendering: "pixelated"` on the canvas element. Also pass `imageSmoothingEnabled = false` to the 2D context before any `drawImage` calls.

```typescript
// In setupCanvas.ts or at the top of each draw frame
ctx.imageSmoothingEnabled = false;
```

---

## Integration Points

### New vs Modified Files (Summary)

| File | Status | What Changes |
|------|--------|--------------|
| `components/samus-run/canvas/animState.ts` | **New** | AnimState type, updateAnimation function |
| `components/samus-run/canvas/spriteSheet.ts` | **New** | loadImage helper, SpriteSheet type |
| `components/samus-run/canvas/drawSamusSprite.ts` | **New** | Sprite-based Samus draw (primary path) |
| `components/samus-run/canvas/drawObstacleSprite.ts` | **New (Phase E)** | Textured obstacle columns |
| `components/samus-run/canvas/drawEnvironment.ts` | **Modified** | scrollOffset + bgImage params added; existing fallback preserved |
| `components/samus-run/SamusRunGame.tsx` | **Modified** | spritesRef, Effect D (loading), anim + bgOffset in Effect B, drawScene signature |
| `components/samus-run/constants.ts` | **Modified** | SPRITE_FRAMES, SPRITE_FPS, SPRITE_LAYOUT added |
| `public/sprites/samus.png` | **New asset** | Downloaded sprite sheet |
| `public/sprites/norfair-bg.png` | **New asset** | Background/tileset image |
| `components/samus-run/gameLoop.ts` | **Unchanged** | Physics — not touched |
| `components/samus-run/audioManager.ts` | **Unchanged** | Audio — not touched |
| `components/samus-run/canvas/drawSamus.ts` | **Kept unchanged** | Shape fallback — not deleted |
| `components/samus-run/canvas/drawObstacleShape.ts` | **Kept unchanged** | Shape obstacle fallback |
| `components/samus-run/canvas/setupCanvas.ts` | **Unchanged** | Only add `ctx.imageSmoothingEnabled = false` if not already set |

### Boundary: Physics → Animation (read-only)

`updateAnimation` imports `GamePhysicsState` type from `gameLoop.ts` to read `samusVY` and `samusY`. It never writes to `GamePhysicsState`. This is the only cross-module coupling introduced.

### Boundary: Animation → Drawing (parameter passing)

Draw functions receive `AnimState` as a parameter. They do not import it from a module-level singleton. This keeps draw functions pure (same inputs → same output) and testable.

### Boundary: React → rAF Loop (ref-based)

`spritesRef.current` is read by the rAF loop without going through React state or props. This is the established pattern in the existing code (see `gameRef.current`, `screenRef.current`) and is correct for performance-sensitive rendering.

---

## Sources

- MDN Canvas API — `drawImage`, `imageSmoothingEnabled`: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage — HIGH confidence (browser standard)
- MDN HTMLImageElement: https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement — HIGH confidence
- Next.js static file serving (`public/` folder): https://nextjs.org/docs/app/api-reference/file-conventions/public-folder — HIGH confidence
- Direct inspection of existing source files: `SamusRunGame.tsx`, `gameLoop.ts`, `drawEnvironment.ts`, `drawSamus.ts`, `drawObstacleShape.ts`, `constants.ts` — HIGH confidence (first-party)

---
*Architecture research for: Samus Run v1.2 — sprite sheet animation + background integration*
*Researched: 2026-04-23*
