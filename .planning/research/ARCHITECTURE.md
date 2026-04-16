# Architecture: Flappy Bird Integration

**Project:** the shadow realm — v1.1 Flappy Bird
**Researched:** 2026-04-15
**Confidence:** HIGH (all decisions grounded in observed codebase, no speculation)

---

## Existing Architecture (observed, not assumed)

```
app/
  layout.tsx                    — RootLayout, Geist fonts, dark class hardcoded on <html>
  globals.css                   — Tailwind v4 @import, CSS vars, .heading-gradient
  page.tsx                      — Server Component, imports lib/projects.ts, renders catalog
  projects/
    math-flashcards/
      page.tsx                  — "use client" single-file component, all logic + sub-components inline
lib/
  projects.ts                   — Project[] typed array, single source of truth for catalog
next.config.ts                  — Empty config, no output: 'export'
package.json                    — Next.js 15.3.9, React 19, Tailwind v4
```

There is no `src/` directory. No `public/` directory exists yet. The math-flashcards page is the established pattern for project pages: one `page.tsx` file, `"use client"` at the top, all logic and inline sub-components in the same file.

The catalog data model in `lib/projects.ts`:
```typescript
export interface Project {
  slug: string;
  name: string;
  description: string;
  href: string;
}
export const projects: Project[] = [
  { slug: "math-flashcards", name: "math flash cards", ... }
];
```

`app/page.tsx` maps over `projects` directly — no route generation, just links. Adding a new catalog entry is a one-line array addition.

---

## Recommended File Structure

```
app/
  projects/
    flappy-bird/
      page.tsx            — "use client", game state machine, composes sub-components
      GameCanvas.tsx      — Canvas rendering, rAF game loop, physics, audio
      GameOverlay.tsx     — HUD, start screen, game-over screen (pure JSX, no browser APIs)
lib/
  projects.ts             — ADD flappy-bird entry (one line)
public/
  sounds/
    flap.mp3
    score.mp3
    die.mp3
```

**Why three files instead of one monolith:**
Math-flashcards works as a single file because its logic is pure React state + DOM events — no imperative browser APIs. Flappy Bird requires a `requestAnimationFrame` loop, a Canvas ref with imperative draw calls, and Web Audio. Mixing that teardown logic with screen-state JSX creates a component that is hard to reason about and harder to debug. `GameCanvas.tsx` isolates all imperative code. `GameOverlay.tsx` has zero browser API calls, making it readable and modifiable without touching the game loop.

**Why not split further (separate HUD, StartScreen, GameOverScreen components):**
This is a personal project with one developer. Three files is the right size. More files mean more prop-threading and more places to look when something breaks. Inline sub-components inside `GameOverlay.tsx` (following the math-flashcards pattern) are the right call.

**Why not reuse the public/static/ iframe pattern from the earlier architecture doc:**
That pattern exists for the standalone HTML/JS math-flashcards file that is already built. Flappy Bird is being built from scratch in React/TypeScript — it belongs as a native Next.js page, not an iframe over an HTML file.

---

## Component Boundaries

| Component | Responsibility | Browser APIs | Receives | Emits |
|-----------|---------------|-------------|----------|-------|
| `page.tsx` | Game state machine, layout shell, back link | None | — | gameState, score, highScore → children |
| `GameCanvas.tsx` | Canvas draw, rAF loop, physics, collision, audio | Canvas 2D, rAF, Web Audio, localStorage (write on death) | gameState, onScore, onDie | callbacks |
| `GameOverlay.tsx` | Start/dead screens, score HUD | None | gameState, score, highScore, onStart | — |

---

## SSR Safety

All three files in `app/projects/flappy-bird/` must begin with `"use client"`. This is the same approach math-flashcards uses. The `"use client"` directive on `page.tsx` establishes a client component boundary — Next.js will not attempt to server-render any component in this subtree.

Within client components, browser-only APIs must still be deferred because components render once on the client before the DOM is available. Rules by API:

**Canvas ref access**
Never access `canvasRef.current` outside a `useEffect` or event handler. It is `null` on the initial render pass.

```typescript
useEffect(() => {
  const canvas = canvasRef.current; // safe here
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  // ...
}, []);
```

**requestAnimationFrame**
Start inside `useEffect`. Store the frame ID in a `useRef` so the cleanup function can cancel it.

**localStorage**
Read inside `useEffect` on mount. Writing during a game-over callback is fine — that callback is only ever called from a browser event, not during render.

**AudioContext**
Must be created inside a user gesture handler (click, pointerdown, keydown). Browsers block `new AudioContext()` before interaction. Do not create at module scope, in `useEffect`, or during render. Store in a `useRef`.

---

## Game Loop Pattern

```typescript
// GameCanvas.tsx (structure, not final implementation)
"use client";

import { useRef, useEffect } from "react";

export function GameCanvas({ gameState, onScore, onDie }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const worldRef = useRef<GameWorld>(initialWorld());

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05); // cap at 50ms to survive tab switching
      last = now;
      updatePhysics(worldRef.current, dt);
      drawFrame(ctx, canvas, worldRef.current);
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [gameState, onScore, onDie]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
```

**Why `worldRef` not `useState` for physics:**
React state updates are batched and asynchronous. A `requestAnimationFrame` loop calling `setState` 60 times per second creates 60 pending reconciliations per second and visual stutter. Physics state (bird Y position, velocity, pipe positions, score counter) belongs in a plain mutable object stored in `useRef`. Only values that need to trigger a React re-render — specifically the score display and game state transitions — flow out through callbacks.

**The dt (delta time) approach:**
Using elapsed wall-clock time per frame rather than fixed physics steps makes the game frame-rate independent. A device running at 120fps and a device running at 60fps will both produce the same physics trajectory. Cap dt at 50ms to prevent a huge physics jump after a tab regains focus.

---

## Responsive Canvas

```typescript
useEffect(() => {
  const canvas = canvasRef.current!;
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);
  return () => window.removeEventListener("resize", resize);
}, []);
```

All game object sizes must be expressed as fractions of `canvas.width` / `canvas.height`, not pixel constants:

```typescript
const PIPE_WIDTH = canvas.width * 0.12;
const PIPE_GAP = canvas.height * 0.28;
const BIRD_RADIUS = canvas.width * 0.04;
```

This is the only way to get a game that genuinely fills the screen on a 375px phone and a 1440px desktop with correct proportions on both.

---

## State Management

No external state library. All state is local to the `flappy-bird/` route.

| State piece | Storage | Location | Why |
|-------------|---------|----------|-----|
| `gameState: "idle" \| "playing" \| "dead"` | useState | `page.tsx` | Drives which overlay renders and whether game loop runs |
| `score: number` | useState | `page.tsx` | Displayed in HUD; flows up from GameCanvas via `onScore` callback |
| `highScore: number` | useState | `page.tsx` | Initialized from localStorage on mount; written to localStorage on death |
| Physics world (bird, pipes, velocity) | useRef object | `GameCanvas.tsx` | Mutated every frame, never triggers re-render |
| AudioContext + sound buffers | useRef | `GameCanvas.tsx` | Created once on first gesture, persisted across rounds |

**localStorage key:** `fb-hi`. Short, namespaced, no collision risk with any other feature on the site.

**High score initialization:**
```typescript
// page.tsx
useEffect(() => {
  const stored = localStorage.getItem("fb-hi");
  if (stored) setHighScore(Number(stored));
}, []);
```

**High score write (inside onDie callback):**
```typescript
const handleDie = useCallback((finalScore: number) => {
  setGameState("dead");
  if (finalScore > highScore) {
    setHighScore(finalScore);
    localStorage.setItem("fb-hi", String(finalScore));
  }
}, [highScore]);
```

---

## Input Handling

Single input: flap. Three trigger sources — tap (mobile), click (desktop), spacebar (keyboard).

```typescript
useEffect(() => {
  if (gameState !== "playing") return;

  const flap = (e: Event) => {
    e.preventDefault(); // prevents scroll on spacebar, scroll bounce on mobile
    worldRef.current.velocity = FLAP_VELOCITY;
    playSound(audioRef.current?.flap);
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.code === "Space") flap(e);
  };

  window.addEventListener("pointerdown", flap);
  window.addEventListener("keydown", handleKey);

  return () => {
    window.removeEventListener("pointerdown", flap);
    window.removeEventListener("keydown", handleKey);
  };
}, [gameState]);
```

Use `pointerdown` rather than `touchstart` + `click` separately. `pointerdown` fires for both mouse and touch with one listener and does not double-fire on mobile the way `click` does after `touchstart`.

The "idle" state also needs input to start the game — wire the same `pointerdown` to transition `"idle" -> "playing"` in `page.tsx`, passing it down as an `onStart` prop to `GameOverlay.tsx`.

---

## Audio

**Asset location:** `public/sounds/flap.mp3`, `public/sounds/score.mp3`, `public/sounds/die.mp3`. Served as static files at `/sounds/flap.mp3` (no `public/` prefix in URLs). No `public/` directory exists yet — creating it is required.

**Loading pattern:**

```typescript
// In GameCanvas.tsx
const audioRef = useRef<{
  ctx: AudioContext;
  flap: AudioBuffer;
  score: AudioBuffer;
  die: AudioBuffer;
} | null>(null);

// Called on first user gesture (pointerdown/keydown)
async function initAudio() {
  if (audioRef.current) return; // already initialized
  const ctx = new AudioContext();
  const [flap, score, die] = await Promise.all([
    loadBuffer(ctx, "/sounds/flap.mp3"),
    loadBuffer(ctx, "/sounds/score.mp3"),
    loadBuffer(ctx, "/sounds/die.mp3"),
  ]);
  audioRef.current = { ctx, flap, score, die };
}

async function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  return ctx.decodeAudioData(arr);
}

function playSound(buffer: AudioBuffer | undefined) {
  if (!buffer || !audioRef.current) return;
  const { ctx } = audioRef.current;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
```

`BufferSourceNode` instances are single-use by Web Audio spec — create a new one per `playSound` call. The `AudioBuffer` (decoded audio data) is reusable; the `BufferSourceNode` (playback instance) is not.

If sourcing sound files blocks development, the entire audio section can be stubbed (no-op functions) and added last. The game is fully functional without sound.

---

## Canvas Drawing Approach

The PROJECT.md spec says "classic colorful aesthetic (blue sky, green pipes, yellow bird)". This is achievable entirely with Canvas 2D primitives — rectangles, arcs, gradient fills. No image files or sprites are required, which eliminates asset loading complexity.

```typescript
// Example draw calls
// Sky background
ctx.fillStyle = "#70c5ce";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Bird (yellow circle)
ctx.fillStyle = "#f5c518";
ctx.beginPath();
ctx.arc(birdX, world.birdY, BIRD_RADIUS, 0, Math.PI * 2);
ctx.fill();

// Pipes (green rectangles)
ctx.fillStyle = "#5fa832";
// top pipe
ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapTop);
// bottom pipe
ctx.fillRect(pipe.x, pipe.gapTop + PIPE_GAP, PIPE_WIDTH, canvas.height);
```

Pixel art sprites can be layered in later with `drawImage()` if desired, without restructuring anything.

---

## New Files vs Modified Files

### New files (create)

| File | Notes |
|------|-------|
| `app/projects/flappy-bird/page.tsx` | Route entry, game state, layout, back link |
| `app/projects/flappy-bird/GameCanvas.tsx` | Canvas, rAF loop, physics, collision detection, audio |
| `app/projects/flappy-bird/GameOverlay.tsx` | Start screen, game-over screen, score HUD |
| `public/sounds/flap.mp3` | Required if audio is included |
| `public/sounds/score.mp3` | Required if audio is included |
| `public/sounds/die.mp3` | Required if audio is included |

### Modified files (existing)

| File | Change |
|------|--------|
| `lib/projects.ts` | Add one object to the `projects` array |

`app/page.tsx` does not need to change — it already maps over `lib/projects.ts` dynamically. `app/layout.tsx`, `app/globals.css`, and `next.config.ts` do not need to change.

---

## Build Order (dependency-aware)

**Step 1 — `lib/projects.ts` entry**
Add the flappy-bird entry first. The catalog link on the home page will appear immediately. The route at `/projects/flappy-bird` will 404 until step 3, which is fine during development.

**Step 2 — `GameOverlay.tsx`**
Pure JSX, no browser APIs. Build and visually verify the start screen and game-over screen before writing a single line of canvas code. Define the props interface here — it becomes the contract `page.tsx` fulfills.

**Step 3 — `page.tsx`**
Wire up the game state machine (`idle -> playing -> dead -> idle`). Import and render `GameOverlay`. Stub `GameCanvas` with a placeholder `<div>`. At this point the UI flow is testable end-to-end in the browser.

**Step 4 — `GameCanvas.tsx` — canvas mount + resize**
Get the canvas rendering and filling the viewport. No game logic yet — just a colored rectangle to prove the canvas works.

**Step 5 — `GameCanvas.tsx` — static draw**
Draw the bird, pipes, and background at fixed positions. No physics, no movement. Verify visual proportions on mobile and desktop.

**Step 6 — `GameCanvas.tsx` — physics loop**
Add the rAF loop, gravity, flap velocity, pipe scrolling. Bird should fall and flap on tap/spacebar. Pipes should scroll left and loop.

**Step 7 — `GameCanvas.tsx` — collision + scoring**
Add bounding-box collision detection. Emit `onDie`. Add pipe gap crossing detection. Emit `onScore`.

**Step 8 — `GameCanvas.tsx` — audio**
Add Web Audio init on first gesture, load buffers, wire `playSound` calls to flap/score/die events. This is the last step because it can be deferred or skipped without affecting any other step.

---

## Anti-Patterns to Avoid

### useState for physics
Calling `setState` inside a `requestAnimationFrame` loop triggers 60+ React reconciliations per second. The game becomes a slideshow and the console fills with warnings. Use a mutable `useRef` object for all physics state. Only call `setState` for game-phase transitions and score display updates.

### AudioContext at module or component scope
The browser will throw `NotAllowedError` if `new AudioContext()` is called before a user gesture. Server-side, `AudioContext` does not exist at all. Create it inside the first `pointerdown` or `keydown` handler, guarded by a check that it hasn't been created already.

### Missing cancelAnimationFrame in useEffect cleanup
When `gameState` changes from `"playing"` to `"dead"`, React cleans up the current `useEffect` and does not start a new one (since the new `gameState` is `"dead"`, not `"playing"`). Without `cancelAnimationFrame`, the old loop keeps running against a dead game state, consuming CPU and potentially calling `onDie` repeatedly.

### Hardcoded pixel dimensions
A bird radius of `20px` looks correct at 390px viewport width and broken at 1440px. Express all game object sizes as fractions of canvas dimensions. Define constants like `const BIRD_RADIUS = canvas.width * 0.04` inside the draw/physics functions where `canvas` is available.

### Accessing canvasRef.current during render
`useRef` is initialized to `null`. Accessing `.current` during the render function (outside a `useEffect` or event handler) will throw a null pointer error. Canvas ref access belongs exclusively in effects and callbacks.

---

## Sources

- Observed codebase: `app/projects/math-flashcards/page.tsx` — established "use client" pattern, inline sub-components
- Observed codebase: `lib/projects.ts` — Project interface and catalog array structure
- Observed codebase: `app/page.tsx` — catalog renders from lib/projects.ts, no change needed
- MDN Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API (browser-native, HIGH confidence)
- MDN Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API (browser-native, HIGH confidence)
- React docs on useRef for mutable values: https://react.dev/reference/react/useRef#storing-information-between-renders (HIGH confidence)
- Next.js "use client" directive: https://nextjs.org/docs/app/api-reference/directives/use-client (HIGH confidence)
