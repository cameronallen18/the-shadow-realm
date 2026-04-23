---
phase: 06-physics-and-input
reviewed: 2026-04-20T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - components/samus-run/gameLoop.ts
  - components/samus-run/constants.ts
  - components/samus-run/SamusRunGame.tsx
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-20
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the three core files implementing phase 06 physics and input: the game loop, constants, and the React host component. The physics model is sound — gravity, terminal velocity, dt-capping, and floor/ceiling clamping are all correct. The primary issues are a broken in-game score HUD (displays 0 throughout play), an obstacle recycling logic error that breaks even spacing after the first wrap, and dead code from an unused `scored` field. A double-dispatch on game start from the idle screen is a correctness concern worth fixing before shipping.

---

## Warnings

### WR-01: Obstacle spacing collapses to 50 px after first recycle

**File:** `components/samus-run/gameLoop.ts:107`

**Issue:** When an obstacle scrolls off the left edge it is repositioned to `canvasWidth + 50`. Both obstacles in the pool use the same hardcoded `+50` offset regardless of where the other obstacle currently is. The initial spacing is `canvasWidth * OBSTACLE_SPACING_RATIO` (0.6 × width ≈ 480 px at 800 px canvas). After the first recycle the two obstacles can be as close as 50 px apart — effectively impossible to navigate. The `OBSTACLE_SPACING_RATIO` constant is ignored at recycle time.

**Fix:** Place the recycled obstacle relative to the furthest obstacle currently on screen:

```ts
// In the recycle block, replace:
obs.x = canvasWidth + 50;

// With:
const maxObstacleX = Math.max(...state.obstacles.map((o) => o.x));
obs.x = maxObstacleX + canvasWidth * OBSTACLE_SPACING_RATIO;
```

---

### WR-02: In-game score HUD always displays 0

**File:** `components/samus-run/SamusRunGame.tsx:264`

**Issue:** The HUD renders `{state.score}` during play. `state.score` is set to `0` on START and is only updated when `GAME_OVER` is dispatched. The live obstacle count lives in `gameRef.current.obstaclesCleared` (a mutable ref, not React state), so the displayed score never changes from 0 during gameplay.

**Fix:** Read the live count from the ref inside the JSX, or maintain a separate score ref that the rAF loop updates and expose it via a separate ref:

```tsx
// Option A — quick: read directly from the mutable ref
{state.screen === "playing" && (
  <div className="absolute top-4 right-4 text-[#9ba3ad] text-xs font-mono tabular-nums z-10">
    {gameRef.current?.obstaclesCleared ?? 0}
  </div>
)}
```

Note: because React does not re-render on ref mutations, Option A will show a stale count on most frames. The more correct fix is to drive a separate `scoreRef` that is updated each rAF frame and displayed via a DOM write (imperatively updating a `<span>` via another ref), bypassing React state entirely for the HUD:

```tsx
const scoreDisplayRef = useRef<HTMLSpanElement>(null);

// Inside loop(), after updateGame:
if (scoreDisplayRef.current) {
  scoreDisplayRef.current.textContent = String(game.obstaclesCleared);
}

// In JSX:
<div className="absolute top-4 right-4 ...">
  <span ref={scoreDisplayRef}>0</span>
</div>
```

---

### WR-03: Double dispatch on game start — idle overlay button and canvas click listener both fire

**File:** `components/samus-run/SamusRunGame.tsx:250`

**Issue:** The idle overlay button calls `dispatch({ type: "START" })` directly via its `onClick` prop. The canvas also has a `click` listener registered on it via the input effect. When a user clicks the "tap to start" button, the synthetic React event fires first (dispatching START), then the click event bubbles through the DOM to the canvas element, triggering `handleInput` which dispatches START again. React batches same-tick dispatches so this produces a no-op second dispatch today, but it is an unintentional double-fire that could cause subtle issues if the reducer logic changes.

**Fix:** Stop propagation on the overlay button clicks, or remove the direct dispatch from the overlay button and route all START actions through `handleInput`:

```tsx
// Option A: stop propagation on the button
<button
  onClick={(e) => { e.stopPropagation(); dispatch({ type: "START" }); }}
  ...
>

// Option B: remove the direct dispatch and let handleInput handle it
<button onClick={handleInput} ...>
  tap to start
</button>
```

Option B is cleaner — `handleInput` already dispatches START when screen is "idle".

---

### WR-04: `scored` field on `Obstacle` is declared but never read — scoring logic is incomplete

**File:** `components/samus-run/gameLoop.ts:9`, `components/samus-run/gameLoop.ts:53`

**Issue:** The `Obstacle` interface declares a `scored: boolean` field and it is initialized to `false` and reset to `false` on recycle, but it is never set to `true` and never read anywhere. The intended design (score a point when Samus's X position passes the obstacle's right edge) was never implemented. Instead, `obstaclesCleared` is incremented when an obstacle wraps off the left edge (line 114). This means the counter increments only after the obstacle fully exits the screen — a delayed score event that also decouples the `scored` flag from its only meaningful use.

**Fix:** Either remove the `scored` field (if scoring-on-exit is the intended behavior) or implement pass-through scoring:

```ts
// In the obstacle scroll loop, before the recycle block:
const samusX = canvasWidth * GAME.samusXRatio;
if (!obs.scored && samusX > obs.x + GAME.obstacleWidth) {
  obs.scored = true;
  state.obstaclesCleared++;
  if (state.obstaclesCleared % 10 === 0) {
    state.speedMultiplier = Math.min(
      state.speedMultiplier + PHYSICS.speedIncrement,
      PHYSICS.maxSpeedMultiplier
    );
  }
}
```

Also remove the increment inside the recycle block.

---

## Info

### IN-01: Ceiling clamp does not zero vertical velocity (asymmetric with floor clamp)

**File:** `components/samus-run/gameLoop.ts:96-98`

**Issue:** The floor clamp (lines 90–93) zeroes `samusVY` when Samus touches the floor. The ceiling clamp (lines 96–98) clamps position but leaves `samusVY` unchanged. When gravity is positive and the jump applies an upward velocity, `samusVY` will naturally reverse direction after the ceiling so the asymmetry is not a gameplay bug. However the inconsistency could become one if jump mechanics change (e.g., variable gravity or wall-stick). A comment clarifying the intent would prevent a future developer from "fixing" it incorrectly.

**Fix:**
```ts
// e. Ceiling clamp
if (state.samusY <= 0) {
  state.samusY = 0;
  // samusVY intentionally NOT zeroed — gravity will pull Samus back down naturally.
  // Floor clamp zeroes VY to prevent sinking; ceiling does not need to.
}
```

---

### IN-02: Redundant null-guard immediately after guaranteed assignment

**File:** `components/samus-run/SamusRunGame.tsx:142-144`

**Issue:** `gameRef.current` is assigned the return value of `createInitialGameState` on line 139, which always returns a non-null object. The `if (gameRef.current)` guard on line 142 is dead code — the branch is always taken.

**Fix:** Remove the guard:
```ts
gameRef.current = createInitialGameState(rect.width, rect.height);
gameRef.current.pendingJump = true;
```

---

### IN-03: `setupCanvas` called on every animation frame — potential per-frame overhead

**File:** `components/samus-run/SamusRunGame.tsx:160`

**Issue:** `setupCanvas(cvs)` is called inside the `loop` function on every `requestAnimationFrame` tick. If `setupCanvas` performs canvas resolution setup (e.g., setting `canvas.width`/`canvas.height` based on DPR, which resets the canvas bitmap), this would clear the canvas every frame before `drawScene` has a chance to paint — possibly correct but expensive. If it only retrieves the context, it is benign but wasteful.

**Fix:** Pull context acquisition out of the loop if `setupCanvas` is idempotent after first call:
```ts
const ctx = setupCanvas(canvas);
if (!ctx) return;

function loop(ts: number) {
  // use ctx directly — no repeated setupCanvas call
  ...
  drawScene(ctx, "playing", r.width, r.height, game);
  ...
}
```

This requires `setupCanvas` to return a context that remains valid across frames (which `CanvasRenderingContext2D` always does). Resize changes should be handled via the ResizeObserver in Effect A, not inside the game loop.

---

_Reviewed: 2026-04-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
