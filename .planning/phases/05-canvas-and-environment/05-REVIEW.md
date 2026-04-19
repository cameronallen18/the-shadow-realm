---
phase: 05-canvas-and-environment
reviewed: 2026-04-18T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - components/samus-run/SamusRunGame.tsx
  - components/samus-run/canvas/drawEnvironment.ts
  - components/samus-run/canvas/drawObstacleShape.ts
  - components/samus-run/canvas/drawSamus.ts
  - components/samus-run/canvas/setupCanvas.ts
  - components/samus-run/constants.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-18
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files covering the canvas rendering pipeline for Samus Run were reviewed: the main game component, three canvas draw modules, the canvas setup utility, and the constants file. The code is well-structured and the draw functions are cleanly decomposed. No critical issues or security vulnerabilities were found.

Two warnings were found: a hardcoded floor ratio in `drawEnvironment` that is out of sync with the canonical constant (latent desync bug), and a double call to `getBoundingClientRect()` per render that could produce mismatched dimensions under race conditions. Three informational items cover a debug flag left in committed code, a placeholder sprite-selection heuristic that will need replacing when jump mechanics land, and an un-debounced ResizeObserver.

---

## Warnings

### WR-01: Floor ratio hardcoded in `drawEnvironment` — will desync if `GAME.floorRatio` changes

**File:** `components/samus-run/canvas/drawEnvironment.ts:20`

**Issue:** The lava floor Y position is computed as `height * 0.85`, duplicating the value from `GAME.floorRatio` in `constants.ts`. `SamusRunGame` positions Samus using `height * GAME.floorRatio` (line 63 of `SamusRunGame.tsx`). If `GAME.floorRatio` is changed, the environment floor line drawn by `drawEnvironment` will be at a different Y than Samus's feet — Samus will appear to float or sink into the ground without an obvious cause.

**Fix:** Import `GAME` and use the constant:

```ts
import { NORFAIR, GAME } from "../constants";

// inside drawEnvironment:
const floorY = height * GAME.floorRatio;
```

---

### WR-02: `getBoundingClientRect()` called twice per render — potential dimension mismatch

**File:** `components/samus-run/SamusRunGame.tsx:96-99`

**Issue:** `setupCanvas(cvs)` (line 96) internally calls `getBoundingClientRect()` to size the canvas backing store. Then, immediately after, the outer `render()` function calls `cvs.getBoundingClientRect()` again (line 98) to obtain `rect.width`/`rect.height` for passing to `drawScene`. These are two separate DOM layout reads. While the values will match in the vast majority of cases, they can differ if a layout shift occurs between the two calls (e.g., during a rapid resize event). When they differ, the canvas backing store is sized for one dimension but `drawScene` draws coordinates computed from a different dimension, causing subtle clipping or mis-registration at canvas edges.

**Fix:** Have `setupCanvas` return the CSS-pixel dimensions it measured, or accept them as a return value, so only one layout read is needed:

```ts
// Option A: return dimensions from setupCanvas
export function setupCanvas(
  canvas: HTMLCanvasElement
): { ctx: CanvasRenderingContext2D; width: number; height: number } | null {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;
  return { ctx, width: rect.width, height: rect.height };
}

// In render():
const result = setupCanvas(cvs);
if (!result) return;
const { ctx, width, height } = result;
drawScene(ctx, state.screen, width, height);
```

---

## Info

### IN-01: `DEBUG_FORCE_JUMP` debug flag committed to source

**File:** `components/samus-run/SamusRunGame.tsx:4`

**Issue:** `const DEBUG_FORCE_JUMP = false` is a committed debug flag. While it is currently `false` and has no runtime effect, debug flags left in source create noise, can be accidentally flipped to `true`, and are easy to overlook during future refactors. The comment on line 3 names a specific internal ticket reference (`VIS-03`) that won't mean anything to future readers.

**Fix:** Remove the constant and the `|| DEBUG_FORCE_JUMP` branch. Use a URL query parameter or environment variable if a visual test toggle is genuinely needed during development:

```ts
// Remove lines 3-4
// In drawScene, replace:
const useJump = DEBUG_FORCE_JUMP || screen === "playing";
// with:
const useJump = screen === "playing";
```

---

### IN-02: Samus sprite selected by game screen, not jump state

**File:** `components/samus-run/SamusRunGame.tsx:70-75`

**Issue:** `screen === "playing"` is used to choose between idle and jump sprites (line 70). This means Samus always renders in the jump/airborne pose while the game is in the playing state, including when standing on the ground. This works for the current static scaffold, but when actual jump mechanics are added, the sprite selection will need to key off a jump position or velocity flag — not the screen state. If this pattern is not replaced when jump logic lands, Samus will always look airborne.

**Fix:** When jump mechanics are implemented, pass jump state to `drawScene` and use it to select the sprite:

```ts
// drawScene signature update (future):
function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  samusIsJumping: boolean,
  width: number,
  height: number
): void {
  // ...
  const useJump = samusIsJumping;
  // ...
}
```

No immediate change required, but this should be addressed before jump mechanics are implemented to avoid the bug being invisible at the time of introduction.

---

### IN-03: ResizeObserver fires full canvas re-setup on every resize tick without debouncing

**File:** `components/samus-run/SamusRunGame.tsx:107-110`

**Issue:** The `ResizeObserver` callback calls `render()` directly on every event. `render()` calls `setupCanvas()` (which sets `canvas.width`/`canvas.height`, resetting all canvas state) then redraws the entire scene. During a user dragging a window edge this fires many times per second. For a static scene this is harmless, but once animation frames are added, the double-path (animation loop + resize observer) will need coordination to avoid redundant redraws or state corruption from mid-frame canvas resets.

**Fix:** No immediate change required for the static scaffold. When the animation loop is added in a future phase, route resize through the animation loop's state (e.g., set a `needsResize` flag) rather than triggering a direct redraw from the observer.

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
