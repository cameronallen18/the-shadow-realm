# Phase 9: Sprite Animation - Research

**Researched:** 2026-04-24
**Domain:** Canvas 2D sprite sheet animation, frame-rate-independent game loop
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Screw attack frames play when the player jumps again while already airborne (`samusVY !== 0` at jump time).
- **D-02:** Screw attack is visual only — no physics change. `triggerJump()` continues applying velocity on every jump; no behavior change.
- **D-03:** AnimState closure tracks a boolean `isScrewAttack`. Flips `true` when a jump fires while airborne. Resets to `false` when Samus lands (`samusY` reaches floor).
- **D-04:** Real sprite replaces shape-Samus on all screens — idle, gameover, and playing — once `spritesRef.current.samus` is loaded.
- **D-05:** When `spritesRef.current.samus === null`, shape-Samus fallback renders on all screens. No error thrown.
- **D-06:** Always use right-facing frames (`spinJumpR`, `screwAttackR`). Left-facing sections are not used.
- **D-07:** Add a `DEBUG_HITBOX` flag to `drawScene` that renders a visible debug rect. Tune values visually until rect hugs the real sprite body, then bake final constants and remove the flag.
- **D-08:** `imageSmoothingEnabled = false` enforced on every draw call that uses the sprite sheet.
- **D-09:** All 8 `drawImage` arguments passed through `Math.floor()` — fractional pixel coords silently blur pixel art.
- **D-10:** `AnimState` lives in the rAF closure (not `useRef`), consistent with v1.2 roadmap decision.
- **D-11:** AnimState shape: `{ frame: number; accumulator: number; isScrewAttack: boolean }`.

### Claude's Discretion

- Frame advance rate (fps) for spin jump / screw attack animation — pick a value that looks good at 60/120Hz (8-12fps is typical for Super Metroid spin jump).
- Whether idle frame animates at 1fps or is completely static (single frame section — static is correct).
- Exact `drawImage` call signature and source rect calculations — use `SPRITE_LAYOUT` constants already in `constants.ts`.

### Deferred Ideas (OUT OF SCOPE)

- Left-facing jump frames (`spinJumpL`, `screwAttackL`) — available for a future directional-movement phase.
- Obstacle column texturing with Norfair rock sprites — cosmetic only, defer to v1.3+.
- Idle breathing animation — not present in Super Metroid ROM data.
- Background scroll (Phase 10).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANIM-01 | Samus displays the correct idle frame when standing on the floor | `SPRITE_LAYOUT.idle` has `sy=49, frames=1`. Single `drawImage` call from idle section when `samusVY === 0`. |
| ANIM-02 | Samus displays a looping spin jump animation while airborne (frame-rate independent via dt accumulator) | `SPRITE_LAYOUT.spinJumpR` has `sy=3249, frames=9`. dt-accumulator pattern documented below. |
| ANIM-03 | Screw attack is visually distinct from normal jump (spin frames + visual overlay) | `SPRITE_LAYOUT.screwAttackR` has `sy=3505, frames=9`. Overlay drawn over sprite via `ctx.fillStyle` with partial alpha. |
| ANIM-04 | Shape-based sprite fallback renders when PNGs are not yet loaded | `spritesRef.current.samus === null` guard — call `drawSamusIdle`/`drawSamusJump` as before. |
| QUAL-01 | Sprites render at pixel-perfect nearest-neighbor scaling (no bilinear blur) | `ctx.imageSmoothingEnabled = false` before every `drawImage`. CSS `image-rendering: pixelated` already set on canvas element. |
| QUAL-02 | Hitbox constants updated to match real sprite body dimensions after sprite swap | `DEBUG_HITBOX` flag draws debug rect; tune `COLLISION.samusWidth` / `COLLISION.samusHeight` visually, then remove flag. |
</phase_requirements>

---

## Summary

Phase 9 converts the Samus Run game from procedural shape rendering to sprite-sheet rendering. All foundational infrastructure is already in place from Phase 8: the sprite PNG (`samus.png`, 6496×4384, RGB color type 2 with magenta key color) is committed at `public/sprites/samus.png`, Effect D in `SamusRunGame.tsx` loads and converts it to an offscreen `HTMLCanvasElement` at `spritesRef.current.samus`, and `SPRITE_LAYOUT` in `constants.ts` contains all verified section origins and frame counts. The Phase 9 work is entirely within the draw layer — no new packages, no physics changes, no new React state.

The core implementation has three parts: (1) a new `drawSamusSprite` function in `drawSamus.ts` that accepts the offscreen canvas and an `AnimState` and calls `drawImage` with the correct 9-argument source-rect form; (2) `AnimState` added to the Effect B rAF closure to track the current frame index, dt accumulator, and screw attack flag; and (3) updates to the three `drawScene` call sites (Effect A static render, Effect B rAF loop, and the idle/gameover path) to pass `spritesRef.current` and `animState` through.

The only unknowns are the precise hitbox numbers (resolved via the DEBUG_HITBOX visual tuning workflow from D-07) and the exact frame advance rate (Claude's discretion — 10fps is the recommended starting value). Everything else is a deterministic implementation against already-measured constants.

**Primary recommendation:** Implement `drawSamusSprite` as a standalone function in `drawSamus.ts`, add `AnimState` to the Effect B closure, wire sprite draw into `drawScene`, apply `Math.floor()` to all `drawImage` arguments and `imageSmoothingEnabled = false`, then run the DEBUG_HITBOX workflow to update `COLLISION` constants.

---

## Standard Stack

### Core (no new packages — all Canvas 2D built-ins)

[VERIFIED: codebase grep] All capabilities used in Phase 9 are native browser Canvas 2D APIs. The zero-new-packages constraint from v1.2 Roadmap is fully satisfied.

| API | Purpose | Source |
|-----|---------|--------|
| `CanvasRenderingContext2D.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)` | 9-argument form — draw a sub-rect of a source canvas onto destination | Canvas 2D spec, built-in |
| `ctx.imageSmoothingEnabled = false` | Disable bilinear interpolation — required for pixel art | Canvas 2D spec, built-in |
| `Math.floor()` | Snap all drawImage coords to integers to prevent sub-pixel blur | JavaScript built-in |
| `HTMLCanvasElement` (offscreen) | `spritesRef.current.samus` — source for all sprite draws | Already created in Effect D |
| `dt` accumulator pattern | Frame-rate-independent animation timing | rAF loop pattern |

### No Installation Required

```
# Zero new packages. All APIs are browser built-ins available in all modern browsers.
# The existing package.json is unchanged.
```

---

## Architecture Patterns

### Recommended File Structure (changes only)

```
components/samus-run/
├── canvas/
│   └── drawSamus.ts          MODIFIED: add drawSamusSprite() alongside existing fallbacks
├── SamusRunGame.tsx           MODIFIED: AnimState in Effect B, spritesRef piped to drawScene
├── constants.ts               MODIFIED: COLLISION.samusWidth / samusHeight updated after D-07
└── gameLoop.ts                READ ONLY: samusVY / samusY read but not modified
```

### Pattern 1: 9-Argument drawImage Source Rect

**What:** The 9-argument form of `drawImage` copies a rectangular sub-region of the source into a destination rectangle on the canvas. This is the only correct way to render individual frames from a sprite sheet.

**When to use:** Every sprite draw call in Phase 9.

```typescript
// Source: Canvas 2D API — verified against MDN (ASSUMED training knowledge, pattern is stable)
// SPRITE_LAYOUT values from constants.ts — VERIFIED by codebase grep
ctx.imageSmoothingEnabled = false;  // MUST set before each drawImage call

const { cellSize, contentSize, contentOffset, spinJumpR } = SPRITE_LAYOUT;
const frameIndex = animState.frame; // 0-8 for spinJumpR

const sx = Math.floor(frameIndex * cellSize + contentOffset);
const sy = Math.floor(spinJumpR.sy + contentOffset);
const sw = contentSize; // 81
const sh = contentSize; // 81

const dw = Math.floor(contentSize * scale);
const dh = Math.floor(contentSize * scale);
const dx = Math.floor(x - dw / 2);         // center X anchor
const dy = Math.floor(y - dh);             // bottom Y anchor (samusY is bottom of sprite)

ctx.drawImage(spritesCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
```

**Critical:** `samusY` is "bottom of sprite" semantics (floor position) in the existing code. `dy = Math.floor(y - dh)` places the bottom of the drawn sprite at `samusY`. This must match the shape-Samus anchor convention.

### Pattern 2: dt-Accumulator Frame Advance

**What:** Accumulate elapsed seconds; when the accumulator exceeds a frame duration threshold, advance the frame index and subtract the threshold. This produces the same visual timing at 60Hz and 120Hz.

**When to use:** spinJumpR and screwAttackR animations — any looping multi-frame section.

```typescript
// Source: standard game loop pattern — ASSUMED (stable, widely documented)
const SPIN_FPS = 10; // 10fps — advance frame every 100ms
const FRAME_DURATION = 1 / SPIN_FPS;

// Inside rAF loop, after dt is calculated:
animState.accumulator += dt;
if (animState.accumulator >= FRAME_DURATION) {
  animState.accumulator -= FRAME_DURATION;
  animState.frame = (animState.frame + 1) % currentSection.frames; // loop
}
```

**Why `FRAME_DURATION` subtraction (not reset to 0):** Resetting to 0 discards leftover time and causes drift at non-integer frame rates. Subtracting preserves the remainder, keeping timing accurate across all refresh rates.

### Pattern 3: AnimState in rAF Closure (D-10)

**What:** `animState` is declared as a plain mutable object inside Effect B, not wrapped in `useRef`. It auto-resets whenever the effect re-runs (game restart transitions through `idle → playing`, which unmounts and remounts the effect).

```typescript
// Inside Effect B (useEffect with [state.screen] dep)
let animState = {
  frame: 0,
  accumulator: 0,
  isScrewAttack: false,
};

// Reset isScrewAttack on landing (inside loop, after updateGame):
const isOnFloor = game.samusY >= canvasHeightRef.current * GAME.floorRatio - 1;
if (isOnFloor) {
  animState.isScrewAttack = false;
  animState.frame = 0;
  animState.accumulator = 0;
}
```

**Why not useRef:** Per D-10, the design decision is that AnimState belongs to the game session, not the component lifecycle. Restart creates a fresh Effect B execution, giving a fresh `animState` for free.

### Pattern 4: isScrewAttack Set in handleInput

**What:** The `handleInput` callback is the only place where a mid-air jump can be detected. It has access to `gameRef.current.samusVY` to determine airborne status.

```typescript
// Inside handleInput, when screenRef.current === "playing":
const game = gameRef.current;
if (game) {
  // Detect mid-air jump BEFORE triggerJump resets velocity
  const isAirborne = game.samusVY !== 0;
  triggerJump(game);
  audioRef.current?.playJump();
  // animState is NOT directly accessible from handleInput (closure scope)
  // Solution: use a separate ref or flag on game state
}
```

**The scoping problem:** `animState` lives inside Effect B's closure, but `handleInput` is defined outside Effect B (in the component body). These closures do not share scope.

**Solution:** Add a thin bridge — either (a) expose `animState` via a `useRef` wrapper just for this cross-closure communication, or (b) add a `pendingScrewAttack` boolean to `GamePhysicsState` (like the existing `pendingJump` flag), which `handleInput` sets and Effect B's loop reads on the next frame. Option (b) is more consistent with the existing `pendingJump` pattern already in `gameLoop.ts`.

**Recommended approach (option b):**
```typescript
// In gameLoop.ts, add to GamePhysicsState:
pendingScrewAttack: boolean;

// In handleInput:
if (game.samusVY !== 0) {  // airborne at jump time
  game.pendingScrewAttack = true;
}

// In Effect B loop, after updateGame:
if (game.pendingScrewAttack) {
  animState.isScrewAttack = true;
  game.pendingScrewAttack = false;
}
```

### Pattern 5: drawScene Signature Extension (WR-01 Fix)

**What:** Phase 8 review identified that `spritesRef` is loaded but never passed to `drawScene` (WR-01). Phase 9 must fix this as part of wiring sprite draws.

```typescript
// Updated drawScene signature
function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  width: number,
  height: number,
  physics?: GamePhysicsState,
  sprites?: { samus: HTMLCanvasElement | null; bg: HTMLImageElement | null },
  animState?: { frame: number; accumulator: number; isScrewAttack: boolean }
): void

// Call site in Effect B:
drawScene(ctx, "playing", r.width, r.height, game, spritesRef.current, animState);

// Call site in Effect A (idle/gameover static render):
// animState is not in scope in Effect A — pass undefined; idle frame uses frame=0, isScrewAttack=false
drawScene(ctx, state.screen, rect.width, rect.height, undefined, spritesRef.current, undefined);
```

**Idle/gameover frame with no animState:** For the static render case (Effect A), pass `animState` as `undefined` and default to idle section frame 0.

### Pattern 6: DEBUG_HITBOX Overlay (D-07)

**What:** A compile-time flag that draws a colored rect over Samus's position using the current COLLISION constants. Used to visually tune hitbox values against the real sprite body.

```typescript
// In drawScene or drawSamusSprite:
const DEBUG_HITBOX = false; // flip to true locally to tune

if (DEBUG_HITBOX) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
  ctx.lineWidth = 1;
  const hw = COLLISION.samusWidth;
  const hh = COLLISION.samusHeight;
  ctx.strokeRect(
    Math.floor(x - hw / 2),
    Math.floor(y - hh),   // samusY is bottom, so top = y - height
    hw,
    hh
  );
  ctx.restore();
}
```

### Anti-Patterns to Avoid

- **Resetting accumulator to 0:** Use `accumulator -= FRAME_DURATION` not `accumulator = 0` — otherwise timing drifts at non-60Hz displays.
- **Passing `animState` as a `useRef`:** Per D-10, AnimState lives in the closure. Only the cross-boundary `pendingScrewAttack` flag on `GamePhysicsState` is the correct bridge.
- **Setting `imageSmoothingEnabled` once globally:** Context state is not persistent — set it immediately before each `drawImage` call that renders pixel art, not once at init.
- **Using `OffscreenCanvas` for the sprite source:** Effect D already avoids this (see the comment in `SamusRunGame.tsx` line 289) due to iOS Safari memory constraints. Do not change the implementation.
- **Floating-point `drawImage` arguments:** All 9 arguments must go through `Math.floor()`. Fractional px coordinates cause sub-pixel interpolation even with `imageSmoothingEnabled = false` in some browsers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sub-pixel blur on pixel art | Custom scaling transform | `ctx.imageSmoothingEnabled = false` + `Math.floor()` on all coords | One-liner; hand-rolled scaling is error-prone |
| Frame timing at variable refresh rate | Fixed-frame timer (`setInterval`) | dt accumulator in rAF loop | `setInterval` is not synchronized to display refresh; causes judder |
| Sprite source coordinates | Hardcoded magic numbers | `SPRITE_LAYOUT` constants (already measured and committed) | `SPRITE_LAYOUT` is source-of-truth; duplication risks drift |
| Cross-closure AnimState access | `window.animState` or module-level mutable | `pendingScrewAttack` flag on `GamePhysicsState` | Consistent with existing `pendingJump` pattern; clean reset on restart |

---

## Common Pitfalls

### Pitfall 1: Anchor Point Mismatch (y semantics)

**What goes wrong:** Sprite draws at the wrong vertical position — floats above the floor or is buried half-underground.
**Why it happens:** `samusY` is "bottom of sprite" semantics. If `dy = y - dh/2` (center-anchor) instead of `dy = y - dh` (bottom-anchor), the sprite is offset by half its height.
**How to avoid:** `dy = Math.floor(y - dh)` where `dh = contentSize * scale`. Matches shape-Samus's anchor convention verified in `drawSamusIdle`: `y - h * 0.6` anchors the body bottom near `y`.
**Warning signs:** Samus visually hovering above the floor, or legs disappearing below the floor line.

### Pitfall 2: imageSmoothingEnabled Resets Between Calls

**What goes wrong:** Pixel art looks blurry after the first few frames, or blurs intermittently.
**Why it happens:** `imageSmoothingEnabled` is a context state property. Some Canvas 2D implementations reset it or other callers set it back to `true`. `drawEnvironment` or future drawing functions may not be aware of the pixel-art requirement.
**How to avoid:** Set `ctx.imageSmoothingEnabled = false` immediately before each sprite `drawImage` call, not once at setup. CSS `image-rendering: pixelated` is already on the canvas element (verified in `SamusRunGame.tsx:341`) as a belt-and-suspenders defense, but `imageSmoothingEnabled` is the authoritative control for Canvas 2D.
**Warning signs:** Blurry sprite edges despite the CSS property being set.

### Pitfall 3: screwAttack and spinJump Sharing the Same AnimState

**What goes wrong:** Switching from spinJump to screwAttack mid-animation causes a frame skip or jump (frame index is out of range for the new section, or accumulator fires too soon).
**Why it happens:** Both sections have `frames: 9`, so frame index is always valid. But `accumulator` could be near the threshold when the section switches, causing the first screwAttack frame to advance almost immediately.
**How to avoid:** Reset `frame = 0` and `accumulator = 0` when `isScrewAttack` transitions from `false` to `true`. This gives a clean start to the screwAttack animation.

### Pitfall 4: Static Render (Effect A) Has No animState

**What goes wrong:** Calling `drawSamusSprite` from the idle/gameover code path crashes because `animState` is undefined.
**Why it happens:** `animState` lives in Effect B, not Effect A.
**How to avoid:** Pass `undefined` for `animState` in Effect A calls; `drawSamusSprite` defaults to idle section, frame 0 when `animState` is absent. No animation is needed on static screens.

### Pitfall 5: spritesRef May Still Be null on First Effect A Render

**What goes wrong:** Idle screen attempts to draw from `spritesRef.current.samus` before Effect D's `Promise.all` resolves. This is not a crash (the guard handles it) but warrants awareness.
**Why it happens:** Effect D is async; the first synchronous render in Effect A runs before sprites load.
**How to avoid:** Already handled by D-05 — gate every sprite draw on `if (sprites?.samus)`, fall back to shape render. This is correct behavior. The sprite will appear on the next render trigger (resize, or game state change) once loaded.

### Pitfall 6: pendingScrewAttack Must Be Initialized in createInitialGameState

**What goes wrong:** TypeScript error or runtime undefined if `GamePhysicsState` has a new field not initialized in the factory.
**How to avoid:** Add `pendingScrewAttack: false` to the return value of `createInitialGameState` in `gameLoop.ts` alongside `pendingJump: false`.

---

## Code Examples

### Complete drawSamusSprite Skeleton

```typescript
// Source: derived from SPRITE_LAYOUT constants (VERIFIED: codebase) +
//         Canvas 2D drawImage spec (ASSUMED: stable API)
import { SPRITE_LAYOUT, GAME, COLLISION } from "../constants";

interface AnimState {
  frame: number;
  accumulator: number;
  isScrewAttack: boolean;
}

const DEBUG_HITBOX = false;

export function drawSamusSprite(
  ctx: CanvasRenderingContext2D,
  spritesCanvas: HTMLCanvasElement,
  x: number,         // center X
  y: number,         // bottom Y (samusY semantics — bottom of sprite)
  scale: number,
  animState: AnimState | undefined,
  isAirborne: boolean
): void {
  const { cellSize, contentSize, contentOffset, idle, spinJumpR, screwAttackR } = SPRITE_LAYOUT;

  // Determine which section and frame to draw
  let section: { sy: number; frames: number };
  let frameIndex = 0;

  if (!isAirborne) {
    section = idle;
    frameIndex = 0; // idle is always frame 0 (1 frame, static)
  } else if (animState?.isScrewAttack) {
    section = screwAttackR;
    frameIndex = animState.frame;
  } else {
    section = spinJumpR;
    frameIndex = animState?.frame ?? 0;
  }

  // Source rect in the sprite sheet
  const sx = Math.floor(frameIndex * cellSize + contentOffset);
  const sy = Math.floor(section.sy + contentOffset);
  const sw = contentSize; // 81
  const sh = contentSize; // 81

  // Destination rect on canvas
  const dw = Math.floor(contentSize * scale);
  const dh = Math.floor(contentSize * scale);
  const dx = Math.floor(x - dw / 2);  // center anchor
  const dy = Math.floor(y - dh);      // bottom anchor

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spritesCanvas, sx, sy, sw, sh, dx, dy, dw, dh);

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
```

### AnimState Initialization and Loop Integration

```typescript
// Inside Effect B (rAF loop), before rafId declaration:
let animState = {
  frame: 0,
  accumulator: 0,
  isScrewAttack: false,
};

const SPIN_FPS = 10;
const FRAME_DURATION = 1 / SPIN_FPS; // 0.1s per frame

// Inside loop(), after updateGame() and game-over check:
const isAirborne = game.samusY < canvasHeightRef.current * GAME.floorRatio - 1;
const isOnFloor = !isAirborne;

// Consume pendingScrewAttack flag from physics state
if (game.pendingScrewAttack) {
  animState.isScrewAttack = true;
  animState.frame = 0;
  animState.accumulator = 0;
  game.pendingScrewAttack = false;
}

// Reset animation on landing
if (isOnFloor) {
  animState.isScrewAttack = false;
  animState.frame = 0;
  animState.accumulator = 0;
}

// Advance frames only while airborne (spinJumpR or screwAttackR both have 9 frames)
if (isAirborne) {
  animState.accumulator += dt;
  if (animState.accumulator >= FRAME_DURATION) {
    animState.accumulator -= FRAME_DURATION;
    const section = animState.isScrewAttack ? SPRITE_LAYOUT.screwAttackR : SPRITE_LAYOUT.spinJumpR;
    animState.frame = (animState.frame + 1) % section.frames;
  }
}
```

### Screw Attack Visual Overlay

```typescript
// After drawSamusSprite, when isScrewAttack is true:
// Draw a colored glow/overlay to make screw attack visually distinct from normal spin jump
if (animState?.isScrewAttack && isAirborne) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";  // additive blend — brightens sprite
  ctx.fillStyle = "rgba(80, 120, 255, 0.35)"; // cool blue tint consistent with palette
  ctx.fillRect(
    Math.floor(x - dw / 2),
    Math.floor(y - dh),
    dw,
    dh
  );
  ctx.restore();
}
```

**Alternative if `screen` blending looks wrong:** Use `ctx.globalAlpha` with a solid fill rect at low opacity, or draw a simple circular glow with `ctx.shadowBlur`. The requirement (ANIM-03) says "visible overlay differentiates the two states" — the specific visual treatment is Claude's discretion.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Procedural shape-Samus (`drawSamusIdle` / `drawSamusJump`) | Sprite sheet draw via 9-arg `drawImage` | Visual fidelity matches actual Super Metroid sprite |
| `samusVY < 0` determines jump sprite (any upward velocity) | `isAirborne = samusVY !== 0 \|\| samusY < floor` determines animation section | Correct: airborne includes both upward and falling phases |
| Single Samus draw state per screen | AnimState with frame + accumulator + isScrewAttack | Full animated sprite support |

---

## Sprite Asset Verification

[VERIFIED: file command + Node.js PNG header inspection]

| Property | Value | Implication |
|----------|-------|-------------|
| File | `/public/sprites/samus.png` | Present, Phase 8 complete |
| Dimensions | 6496 × 4384 px | Matches `SPRITE_LAYOUT` math: 67.7 cols × 45.7 rows of 96px cells |
| Color mode | 8-bit/color RGB (color type 2) | No alpha channel in source — magenta key conversion (Effect D) is required and already implemented |
| Transparency | Magenta (#FF00FF) key color | Converted to alpha by `convertMagentaToAlpha` in Effect D; `spritesRef.current.samus` is ready-to-draw |

[VERIFIED: SPRITE_LAYOUT math cross-check]

All section origins fit within the PNG height (4384px):
- `idle.sy=49` → row ends at 145 — fits
- `spinJumpR.sy=3249` → row ends at 3345 — fits
- `spinJumpL.sy=3377` → row ends at 3473 — fits
- `screwAttackR.sy=3505` → row ends at 3601 — fits
- `screwAttackL.sy=3633` → row ends at 3729 — fits

All 9-frame sections fit within the PNG width (6496px): 9 × 96 = 864px, well within 6496px.

The `SPRITE_LAYOUT` constants require no changes — they are correct and ready to consume.

---

## Existing Warnings to Address (from Phase 8 Code Review)

[VERIFIED: 08-REVIEW.md]

These are pre-existing issues that Phase 9 touches directly:

| Warning | Action in Phase 9 |
|---------|------------------|
| **WR-01:** `spritesRef` never passed to draw calls | Fixed: add `sprites` and `animState` parameters to `drawScene` and all call sites |
| **WR-02:** `audioRef.current.playJump()` without null guard | Fix in same pass: change to `audioRef.current?.playJump()` |
| **WR-03:** Game-over check after `drawScene` | Fix in same pass: move `game.gameOver` check before `drawScene` call |
| **IN-03:** Idle "tap to start" button bypasses `handleInput` | Fix in same pass: replace `dispatch({ type: "START" })` with `handleInput` on that button |

Phase 9 touches Effect B and `handleInput` heavily — folding these fixes in costs near-zero extra effort.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 9 is purely code changes using native browser Canvas 2D APIs. No external CLI tools, databases, or services are required. The sprite PNG is already committed and Phase 8 UAT confirmed it serves at HTTP 200.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `samusY` is "bottom of sprite" semantics (not center) | Architecture Patterns — Pattern 1 | Sprite would render offset by half its height. Verified by reading `drawSamusIdle` (anchors body at y) and `gameLoop.ts` (floor clamp at `canvasHeight * floorRatio`) — LOW risk, HIGH confidence |
| A2 | `ctx.imageSmoothingEnabled = false` must be set before each `drawImage`, not once globally | Common Pitfalls — Pitfall 2 | Intermittent blur in production. Standard Canvas 2D behavior — ASSUMED from training, but conservative to re-set before each call regardless |
| A3 | The visual overlay for screw attack should use `globalCompositeOperation = "screen"` | Code Examples | If browser Canvas 2D "screen" blend looks wrong, fall back to simple alpha overlay. Low-stakes — easily adjusted visually |
| A4 | `SPRITE_LAYOUT.idle.sy = 49` is the correct section origin (not zero-indexed from a header row) | Sprite Asset Verification | Idle frame would render from wrong location. Accepted by owner when CONTEXT.md was committed; constants.ts has this value committed from Phase 8 |

**All claims tagged [VERIFIED: codebase] were confirmed by reading the actual source files in this session.**

---

## Open Questions

1. **Hitbox dimensions after sprite swap**
   - What we know: Current `COLLISION.samusWidth=28, samusHeight=36` were set for the shape Samus (24px wide, 48px tall at scale=1). The real sprite content is 81×81 with the actual Samus body occupying a sub-region.
   - What's unclear: The exact pixel dimensions of the real sprite's visible body (excluding transparent padding and arm cannon). Will be determined by the DEBUG_HITBOX tuning workflow (D-07).
   - Recommendation: Leave measurement to implementation time via the DEBUG_HITBOX flag. Expected range: ~30-45px wide, ~40-55px tall based on typical Super Metroid Samus proportions at this scale.

2. **isAirborne detection threshold**
   - What we know: `game.samusY >= canvasHeight * GAME.floorRatio` is the floor clamp condition in `updateGame`. On the floor frame, `samusVY = 0`.
   - What's unclear: Whether `samusVY === 0` alone is sufficient to detect "on floor" vs "at apex of jump". At jump apex, `samusVY` is momentarily very close to zero but not exactly zero due to gravity accumulation in the same frame.
   - Recommendation: Use `game.samusY >= canvasHeightRef.current * GAME.floorRatio - 1` (within 1px of floor) as the "on floor" condition — matches `updateGame`'s clamp logic exactly and avoids the apex ambiguity.

---

## Sources

### Primary (HIGH confidence — verified by direct code inspection this session)

- `/components/samus-run/SamusRunGame.tsx` — Full component read; Effect B, Effect D, `handleInput`, `drawScene` structure verified
- `/components/samus-run/constants.ts` — `SPRITE_LAYOUT`, `COLLISION`, `GAME` constants verified
- `/components/samus-run/canvas/drawSamus.ts` — Fallback shape functions and anchor semantics verified
- `/components/samus-run/gameLoop.ts` — `GamePhysicsState` type, `triggerJump`, `samusY` semantics verified
- `/public/sprites/samus.png` — Dimensions (6496×4384), color type (RGB/type 2) verified via Node.js PNG header read
- `/.planning/phases/08-asset-pipeline/08-REVIEW.md` — WR-01 through IN-03 pre-existing warnings verified
- `/.planning/phases/08-asset-pipeline/08-UAT.md` — Phase 8 complete, all 4 tests passed
- `/.planning/config.json` — `nyquist_validation: false` confirmed (Validation Architecture section omitted)

### Secondary (MEDIUM confidence)

- `SPRITE_LAYOUT` math cross-check: section origins verified to fit within 4384px height; 9-frame rows verified to fit within 6496px width

### Tertiary (LOW confidence — training knowledge, not verified this session)

- Canvas 2D `imageSmoothingEnabled` behavior across browsers (A2)
- `globalCompositeOperation = "screen"` visual output for screw attack overlay (A3)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; all APIs are Canvas 2D built-ins with verified usage in existing codebase
- Architecture: HIGH — patterns derived directly from existing code structure and CONTEXT.md locked decisions
- Sprite asset: HIGH — PNG dimensions and color mode verified by file inspection; SPRITE_LAYOUT math cross-checked
- Hitbox constants: LOW — final values require visual tuning via DEBUG_HITBOX workflow; current values are placeholders
- Frame rate recommendation: MEDIUM — 10fps for spin jump is typical for this genre; exact value is Claude's discretion

**Research date:** 2026-04-24
**Valid until:** 2026-06-01 (stable stack; sprite sheet constants are immutable once committed)
