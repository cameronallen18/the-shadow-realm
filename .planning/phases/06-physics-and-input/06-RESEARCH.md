# Phase 6: Physics and Input - Research

**Researched:** 2026-04-20
**Domain:** requestAnimationFrame game loop, delta-time physics, browser input unification, obstacle scrolling with pooling
**Confidence:** HIGH

---

## Summary

Phase 6 transforms the static Norfair visual scene from Phase 5 into a running game. The canvas, drawing modules, and state machine already exist and are verified. This phase adds three systems on top of them: (1) a `requestAnimationFrame` game loop that advances physics each frame, (2) gravity/jump mechanics for Samus driven entirely by `useRef` state, and (3) scrolling rock wall obstacles with randomized gaps and speed progression.

The most critical correctness requirement is delta-time normalization. Without it, the game runs twice as fast on a 120Hz iPad as on a 60Hz laptop. Delta-time multiplies every physics quantity (velocity increments, position changes, obstacle x-position changes) by `dt` in seconds, making the simulation frame-rate independent. This is the canonical fix — every browser game tutorial that skips it produces frame-rate-dependent physics.

Input must be unified across three surfaces: keyboard (`keydown` on Space/ArrowUp), mouse click on the canvas element, and touch (`touchstart` on the canvas). A single `handleInput` function dispatches the same action regardless of which event fires. The first input while `screen === "idle"` transitions to `"playing"` via the existing `dispatch({ type: "START" })`. All subsequent inputs during play trigger a jump if Samus is not already at peak velocity.

The existing `SamusRunGame.tsx` state machine (`useReducer`) and `canvasRef` are the integration points. Physics state (Samus y-position, y-velocity, obstacle array, score, speed multiplier) must live in `useRef` values — never in React `useState` — per the locked architectural decision in STATE.md. The rAF loop callback must be stable (wrapped in `useCallback` or kept outside the component) to prevent re-registration on every React render.

**Primary recommendation:** Implement a single `useEffect` that starts the rAF loop when `screen === "playing"` and cancels it (via `cancelAnimationFrame(rafId)`) on cleanup. All game state lives in `useRef`. The loop reads `state.screen` from a ref (not from closure over the reducer state) to avoid stale closures. Input listeners register once on mount and dispatch to both the game loop ref and the reducer.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | Samus falls under gravity and jumps upward on valid input | Gravity: add `GRAVITY * dt` to `vy` each frame, clamp at terminal velocity. Jump: set `vy = -JUMP_VELOCITY` on input, single-jump only (guard with `isOnGround` or velocity check). |
| GAME-02 | Rock wall obstacles scroll right-to-left continuously with randomized gap heights | Obstacle array with x, gapTop, gapBottom fields. Each frame: `x -= SPEED * speedMultiplier * dt`. When x + width < 0: reset to right edge, randomize gap. |
| GAME-03 | Scroll speed noticeably increases after approximately every 10 obstacles cleared | `obstaclesCleared` counter on game ref. When `obstaclesCleared % 10 === 0 && obstaclesCleared > 0`: increment `speedMultiplier` (e.g. `+= 0.15`). Score increment happens in Phase 7 — Phase 6 only needs the counter. |
| GAME-07 | Game transitions cleanly from idle to playing state on first valid input | `handleInput()`: if `screen === "idle"`, call `dispatch({ type: "START" })` and also set a `pendingJump` ref. The rAF loop starts from the `screen === "playing"` branch of the useEffect dep array `[state.screen]`. |
| INPUT-01 | Spacebar and arrow-up keyboard inputs trigger jump | `keydown` listener on `window`, check `e.code === "Space" || e.code === "ArrowUp"`. Call `e.preventDefault()` for Space (prevents page scroll). |
| INPUT-02 | Mouse click on canvas triggers jump | `click` listener on `canvasRef.current`. No coordinate check needed — entire canvas surface is valid. |
| INPUT-03 | Touchstart on canvas triggers jump (mobile / iPad) | `touchstart` listener on `canvasRef.current`. Call `e.preventDefault()` to block scroll and double-tap zoom. Listener must be registered with `{ passive: false }` option or preventDefault will be ignored. |
| INPUT-04 | First valid input (idle screen) transitions to playing | `handleInput()` checks current screen from a `useRef` mirror of `state.screen`. If idle: dispatch START, set jumpPending. If playing: trigger jump. If gameover: ignore (restart is a separate button). |
</phase_requirements>

---

## Standard Stack

No new npm packages. All capability comes from browser built-ins and the existing codebase. [VERIFIED: STATE.md — "Zero new npm packages — Canvas 2D, Web Audio, requestAnimationFrame, localStorage are all browser built-ins"]

### Core (already installed)
| Library | Version | Purpose | Role in Phase 6 |
|---------|---------|---------|-----------------|
| Next.js | 15.3.9 | Framework | SSR guard already in place via `next/dynamic ssr:false` from Phase 4 |
| React | ^19.0.0 | UI runtime | `useRef`, `useEffect`, `useCallback`, `useReducer` for game loop and input |
| TypeScript | ^5 | Type safety | Type the game state ref, obstacle array, and event handlers |

### Browser Built-ins (no install)
| API | Purpose | Confidence |
|-----|---------|-----------|
| `requestAnimationFrame` | Game loop — fires before next paint, provides timestamp | HIGH — baseline web standard [CITED: developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame] |
| `cancelAnimationFrame` | Stops the loop cleanly on component unmount or game over | HIGH — baseline web standard |
| `KeyboardEvent` (`keydown`) | Keyboard input detection | HIGH — baseline web standard |
| `MouseEvent` (`click`) | Mouse input detection | HIGH — baseline web standard |
| `TouchEvent` (`touchstart`) | Mobile touch input | HIGH — supported on all mobile browsers [CITED: developer.mozilla.org/en-US/docs/Web/API/TouchEvent] |
| `Math.random()` | Gap height randomization | HIGH — JS built-in |

---

## Architecture Patterns

### Recommended Module Structure

```
components/samus-run/
├── SamusRunGame.tsx          (existing — wires game loop useEffect + input listeners)
├── canvas/
│   ├── setupCanvas.ts        (existing — DPR sizing, no changes)
│   ├── drawEnvironment.ts    (existing — no changes)
│   ├── drawSamus.ts          (existing — no changes)
│   └── drawObstacleShape.ts  (existing — no changes, used dynamically now)
├── constants.ts              (extend with physics constants: GRAVITY, JUMP_VELOCITY, etc.)
└── gameLoop.ts               (NEW — pure game-state-update function, no React deps)
```

The key architectural choice is extracting the game state update logic into a pure `gameLoop.ts` module. This keeps `SamusRunGame.tsx` as the React integration layer while the physics/scrolling logic stays testable and free of React coupling.

### Pattern 1: Delta-Time Game Loop

**What:** A `requestAnimationFrame` loop that computes `dt = (timestamp - lastTimestamp) / 1000` on every frame and passes it to all physics calculations. The loop runs only while `screen === "playing"`.

**Why delta-time:** On a 60Hz display, `dt ≈ 0.0167`. On a 120Hz display, `dt ≈ 0.0083`. Multiplying all velocities and positions by `dt` makes the simulation advance at the same real-world rate regardless of frame rate. Without it, the game runs twice as fast on 120Hz. [ASSUMED — based on standard game dev practice, but the principle is mathematically certain]

**Critical guard:** Cap `dt` at a maximum (e.g., `Math.min(dt, 0.05)`) to prevent a huge jump if the tab was backgrounded and the loop was throttled. Without this cap, returning to a backgrounded tab can produce a dt of 5+ seconds, teleporting game objects.

```typescript
// components/samus-run/SamusRunGame.tsx — game loop useEffect
// Source: MDN requestAnimationFrame [CITED] + delta-time pattern [ASSUMED: standard game dev]

useEffect(() => {
  if (state.screen !== "playing") return;

  let rafId: number;
  let lastTimestamp: number | null = null;

  function loop(timestamp: number) {
    const dt = lastTimestamp === null
      ? 0
      : Math.min((timestamp - lastTimestamp) / 1000, 0.05); // cap at 50ms
    lastTimestamp = timestamp;

    updateGame(gameRef.current, dt); // pure function — updates ref in place
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = setupCanvas(canvas);
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        drawScene(ctx, "playing", rect.width, rect.height, gameRef.current);
      }
    }

    // Check for game over condition after physics update
    if (gameRef.current.gameOver) {
      dispatch({ type: "GAME_OVER", score: gameRef.current.obstaclesCleared });
      return; // don't request next frame
    }

    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafId);
}, [state.screen]); // restart loop when screen changes to "playing"
```

**Why `useEffect` dep on `state.screen`:** When screen transitions to `"playing"`, the effect fires and starts the loop. When it transitions away (game over dispatched), the cleanup cancels the rAF. This is the cleanest React integration without fighting the framework.

**Stale closure risk:** The `loop` function closes over `state.screen` from the effect. Since the effect only runs when `state.screen === "playing"`, and cleanup cancels the loop when screen changes, there is no stale closure issue — the loop is replaced entirely on each transition.

### Pattern 2: Game State in useRef (NOT useState)

**What:** All physics state lives in a single `gameRef = useRef<GamePhysicsState>(initialState)`. The ref is mutated in place each frame. React is never re-rendered by physics updates — only by the game screen transitions (idle → playing → gameover).

**Why useRef:** `setState` schedules a re-render. Calling it 60-120 times per second would produce 60-120 React renders per second, causing severe performance degradation. `useRef` mutations are synchronous and cause no re-renders. [VERIFIED: STATE.md locked decision — "Physics state must live in useRef (not useState)"]

```typescript
// In SamusRunGame.tsx — game physics ref
interface GamePhysicsState {
  samusY: number;        // CSS pixels from top of play area (0 = ceiling)
  samusVY: number;       // CSS pixels/second, positive = downward
  obstacles: Obstacle[]; // [{x, gapTop, gapBottom}]
  obstaclesCleared: number;
  speedMultiplier: number;
  gameOver: boolean;
}

interface Obstacle {
  x: number;       // left edge, CSS pixels
  gapTop: number;  // y where gap starts
  gapBottom: number; // y where gap ends
}

const gameRef = useRef<GamePhysicsState>(createInitialGameState());
```

**Reset on game restart:** The "RESTART" action transitions screen back to "idle". When the user starts again ("START"), the effect re-fires with `screen === "playing"`. At the top of that effect, reset `gameRef.current = createInitialGameState()` before starting the loop.

### Pattern 3: Unified Input Handler

**What:** A single `handleInput()` function that checks the current screen and dispatches the appropriate action (start game or trigger jump).

**Why a ref for screen state:** Input handlers registered with `addEventListener` close over state at the time they are registered. If `state.screen` is read directly in the handler, it will always be `"idle"` (the initial value at mount time). The fix: mirror `state.screen` to a `useRef` and read from the ref inside handlers.

```typescript
// Mirror screen state to ref for use inside event handlers
const screenRef = useRef<GameScreen>(state.screen);
useEffect(() => {
  screenRef.current = state.screen;
}, [state.screen]);

// Unified input handler
function handleInput() {
  if (screenRef.current === "idle") {
    dispatch({ type: "START" });
    // Flag a jump for the first frame of the new game
    gameRef.current.pendingJump = true;
  } else if (screenRef.current === "playing") {
    triggerJump(gameRef.current);
  }
  // gameover: do nothing (restart is the button)
}
```

### Pattern 4: Input Listener Registration

**What:** Three event listeners registered in a single `useEffect` on mount. Cleaned up on unmount. The canvas ref is used for click and touch; `window` is used for keyboard.

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault(); // prevent page scroll on Space
      handleInput();
    }
  }

  function onClick() {
    handleInput();
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault(); // prevent scroll, double-tap zoom, click delay
    handleInput();
  }

  window.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("touchstart", onTouchStart);
  };
}, []); // mount only — handlers are stable via screenRef and gameRef
```

**Why `{ passive: false }` on touchstart:** iOS Safari requires explicit opt-out of passive event handling to allow `preventDefault()` in touch events. If `passive: false` is not set, calling `e.preventDefault()` in a touchstart handler has no effect — the browser ignores it. [VERIFIED: developer.mozilla.org passive event listeners] [CITED: developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive]

**Why no `handleInput` in dependency array:** `handleInput` reads from `screenRef` and `gameRef`, which are both refs — no closure over stale state. The function itself does not need to be re-created on every render.

### Pattern 5: Physics Update Function (gameLoop.ts)

**What:** A pure function `updateGame(state: GamePhysicsState, dt: number, canvasHeight: number): void` that mutates the state object in place. No React imports. No side effects beyond the mutation.

```typescript
// components/samus-run/gameLoop.ts
import { PHYSICS, GAME } from "./constants";

export function updateGame(
  state: GamePhysicsState,
  dt: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  // 1. Gravity
  state.samusVY += PHYSICS.gravity * dt;
  state.samusVY = Math.min(state.samusVY, PHYSICS.terminalVelocity); // cap fall speed

  // 2. Position
  state.samusY += state.samusVY * dt;

  // 3. Floor clamp (Samus lands on floor, doesn't fall through)
  const floorY = canvasHeight * GAME.floorRatio;
  if (state.samusY >= floorY) {
    state.samusY = floorY;
    state.samusVY = 0;
    state.isOnGround = true;
  } else {
    state.isOnGround = false;
  }

  // 4. Ceiling clamp (instant death if Samus hits ceiling — Phase 7)
  // Phase 6: just clamp for now; collision logic in Phase 7
  if (state.samusY <= 0) {
    state.samusY = 0;
  }

  // 5. Obstacle scrolling
  const speed = PHYSICS.baseScrollSpeed * state.speedMultiplier;
  for (const obs of state.obstacles) {
    obs.x -= speed * dt;

    // Recycle obstacle: reset to right edge when it scrolls offscreen
    if (obs.x + GAME.obstacleWidth < 0) {
      obs.x = canvasWidth;
      const gap = randomGap(canvasHeight);
      obs.gapTop = gap.gapTop;
      obs.gapBottom = gap.gapBottom;
      state.obstaclesCleared++;

      // Speed progression: every 10 cleared
      if (state.obstaclesCleared % 10 === 0) {
        state.speedMultiplier = Math.min(
          state.speedMultiplier + PHYSICS.speedIncrement,
          PHYSICS.maxSpeedMultiplier
        );
      }
    }
  }
}

function randomGap(canvasHeight: number): { gapTop: number; gapBottom: number } {
  const playAreaTop = canvasHeight * 0.1;    // 10% top margin
  const playAreaBottom = canvasHeight * GAME.floorRatio; // floor at 85%
  const playHeight = playAreaBottom - playAreaTop;
  
  const minGap = playHeight * 0.28; // minimum gap Samus can fit through
  const maxGap = playHeight * 0.45; // maximum gap (easy-ish at start)
  const gapSize = minGap + Math.random() * (maxGap - minGap);
  
  // Random gap center position within play area
  const gapCenterMin = playAreaTop + gapSize / 2;
  const gapCenterMax = playAreaBottom - gapSize / 2;
  const gapCenter = gapCenterMin + Math.random() * (gapCenterMax - gapCenterMin);
  
  return {
    gapTop: gapCenter - gapSize / 2,
    gapBottom: gapCenter + gapSize / 2,
  };
}
```

### Pattern 6: Jump Mechanic

**What:** On valid input during play, set `samusVY` to a fixed upward velocity. Single-jump only — no double-jump or mid-air re-jump.

```typescript
export function triggerJump(state: GamePhysicsState): void {
  // Allow jump from floor or near-floor (small tolerance for physics imprecision)
  // Alternatively: allow jump anytime (simpler Flappy Bird style)
  // Decision: Flappy Bird style — any tap re-applies upward velocity
  state.samusVY = -PHYSICS.jumpVelocity; // negative = upward in canvas coords
}
```

**Single-jump vs. Flappy Bird style:** In Flappy Bird, every tap applies upward velocity even mid-air. This is the genre convention and produces the bouncy, skill-based feel. An `isOnGround` guard (only allow jump from floor) would make the game feel very different and harder to control. Given the success criteria say "jumps upward when the player taps" with no mention of ground-only constraint, Flappy Bird style (always apply jump velocity) is the correct default. [ASSUMED — this is a design judgment; confirm with user if uncertain]

### Pattern 7: drawScene Extension for Dynamic State

Phase 5's `drawScene` takes `(ctx, screen, width, height)`. Phase 6 needs to pass physics state. The signature must extend:

```typescript
// Updated drawScene in SamusRunGame.tsx
function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  width: number,
  height: number,
  physics?: GamePhysicsState  // optional — undefined on idle/gameover
): void {
  ctx.clearRect(0, 0, width, height);
  drawEnvironment(ctx, width, height);

  if (physics && screen === "playing") {
    // Dynamic obstacle positions from physics state
    for (const obs of physics.obstacles) {
      drawRockWall(ctx, obs.x, obs.gapTop, obs.gapBottom, GAME.obstacleWidth, height);
    }
    // Samus at physics position
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
    if (DEBUG_FORCE_JUMP || screen === "playing") {
      drawSamusJump(ctx, samusX, samusY, GAME.samusScale);
    } else {
      drawSamusIdle(ctx, samusX, samusY, GAME.samusScale);
    }
  }
}
```

### Pattern 8: Physics Constants in constants.ts

Extend `constants.ts` with a `PHYSICS` object:

```typescript
// Append to components/samus-run/constants.ts
export const PHYSICS = {
  gravity: 1200,            // CSS pixels/second² (feels responsive at 60fps)
  jumpVelocity: 520,        // CSS pixels/second upward (negative applied in code)
  terminalVelocity: 900,    // max fall speed, CSS pixels/second
  baseScrollSpeed: 220,     // CSS pixels/second at speed multiplier = 1
  speedIncrement: 0.15,     // added to multiplier every 10 obstacles
  maxSpeedMultiplier: 2.5,  // cap on speed (game becomes unplayable beyond ~2.5x)
} as const;
```

**Tuning note:** These values are starting points derived from the Flappy Bird genre feel. [ASSUMED] The actual feel of gravity, jump height, and scroll speed must be tuned against the rendered game. The planner should budget a dedicated tuning task after initial implementation.

### Anti-Patterns to Avoid

- **Putting physics state in `useState`:** Every frame would trigger a React re-render. At 60fps this is 60 re-renders/second — UI becomes unresponsive and React profiler shows constant commit cycles. Use `useRef` exclusively. [VERIFIED: STATE.md locked decision]
- **Reading `state.screen` inside rAF loop directly from reducer closure:** The reducer state is stale inside the rAF callback because the callback closes over the value at effect creation time. Mirror to a ref (`screenRef.current`) for synchronous reads inside the loop.
- **Using `setInterval` instead of `requestAnimationFrame`:** `setInterval` does not sync with the browser's paint cycle, causing tearing and inconsistent frame timing. `requestAnimationFrame` is the only correct mechanism for game loops. [ASSUMED — well-established web game dev principle]
- **Registering input listeners inside the rAF useEffect:** If listeners are registered inside the `state.screen`-dependent effect, they re-register every time screen changes (idle → playing → idle) without proper cleanup. Keep input listeners in a separate mount-only `useEffect`.
- **Not calling `e.preventDefault()` on Space:** Without it, pressing Space scrolls the page while playing. On iOS, not calling `preventDefault` on touchstart (with `passive: false`) allows browser scroll behavior to interfere with game input.
- **Not capping dt:** If the browser tab loses focus and then regains it, the next rAF timestamp can be seconds after the last. Without `Math.min(dt, 0.05)`, Samus teleports off-screen on tab focus restoration.
- **Obstacle x starting position conflicts:** If two obstacles start at the same x position, they overlap and appear as one wide wall. Initialize obstacles at staggered x positions (e.g., first at `width + 50`, second at `width + 50 + spacing`). Use 1-2 obstacles in the pool initially.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frame-rate independent physics | Custom timing with `Date.now()` | `requestAnimationFrame` timestamp parameter | rAF timestamp is high-resolution DOMHighResTimeStamp synchronized with paint cycle; `Date.now()` is coarser and not paint-synced |
| Multi-touch disambiguation | Complex touch tracking | Single `touchstart` listener, call `preventDefault` | Game only needs "did a touch happen" — not coordinates or multi-touch state |
| Obstacle recycling | Delete and create new DOM elements | Obstacle object pool (2 items, reset position when offscreen) | No GC pressure, no allocation in the hot path |
| Physics engine library | Matter.js, Rapier, etc. | Hand-written gravity + velocity update | The physics is one moving object under constant gravity with a jump velocity — a full engine is extreme overkill and contradicts zero-new-packages constraint |

---

## Common Pitfalls

### Pitfall 1: Stale Screen State in Input Handlers
**What goes wrong:** Input handler always sees `screen === "idle"` even after the game starts. Clicking during play transitions the game back to start.
**Why it happens:** Event listeners capture the value of `state.screen` at the time they are registered (mount). Since the listeners are registered in a mount-only effect, the captured value is always the initial `"idle"`.
**How to avoid:** Mirror `state.screen` to `screenRef` in a separate `useEffect([state.screen])`. Read `screenRef.current` inside event handlers.
**Warning signs:** Clicking during play re-triggers START instead of jump.

### Pitfall 2: rAF Loop Continues After Game Over
**What goes wrong:** After `dispatch({ type: "GAME_OVER" })`, the rAF loop continues running, redrawing the scene (sometimes with invalid physics state) while the game over overlay appears on top.
**Why it happens:** `dispatch` is asynchronous — the new `state.screen` value is not available in the current frame. The loop calls `requestAnimationFrame(loop)` before the effect cleanup fires.
**How to avoid:** Check `gameRef.current.gameOver` inside the loop body. If true, do not call `requestAnimationFrame(loop)` — just return. The useEffect cleanup handles cancellation when `state.screen` changes, but the in-frame guard stops it immediately.
**Warning signs:** Console logs from physics update appearing after game over screen is visible.

### Pitfall 3: dt Spike on Tab Switch
**What goes wrong:** Samus or obstacles teleport to impossible positions when the user switches back to the browser tab.
**Why it happens:** Browser throttles rAF in background tabs. When the user returns, the next timestamp may be 2-10 seconds after the last. Without capping dt, physics update advances by 2-10 seconds of simulation in one frame.
**How to avoid:** `const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05)`. The 50ms cap means a maximum of one-and-a-half normal frames of physics regardless of how long the tab was backgrounded.
**Warning signs:** Objects jump position suddenly when returning to the tab.

### Pitfall 4: setupCanvas Resets Context Transform on Each Frame
**What goes wrong:** Samus and obstacles are drawn at wrong positions — appear near top-left of canvas at physical pixel coordinates rather than CSS pixel coordinates.
**Why it happens:** `setupCanvas` sets `canvas.width` and `canvas.height` (backing store), which resets all context transforms. Then it calls `ctx.scale(dpr, dpr)`. If `setupCanvas` is called every frame (inside the rAF loop), the `ctx.scale` call is correctly re-applied each frame — this is fine. But if the canvas is resized mid-game (user rotates device), the ResizeObserver fires and `setupCanvas` runs again, which is also correct.
**How to avoid:** Always call `setupCanvas` before drawing each frame. The cost is one `getBoundingClientRect()` call per frame — negligible. This is the established pattern from Phase 5. [VERIFIED: setupCanvas.ts already implemented this way]
**Warning signs:** Sprites rendered at 2x expected positions on retina displays (forgot ctx.scale).

### Pitfall 5: Touch Events on Canvas Not Firing
**What goes wrong:** Touch taps on mobile do nothing — the game doesn't jump or start.
**Why it happens:** The canvas is positioned absolutely under overlay divs. If the overlay div (`z-10`) intercepts touch events, the canvas touchstart handler never fires. Or the `passive: true` default prevents `preventDefault` from working, causing the browser to handle the touch event before the game can.
**How to avoid:** Register the touchstart listener on the topmost interactive layer (the game container div, not just the canvas) with `{ passive: false }`. Alternatively, ensure overlays use `pointer-events-none` when not showing interactive buttons, letting touches pass through to the canvas.
**Warning signs:** Touch works on desktop (simulated touch) but not on a real device.

### Pitfall 6: Obstacle Pool Initialization
**What goes wrong:** First obstacle appears at x=0 (immediately at Samus), giving zero reaction time. Or all obstacles start at the same x position.
**Why it happens:** Obstacle positions initialized without stagger.
**How to avoid:** Initialize the pool with obstacles at staggered positions beyond the right edge:
```typescript
// obstacle 1: just off right edge
{ x: canvasWidth + 100, gapTop: ..., gapBottom: ... }
// obstacle 2: one "spacing" further right
{ x: canvasWidth + 100 + OBSTACLE_SPACING, gapTop: ..., gapBottom: ... }
```
`OBSTACLE_SPACING` should be large enough to give the player reaction time (e.g., `canvasWidth * 0.6` for a reasonable gap between walls).
**Warning signs:** Player is immediately killed by an obstacle at the start of each game.

### Pitfall 7: Gravity Values that Feel Wrong
**What goes wrong:** Physics values in "meters per second" from a tutorial feel completely different in CSS pixels.
**Why it happens:** Physics tutorials use SI units (9.8 m/s²). CSS pixels have no fixed physical size. A 400px tall game area has very different physics feel than a 900px tall game area.
**How to avoid:** Tune gravity and jump velocity relative to canvas height, not absolute pixel values. Alternatively, express in CSS pixels/s² from the start and tune empirically. PHYSICS.gravity = 1200 CSS px/s² is a reasonable starting point for a ~700px play area — it produces a ~0.43 second hang time at PHYSICS.jumpVelocity = 520 px/s. Budget a tuning pass.
**Warning signs:** Game feels sluggish (gravity too low) or Samus barely leaves the floor before falling (jump velocity too low relative to gravity).

---

## Code Examples

### Delta-Time rAF Loop
```typescript
// Source: MDN requestAnimationFrame pattern [CITED] + dt cap [ASSUMED standard practice]
useEffect(() => {
  if (state.screen !== "playing") return;
  
  // Reset physics state for a fresh game
  gameRef.current = createInitialGameState(canvasWidthRef.current, canvasHeightRef.current);

  let rafId: number;
  let lastTs: number | null = null;

  function loop(ts: number) {
    const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    updateGame(gameRef.current, dt, canvasWidthRef.current, canvasHeightRef.current);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = setupCanvas(canvas);
      const rect = canvas.getBoundingClientRect();
      if (ctx) drawScene(ctx, "playing", rect.width, rect.height, gameRef.current);
    }

    if (gameRef.current.gameOver) {
      dispatch({ type: "GAME_OVER", score: gameRef.current.obstaclesCleared });
      return;
    }

    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafId);
}, [state.screen]);
```

### Screen-Ref Mirror Pattern
```typescript
// Source: ASSUMED — standard React pattern for stable closures in event listeners
const screenRef = useRef<GameScreen>("idle");
useEffect(() => {
  screenRef.current = state.screen;
}, [state.screen]);
```

### touchstart with passive: false
```typescript
// Source: MDN addEventListener passive option [CITED]
canvas.addEventListener("touchstart", onTouchStart, { passive: false });
// REQUIRED: without { passive: false }, e.preventDefault() is silently ignored on iOS
```

### Canvas Width/Height Tracking for Physics
```typescript
// The rAF loop needs canvas dimensions for physics bounds.
// Use a ref pair updated by the ResizeObserver.
const canvasWidthRef = useRef(0);
const canvasHeightRef = useRef(0);

// In ResizeObserver callback:
const rect = canvas.getBoundingClientRect();
canvasWidthRef.current = rect.width;
canvasHeightRef.current = rect.height;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` for game loop | `requestAnimationFrame` | ~2011 (standardized) | Syncs with paint cycle, no tearing, browser-throttles in background |
| Fixed timestep (no dt) | Delta-time multiplication | Standard since DirectX era | Frame-rate independent simulation |
| Passive event listeners (default) | `{ passive: false }` for touch | iOS Safari 11.1 (2018) | Required for `preventDefault` on touchstart to work |
| `Date.now()` for timing | `performance.now()` (via rAF timestamp) | ~2012 | Sub-millisecond precision, monotonic, not affected by system clock changes |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Flappy Bird style jump (any tap applies upward velocity, not ground-only) is the intended mechanic | Pattern 6 | If ground-only jump is intended, add `isOnGround` guard; game feel changes significantly |
| A2 | PHYSICS constants (gravity=1200, jump=520, baseScrollSpeed=220) will feel reasonable as a starting point | Pattern 8 | Values almost certainly need tuning after first play; plan must budget a tuning task |
| A3 | 2-obstacle pool is sufficient (obstacles staggered ~60% canvas width apart) | Pattern 5 | If obstacles need to be closer together at high speeds, pool size may need to grow to 3 |
| A4 | `setupCanvas` called every rAF frame (re-applies DPR scale) is not a performance concern | Pitfall 4 | At 120fps, 120 `getBoundingClientRect()` calls/second; this is standard Canvas 2D practice and should be fine, but could optimize if profiling shows it hot |
| A5 | Speed progression cap at 2.5x multiplier prevents unplayable speeds | Pattern 5 | Cap value needs empirical tuning; too low = game never gets hard, too high = impossible |

---

## Open Questions

1. **Jump mechanic: Flappy Bird vs. ground-only**
   - What we know: Success criteria say "jumps upward when the player taps" — no ground-only constraint stated
   - What's unclear: Should mid-air re-jump be allowed (Flappy Bird) or only from ground?
   - Recommendation: Implement Flappy Bird style (always apply jump on input) — matches genre expectations. If user wants ground-only, add `isOnGround` guard later.

2. **Number of obstacles in pool**
   - What we know: One pair of rocks is visible in the Phase 5 static scene. Flappy Bird typically has 2-3 pipes in the pool.
   - What's unclear: How many obstacle pairs are needed to avoid a visible gap between walls at max scroll speed?
   - Recommendation: Start with 2. At `baseScrollSpeed * maxMultiplier = 220 * 2.5 = 550 px/s` and `canvasWidth ≈ 400px` on mobile, a pair takes `~0.73s` to cross. At 60% canvas spacing, the second obstacle starts at 240px — that should fill coverage. Verify visually.

3. **Collision detection boundary for Phase 6**
   - What we know: Phase 6 success criteria include Samus falling under gravity and obstacles scrolling. Phase 7 handles collision/scoring.
   - What's unclear: Should Phase 6 implement any collision detection at all, or just let Samus pass through obstacles to verify physics independently?
   - Recommendation: Phase 6 should implement a `gameOver` flag in `updateGame` for hitting the floor (Samus falls below the floor line permanently) as a minimal safety net to test the game loop end-to-end. Full AABB collision with rock walls defers to Phase 7.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is code-only. All required APIs (`requestAnimationFrame`, `KeyboardEvent`, `TouchEvent`, `MouseEvent`) are browser built-ins. No external CLIs, services, or packages required. The existing Next.js dev environment is sufficient.

---

## Security Domain

`security_enforcement` not explicitly disabled in config.json (absent = enabled, per research instructions).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access control |
| V5 Input Validation | yes (minimal) | Keyboard event codes are validated (`e.code === "Space" || e.code === "ArrowUp"`) — no untrusted string interpolated into DOM or canvas context |
| V6 Cryptography | no | No cryptography |

### Known Threat Patterns for Canvas Game + Input Handlers

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via keyboard input | Tampering | Key codes are compared to allowlist (`"Space"`, `"ArrowUp"`) — not rendered or eval'd |
| Prototype pollution via event data | Tampering | Event properties are read-only browser types — no JSON.parse or dynamic property access |
| DoS via rapid input flooding | Denial of Service | Input handler is idempotent (setting velocity to a fixed value; not accumulating) — rapid tapping cannot amplify jump velocity beyond PHYSICS.jumpVelocity |

**Conclusion:** No meaningful security surface. The game loop reads from browser event objects with whitelisted codes and writes to a local ref object. No network, no auth, no user data processed.

---

## Sources

### Primary (HIGH confidence)
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) — loop timestamp parameter, cancellation, background tab throttling
- [MDN: EventTarget.addEventListener — passive option](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive) — `{ passive: false }` requirement for preventDefault on iOS
- [MDN: TouchEvent](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent) — touchstart event interface
- Codebase: `components/samus-run/SamusRunGame.tsx`, `components/samus-run/constants.ts`, `components/samus-run/canvas/` — all Phase 5 output verified by reading files directly
- `.planning/STATE.md` — locked architectural decisions (useRef for physics, zero new packages)

### Secondary (MEDIUM confidence)
- Delta-time cap at `Math.min(dt, 0.05)` — standard browser game dev practice; multiple reputable sources agree on the pattern (MDN examples, game dev tutorials)

### Tertiary (LOW confidence / ASSUMED)
- PHYSICS constant starting values (gravity=1200, jump=520, speed=220) — derived from Flappy Bird genre feel, will require empirical tuning
- Flappy Bird jump mechanic (any-tap) vs. ground-only assumption
- 2.5x max speed multiplier cap

---

## Metadata

**Confidence breakdown:**
- rAF loop + delta-time pattern: HIGH — canonical browser game loop, MDN verified
- Input unification (keyboard + mouse + touch): HIGH — well-established event APIs
- useRef for physics state: HIGH — locked decision in STATE.md
- Physics constant values: LOW — starting estimates requiring tuning
- Obstacle pool sizing: MEDIUM — based on canvas geometry math

**Research date:** 2026-04-20
**Valid until:** 2026-07-20 (browser APIs stable; React 19 patterns stable)
