# Phase 5: Canvas and Environment - Research

**Researched:** 2026-04-18
**Domain:** HTML Canvas 2D API, device pixel ratio / HiDPI rendering, React lifecycle integration, procedural 2D environment art
**Confidence:** HIGH

---

## Summary

Phase 5 adds two things to the existing game shell: (1) a canvas element that fills the viewport correctly on every device, and (2) all the visual content drawn into that canvas — the Norfair environment (background, lava floor, rock wall obstacle shapes) and two Samus sprite states (idle varia suit, space jump). No physics run. No input handling. This is the "world exists, nothing moves" phase.

The primary technical challenges are viewport sizing on mobile (iOS Safari `100vh` trap is already handled by the existing `h-dvh` container), device pixel ratio (DPR) scaling for retina crispness, React lifecycle management of the canvas context and a static render call, and drawing the Norfair visual world entirely with Canvas 2D primitives — no image assets, no external libraries, per the locked v1.1 roadmap decision.

The existing `SamusRunGame.tsx` has a placeholder `<div className="absolute inset-0 bg-[#0a0a0a]" />` that Phase 5 replaces with a `<canvas>` element and a `useEffect` that (a) sizes the canvas with DPR, (b) gets the 2D context, (c) draws the full environment + sprites, and (d) cleans up on unmount. The `useReducer` state machine from Phase 4 remains completely unchanged — Phase 5 only adds canvas rendering alongside the existing overlays.

**Primary recommendation:** Replace the placeholder div with a `<canvas ref={canvasRef}>`, size it via DPR in `useEffect` with `ResizeObserver` for resize handling, draw the static scene on mount and on state changes, and represent Samus and environment art as Canvas 2D primitive shapes with a Norfair-accurate cool-dark-reddish palette.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISPLAY-01 | Canvas fills the full viewport on phone, tablet, and desktop — no overflow or letterboxing | CSS `position: absolute; inset: 0` on canvas + parent `h-dvh overflow-hidden` (already in place). Canvas `width`/`height` attributes set to `clientWidth * dpr` / `clientHeight * dpr`. |
| DISPLAY-02 | Canvas is responsive to window resize without breaking layout | `ResizeObserver` on the parent container re-runs the DPR sizing function and redraws the scene on every size change. |
| DISPLAY-03 | Sprites and environment are crisp on a retina/high-DPR screen | Three-step DPR pattern: set `canvas.width = css * dpr`, set `canvas.height = css * dpr`, call `ctx.scale(dpr, dpr)`. Set `ctx.imageSmoothingEnabled = false`. CSS `image-rendering: pixelated` on canvas element. |
| VIS-01 | Norfair environment is recognizable: dark cave background, lava detail, reddish rock wall obstacle shapes | Drawn with Canvas 2D `fillRect` / `fillStyle` / path operations using Norfair palette. No image assets. |
| VIS-02 | Samus varia suit sprite visible in idle position | Drawn with Canvas 2D primitive shapes (rectangles and arcs for the iconic helmet/suit silhouette). Position driven by a static idle coordinate. |
| VIS-03 | Samus space jump sprite appears when jump state is toggled | Second sprite drawing function for the curled/extended jump pose. Toggle via a `debugForceJump` boolean prop or a dev key flag — verified by toggling. |
</phase_requirements>

---

## Standard Stack

No new npm packages. All capability comes from browser built-ins and the existing project stack. [VERIFIED: package.json — zero new deps for v1.1 locked in STATE.md]

### Core (already installed)
| Library | Version | Purpose | Role in Phase 5 |
|---------|---------|---------|-----------------|
| Next.js | 15.3.9 | Framework | Already provides SSR guard via `next/dynamic ssr:false` from Phase 4 |
| React | ^19.0.0 | UI runtime | `useRef`, `useEffect`, `useLayoutEffect` for canvas lifecycle |
| TypeScript | ^5 | Type safety | Type the canvas ref, draw functions, and sprite state |
| Tailwind CSS | ^4 | Styling | `absolute inset-0 w-full h-full` on canvas; no additional config |

### Browser Built-ins (no install)
| API | Purpose | Confidence |
|-----|---------|-----------|
| `HTMLCanvasElement` + `CanvasRenderingContext2D` | Drawing surface and 2D drawing API | HIGH — baseline web standard [CITED: developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D] |
| `window.devicePixelRatio` | DPR multiplier for retina sizing | HIGH — baseline web standard [CITED: developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio] |
| `ResizeObserver` | Detect container size changes for responsive canvas | HIGH — supported in all modern browsers including iOS Safari 13.4+ [CITED: caniuse.com/resizeobserver] |
| `requestAnimationFrame` | Render loop (Phase 6 will use this for the live game loop; Phase 5 uses it only for the static initial draw) | HIGH — baseline web standard |

### No new installs required
Locked decision: zero new npm packages for v1.1. [VERIFIED: STATE.md "Decisions" section]

---

## Architecture Patterns

### Recommended Canvas Module Structure

```
components/
└── samus-run/
    ├── SamusRunGame.tsx          (existing — state machine + overlays + canvas mount point)
    ├── canvas/
    │   ├── setupCanvas.ts        (DPR sizing utility — pure function, no React)
    │   ├── drawEnvironment.ts    (background, lava, ground line)
    │   ├── drawObstacleShape.ts  (rock wall column — static position, no scrolling yet)
    │   └── drawSamus.ts          (idle pose + jump pose drawing functions)
    └── constants.ts              (palette hex values, logical game dimensions)
```

**Why split into modules:** `SamusRunGame.tsx` is already ~100 lines. Inlining all drawing code would make it 400+ lines. The canvas draw functions are pure functions `(ctx, params) => void` — they don't need React and are much easier to test and iterate in isolation.

**Why `canvas/` subdirectory inside `components/samus-run/`:** Keeps all game code co-located. The canvas/ subdir signals "these files are rendering utilities, not React components."

### Pattern 1: Canvas Mount and DPR Setup

**What:** A `useEffect` mounts the canvas, sizes it with DPR correction, gets the 2D context, and draws the initial scene. A `ResizeObserver` re-runs sizing on container resize.

**When to use:** Any time a canvas must fill a dynamic container and stay crisp on retina.

**Key insight:** The canvas element's `width` and `height` attributes are the backing store resolution (physical pixels). The CSS size (set via `style.width`/`style.height` or Tailwind classes `absolute inset-0 w-full h-full`) is the display size. These must be kept in sync through `window.devicePixelRatio`.

```typescript
// components/samus-run/canvas/setupCanvas.ts
// Source: web.dev/articles/canvas-hidipi (CITED) + MDN devicePixelRatio (CITED)

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Backing store resolution = CSS size × DPR
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Scale all drawing operations so we can use CSS pixel coordinates
  ctx.scale(dpr, dpr);

  // Disable smoothing — pixel art must stay crisp
  ctx.imageSmoothingEnabled = false;

  return ctx;
}
```

```typescript
// In SamusRunGame.tsx — canvas mount with ResizeObserver
// Source: ASSUMED (standard React canvas pattern, aligned with MDN + web.dev examples)

const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = setupCanvas(canvas);
  if (!ctx) return;

  drawScene(ctx, state, canvas); // draws environment + correct Samus sprite

  const observer = new ResizeObserver(() => {
    const ctx = setupCanvas(canvas);
    if (ctx) drawScene(ctx, state, canvas);
  });
  observer.observe(canvas.parentElement!);

  return () => observer.disconnect();
}, [state.screen]); // re-draw when game screen changes
```

**Important:** `useEffect` is correct here (not `useLayoutEffect`) for the initial static draw. `useLayoutEffect` is needed when you must prevent a visual flash between render and paint — for a canvas that starts black and draws over itself, there is no flash risk. Use `useLayoutEffect` if the overlay flickers are visible during state transitions.

### Pattern 2: Canvas Element in JSX

**What:** Replace the existing placeholder `<div>` with a `<canvas>` that has correct Tailwind positioning and the `image-rendering: pixelated` CSS property.

```typescript
// Replace in SamusRunGame.tsx
// Before (Phase 4):
// <div className="absolute inset-0 bg-[#0a0a0a]" />

// After (Phase 5):
<canvas
  ref={canvasRef}
  className="absolute inset-0 w-full h-full"
  style={{ imageRendering: "pixelated" }}
/>
```

**Why `image-rendering: pixelated`:** Tells the browser to use nearest-neighbor interpolation if the canvas is ever scaled by CSS (e.g., browser zoom, fractional DPR rounding). Without it, the browser may apply bilinear interpolation which blurs pixel art edges. [VERIFIED: multiple sources — kirupaForum + Casual Effects pixel art tech tips]

**Why not `crisp-edges`:** `pixelated` is the CSS value with broadest support for nearest-neighbor scaling specifically. `crisp-edges` is less consistently implemented. [ASSUMED — training knowledge, worth verifying in target browsers]

### Pattern 3: Norfair Environment Drawing

**What:** A pure `drawEnvironment(ctx, width, height)` function that renders the cave background, lava floor, and a static rock wall obstacle pair. No scrolling — that is Phase 6.

**Norfair palette (derived from Metroid game aesthetic, aligned with project cool-tone constraint):**

```typescript
// components/samus-run/constants.ts
// [ASSUMED — palette derived from Metroid Norfair visual reference, not from a verified color tool]
export const NORFAIR = {
  sky: "#0d0608",          // near-black, very dark crimson-black cave ceiling
  midground: "#1a0c0e",    // deep dark reddish cave wall
  lavaGlow: "#3d1010",     // dark lava pool color
  lavaHighlight: "#7a2020",// lava surface bright line
  rock: "#2e1a1a",         // rock wall body (brownish-dark-red)
  rockEdge: "#4a2828",     // rock wall highlight edge
  groundLine: "#5c3030",   // ground / lava surface boundary
} as const;
```

**Note on palette:** The project constraint is "cool tones only — nothing warm, nothing bright, nothing loud" from CLAUDE.md. Pure Norfair reds conflict slightly with this. The resolution: use very dark, desaturated reddish-browns rather than saturated fire-reds. The `NORFAIR` palette above leans toward near-black with only a hint of red — this reads as "cave" without being warm or loud. The project palette already uses near-neutrals (`#0a0a0a`, `#9ba3ad`, `#ededed`). The Samus Run section can introduce very dark reddish undertones as a thematic exception, since it's inside a canvas element not touching the site's main UI. **This is a judgment call that should be confirmed with the user at plan time.** [ASSUMED — palette interpretation]

**Drawing the environment:**
```typescript
// components/samus-run/canvas/drawEnvironment.ts
// Source: ASSUMED (Canvas 2D primitives — standard fillRect / fillStyle pattern)

export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // 1. Sky / cave background
  ctx.fillStyle = NORFAIR.sky;
  ctx.fillRect(0, 0, width, height);

  // 2. Lava floor (bottom ~15% of viewport)
  const floorY = height * 0.85;
  ctx.fillStyle = NORFAIR.lavaGlow;
  ctx.fillRect(0, floorY, width, height - floorY);

  // 3. Lava surface shimmer line
  ctx.strokeStyle = NORFAIR.lavaHighlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  // 4. Ground stalactite hints (cave ceiling detail)
  // Series of downward-pointing triangles along top edge
  drawCeilingDetail(ctx, width);
}
```

### Pattern 4: Samus Sprite as Canvas Primitives

**What:** Two drawing functions — `drawSamusIdle(ctx, x, y, scale)` and `drawSamusJump(ctx, x, y, scale)` — use Canvas 2D rectangles and arcs to draw a recognizable but simple Samus silhouette.

**Samus varia suit iconic features to capture:**
- Helmet: rounded top (arc/circle), visor slit (horizontal rect)
- Shoulder pads: two raised rounded rectangles wider than the body
- Arm cannon: rectangular protrusion on right side
- Color: cool-silver/grey varia suit palette (`#5a7a8a` base, `#8aacbc` highlight, `#2a4a5a` shadow) — these are cool tones and work within the project constraint

**Why primitives, not a sprite sheet:** The v1.1 roadmap locked "zero new npm packages" and sourcing real Samus sprite art would require either pixel art files (not yet created) or a proper asset pipeline. Canvas primitives produce a distinctive enough silhouette for the Phase 5 success criteria and are 100% code, 100% in-repo. [VERIFIED: STATE.md roadmap decision]

```typescript
// components/samus-run/canvas/drawSamus.ts
// Source: ASSUMED (Canvas 2D primitives pattern)

export function drawSamusIdle(
  ctx: CanvasRenderingContext2D,
  x: number,  // center x
  y: number,  // bottom of feet
  scale: number = 1
): void {
  const w = 24 * scale;   // body width
  const h = 48 * scale;   // total height

  // Body
  ctx.fillStyle = "#5a7a8a";
  ctx.fillRect(x - w * 0.4, y - h * 0.6, w * 0.8, h * 0.5);

  // Shoulder pads
  ctx.fillStyle = "#8aacbc";
  ctx.fillRect(x - w * 0.6, y - h * 0.65, w * 0.25, h * 0.15);
  ctx.fillRect(x + w * 0.35, y - h * 0.65, w * 0.25, h * 0.15);

  // Helmet (circle)
  ctx.fillStyle = "#5a7a8a";
  ctx.beginPath();
  ctx.arc(x, y - h * 0.82, w * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Visor slit
  ctx.fillStyle = "#c8e0e8";
  ctx.fillRect(x - w * 0.2, y - h * 0.87, w * 0.4, h * 0.06);

  // Arm cannon (right)
  ctx.fillStyle = "#2a4a5a";
  ctx.fillRect(x + w * 0.35, y - h * 0.5, w * 0.35, h * 0.12);

  // Legs
  ctx.fillStyle = "#4a6a7a";
  ctx.fillRect(x - w * 0.3, y - h * 0.1, w * 0.22, h * 0.1);
  ctx.fillRect(x + w * 0.08, y - h * 0.1, w * 0.22, h * 0.1);
}

export function drawSamusJump(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1
): void {
  // Curled/tucked pose for jump — body rotated, knees raised
  // Same color palette, tighter bounding box, legs tucked up
  const w = 24 * scale;
  const h = 40 * scale;  // slightly shorter when curled

  // Body (slightly tilted — simulate with transformed rect)
  ctx.save();
  ctx.translate(x, y - h * 0.5);
  ctx.rotate(-0.15); // slight forward lean
  ctx.fillStyle = "#5a7a8a";
  ctx.fillRect(-w * 0.35, -h * 0.35, w * 0.7, h * 0.4);
  ctx.restore();

  // Helmet
  ctx.fillStyle = "#5a7a8a";
  ctx.beginPath();
  ctx.arc(x, y - h * 0.78, w * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Visor
  ctx.fillStyle = "#c8e0e8";
  ctx.fillRect(x - w * 0.2, y - h * 0.83, w * 0.4, h * 0.06);

  // Arm cannon extended
  ctx.fillStyle = "#2a4a5a";
  ctx.fillRect(x + w * 0.3, y - h * 0.55, w * 0.45, h * 0.11);

  // Legs tucked
  ctx.fillStyle = "#4a6a7a";
  ctx.fillRect(x - w * 0.2, y - h * 0.15, w * 0.18, h * 0.15);
  ctx.fillRect(x + w * 0.02, y - h * 0.15, w * 0.18, h * 0.15);
}
```

**Note:** These are first-draft primitives. The planner should budget a task for visual tuning after initial implementation — the exact proportions will need refinement against the actual rendered output.

### Pattern 5: Rock Wall Obstacle Shape (Static Placeholder)

Phase 5 draws a static obstacle pair to verify the visual look. No scrolling x-position yet — that is Phase 6.

```typescript
// components/samus-run/canvas/drawObstacleShape.ts
// Source: ASSUMED (Canvas 2D)

export function drawRockWall(
  ctx: CanvasRenderingContext2D,
  x: number,        // left edge of column
  gapTop: number,   // y coordinate of gap top
  gapBottom: number,// y coordinate of gap bottom
  width: number = 40,
  canvasHeight: number
): void {
  // Top column (from 0 down to gapTop)
  ctx.fillStyle = NORFAIR.rock;
  ctx.fillRect(x, 0, width, gapTop);

  // Rough bottom edge of top column
  ctx.fillStyle = NORFAIR.rockEdge;
  ctx.fillRect(x, gapTop - 4, width, 4);

  // Bottom column (from gapBottom to floor)
  ctx.fillStyle = NORFAIR.rock;
  ctx.fillRect(x, gapBottom, width, canvasHeight - gapBottom);

  // Rough top edge of bottom column
  ctx.fillStyle = NORFAIR.rockEdge;
  ctx.fillRect(x, gapBottom, width, 4);
}
```

### Pattern 6: State-Driven Redraw

The canvas re-draws whenever `state.screen` changes (idle → playing → gameover). The `useEffect` dep array includes `state.screen`. When idle, Samus is in the idle pose. When playing or gameover, Samus is in the position before the game logic ran (static — Phase 6 will update position every frame).

```typescript
// Selector: which Samus sprite to draw
const samusSprite = state.screen === "playing" ? "jump" : "idle";
// For Phase 5 debug: also accept a prop/flag `forceJump` to test VIS-03
```

### Anti-Patterns to Avoid

- **Setting `canvas.width`/`canvas.height` in CSS or Tailwind:** Canvas dimensions set via CSS only change the display size, not the backing store — the canvas scales up from its default 300×150 and becomes blurry. Always set `canvas.width` and `canvas.height` as attributes (JavaScript properties), not CSS.
- **Drawing in `render` / JSX:** Canvas drawing is imperative. It must happen in `useEffect` after the element exists in the DOM, not during the React render cycle.
- **Storing `ctx` in `useState`:** The 2D context is a mutable object. Putting it in React state causes unnecessary re-renders and potential stale reference bugs. Use `useRef` for the canvas element; derive `ctx` fresh inside each effect.
- **Forgetting `ctx.scale(dpr, dpr)` after resizing:** Every time `canvas.width` and `canvas.height` are reset, the context transform resets too. `setupCanvas` must re-apply `ctx.scale(dpr, dpr)` on every resize.
- **`imageSmoothingEnabled` reset on resize:** Same as above — it resets when the canvas dimensions change. `setupCanvas` must set it after every resize.
- **Using `useLayoutEffect` by default:** `useLayoutEffect` fires synchronously before paint, which can block the browser. For canvas rendering, `useEffect` (async, after paint) is correct unless there are visible flicker artifacts requiring synchronous draw. [CITED: blog.jakuba.net]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Crisp retina canvas | Custom pixel-doubling hacks | `window.devicePixelRatio` + `ctx.scale(dpr, dpr)` + CSS `image-rendering: pixelated` | This is the canonical browser pattern — hand-rolling a fixed scale of 2 breaks on 3x displays and browser zoom |
| Viewport filling | Custom JS to measure document height | CSS `h-dvh` (already in container) + `absolute inset-0` on canvas | Already solved in Phase 4; `h-dvh` handles iOS Safari viewport correctly |
| Resize detection | `window.resize` event listener | `ResizeObserver` on the parent container | `ResizeObserver` observes the container element directly — more accurate than window resize for embedded components |
| Image assets for sprites | Loading PNG/sprite sheets | Canvas 2D primitives | No asset pipeline, no image loading, no CORS concerns — aligned with zero-npm-packages roadmap decision |

**Key insight:** The DPR pattern is a solved problem with a canonical three-line implementation. The only risk is forgetting to re-apply the scale transform after a resize resets the canvas.

---

## Common Pitfalls

### Pitfall 1: Canvas Default 300×150 Size on Mount
**What goes wrong:** The canvas renders at 300×150 pixels instead of filling the container. Everything looks tiny or cropped.
**Why it happens:** The HTML canvas default size is `width=300 height=150`. If `useEffect` runs before the parent container has been laid out by the browser (e.g., the container has `height: auto` or no explicit size), `getBoundingClientRect()` returns zero dimensions, and `canvas.width = 0 * dpr` produces a zero-pixel canvas.
**How to avoid:** The parent container `<div className="relative w-full h-dvh">` already has explicit dimensions from Phase 4. This is what makes `getBoundingClientRect()` return meaningful values. Do not remove `h-dvh` from the parent.
**Warning signs:** Canvas visible but tiny (300×150 box in the top-left corner); all drawing appears in a small area.

### Pitfall 2: Blurry Canvas on Retina Without DPR Scaling
**What goes wrong:** The canvas looks sharp on a 1x monitor but blurry/fuzzy on a MacBook or iPhone retina display.
**Why it happens:** The canvas backing store is 100% of CSS pixels. On a 2x DPR display, the browser has to upscale each CSS pixel to 2×2 physical pixels, resulting in bilinear blur.
**How to avoid:** `setupCanvas` multiplies `canvas.width` and `canvas.height` by `window.devicePixelRatio`, then calls `ctx.scale(dpr, dpr)`.
**Warning signs:** Text and hard edges in canvas look slightly blurry on Mac or iPhone. Perfectly crisp on 1x Windows monitor.

### Pitfall 3: Scale Transform Lost After Canvas Resize
**What goes wrong:** After a window resize triggers `ResizeObserver`, the DPR scale transform is gone and the canvas renders at 1:1 pixel mapping (blurry again on retina).
**Why it happens:** Setting `canvas.width` or `canvas.height` resets the canvas to a blank state, including all context state (transforms, styles, smoothing settings). Any setup that was done before the resize is erased.
**How to avoid:** `setupCanvas` must be a complete setup function that re-applies `ctx.scale(dpr, dpr)` and `ctx.imageSmoothingEnabled = false` every time it runs, not just once on mount.
**Warning signs:** Canvas is crisp on load but becomes blurry after a browser window resize.

### Pitfall 4: `imageSmoothingEnabled` Not Enough for `image-rendering: pixelated`
**What goes wrong:** Sprites are crisp when drawn but blurry at certain browser zoom levels (e.g., 125% or 150%).
**Why it happens:** When the browser composites the canvas element onto the page at a non-integer scale, it applies its own interpolation — `imageSmoothingEnabled` only controls `drawImage()` calls, not the final browser compositing step.
**How to avoid:** Add `style={{ imageRendering: "pixelated" }}` to the `<canvas>` element in JSX. This tells the browser to use nearest-neighbor interpolation at the compositing step too.
**Warning signs:** Sprites are crisp at 100% zoom but blurry at 125% or 150% browser zoom.

### Pitfall 5: React 19 Strict Mode Double-Invokes Effects
**What goes wrong:** In development, `useEffect` fires twice (mount → unmount → mount). The canvas may appear to flicker or draw twice, and if the `ResizeObserver` is not properly cleaned up in the first unmount, it can throw "ResizeObserver is not connected" errors.
**Why it happens:** React 19 Strict Mode intentionally double-fires effects in development to surface cleanup bugs.
**How to avoid:** Ensure the `useEffect` cleanup function calls `observer.disconnect()`. Double-firing is harmless for a canvas draw (it just draws twice then draws again — no visual artifact). No special handling needed beyond correct cleanup.
**Warning signs:** Console error about ResizeObserver or duplicate animation frames in development only (not in production).

### Pitfall 6: iOS Safari Overscroll Revealing White Background
**What goes wrong:** On iPhone, pulling down on the page reveals a white flash above the black canvas — the browser overscroll bounce shows the underlying page background.
**Why it happens:** The page `<body>` background is white (or the default). The canvas fills the viewport but the HTML body background shows during overscroll.
**How to avoid:** Ensure `app/globals.css` sets `body { background: #0a0a0a; }` or `overflow: hidden` on the container. The existing `overflow-hidden` class on the game container already handles this, but confirm the body background is dark.
**Warning signs:** White flash on iOS when pulling down beyond the top of the page.

---

## Code Examples

### Complete `setupCanvas` Function
```typescript
// components/samus-run/canvas/setupCanvas.ts
// Source: web.dev/articles/canvas-hidipi [CITED] + MDN devicePixelRatio [CITED]

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) return null; // guard against zero-size

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;

  return ctx;
}
```

### Canvas Ref in JSX
```typescript
// In SamusRunGame.tsx — replaces the placeholder <div>
// Source: ASSUMED (standard React canvas pattern)

<canvas
  ref={canvasRef}
  className="absolute inset-0 w-full h-full"
  style={{ imageRendering: "pixelated" }}
/>
```

### Scene Draw Dispatch
```typescript
// In SamusRunGame.tsx — orchestrates all draw calls
// Source: ASSUMED

function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  width: number,
  height: number,
  forceJump = false
): void {
  ctx.clearRect(0, 0, width, height);
  drawEnvironment(ctx, width, height);

  // Static obstacle placeholder (center of screen)
  const obstacleX = width * 0.65;
  drawRockWall(ctx, obstacleX, height * 0.15, height * 0.6, 40, height);

  // Samus position (fixed for Phase 5)
  const samusX = width * 0.2;
  const samusY = height * 0.85; // just above lava floor
  const useJump = forceJump || screen === "playing";
  if (useJump) {
    drawSamusJump(ctx, samusX, samusY, 1);
  } else {
    drawSamusIdle(ctx, samusX, samusY, 1);
  }
}
```

### ResizeObserver Integration
```typescript
// In SamusRunGame.tsx useEffect
// Source: ASSUMED (aligned with MDN ResizeObserver [CITED] and React patterns)

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  let ctx = setupCanvas(canvas);
  if (ctx) {
    drawScene(ctx, state.screen, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
  }

  const parent = canvas.parentElement;
  if (!parent) return;

  const observer = new ResizeObserver(() => {
    ctx = setupCanvas(canvas);
    const rect = canvas.getBoundingClientRect();
    if (ctx) drawScene(ctx, state.screen, rect.width, rect.height);
  });

  observer.observe(parent);
  return () => observer.disconnect();
}, [state.screen]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.resize` event for canvas resize | `ResizeObserver` on the container element | ~2019 (broad support by 2021) | Observe the specific container, not the whole window — more precise, no event listener cleanup footgun |
| Hard-coded `devicePixelRatio = 2` | `window.devicePixelRatio` dynamic read | ~2015 | Handles 1x, 1.5x, 2x, 3x, and fractional zoom levels |
| `canvas.style.width = "100%"` to fill parent | CSS `position: absolute; inset: 0; width: 100%; height: 100%` | — | `inset: 0` (Tailwind `inset-0`) is more explicit and reliable for overlapping absolute children |
| Checking `webkit`/`moz` prefixes for `imageSmoothingEnabled` | `ctx.imageSmoothingEnabled = false` (unprefixed) | All major browsers 2015+ | No prefixes needed for modern browsers; keep `imageSmoothingEnabled` only |

**Deprecated/outdated for this project:**
- `ctx.webkitImageSmoothingEnabled`, `ctx.mozImageSmoothingEnabled`: Prefixed versions — not needed for iOS Safari 9+, Chrome 21+, Firefox 51+. [ASSUMED — based on MDN compat table knowledge]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Norfair palette using very dark reddish-browns is acceptable under the "cool tones only" constraint | Architecture Patterns (Pattern 3) | User may reject any red/warm tones in the canvas — palette would need to shift to blue/grey cave aesthetic |
| A2 | Samus drawn as Canvas 2D primitives produces an "recognizable" silhouette for VIS-02/VIS-03 | Pattern 4 | If primitives don't produce recognizable Samus, a simple pixel art sprite sheet (PNG) may be needed — contradicts zero-new-assets approach but is feasible |
| A3 | `useEffect` (async) is correct over `useLayoutEffect` (sync) for canvas draws in this case | Architecture Patterns (Pattern 1) | If overlays flicker before canvas is drawn, `useLayoutEffect` is needed — a swap, not a rewrite |
| A4 | `image-rendering: pixelated` is the correct CSS value (vs `crisp-edges`) for broadest pixel art support | Pattern 2 | `crisp-edges` is the spec; `pixelated` has wider practical support — either works in all target browsers |
| A5 | The Phase 5 static scene (no physics, no scrolling) renders once on mount and on `state.screen` changes, no rAF loop needed | Architecture Patterns | If there's a visual indicator that needs continuous animation (e.g. lava shimmer), a minimal rAF loop would be needed — defer to Phase 6 |

---

## Open Questions

1. **Norfair palette vs project cool-tone constraint**
   - What we know: CLAUDE.md says "cool tones only — nothing warm, nothing bright, nothing loud." Norfair is a lava cave with reddish-orange fire tones.
   - What's unclear: Whether very dark, desaturated reddish-browns (`#1a0c0e`, `#3d1010`) are acceptable, or whether the environment should shift to a blue/grey cave aesthetic.
   - Recommendation: Present both options in planning. The dark reddish palette is thematically correct for Norfair; the cool grey palette is safer given the project constraint. User should confirm at plan time.

2. **Samus sprite fidelity threshold**
   - What we know: Phase 5 success criterion says "Samus varia suit sprite is visible" — "visible" and "sprite" imply some level of recognizability.
   - What's unclear: Does the success criterion require a recognizable varia suit silhouette, or is any labeled humanoid shape sufficient for this phase?
   - Recommendation: Treat Phase 5 as establishing the correct structure and positioning; visual polish (closer to the actual varia suit silhouette) is acceptable as a follow-up iteration within Phase 5.

3. **`forceJump` debug flag mechanism**
   - What we know: VIS-03 requires testing the jump sprite by "toggling a flag." This implies some dev mechanism exists to force the jump state.
   - What's unclear: Should this be a prop, a `window.__samusJump = true` console flag, or a keyboard shortcut?
   - Recommendation: A simple boolean constant `DEBUG_FORCE_JUMP = false` at the top of `SamusRunGame.tsx` that can be flipped to `true` to verify the jump sprite. No prop drilling or runtime toggle needed for Phase 5.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 5 is code-only. All required APIs (Canvas 2D, ResizeObserver, devicePixelRatio) are browser built-ins available in all target browsers (iOS Safari 13.4+, Chrome, Firefox). No external tools, CLIs, services, or additional packages required. The existing Next.js dev environment is sufficient.

---

## Security Domain

`security_enforcement` not explicitly disabled in config.json. The canvas drawing phase has no security surface: no user input is processed, no network requests are made, no authentication or data storage occurs. Canvas drawing is entirely client-side visual output.

### Applicable ASVS Categories

| ASVS Category | Applies | Rationale |
|---------------|---------|-----------|
| V2 Authentication | no | No auth |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access control surface |
| V5 Input Validation | no | No user input in this phase |
| V6 Cryptography | no | No cryptography |

**Conclusion:** No ASVS controls apply to Phase 5. The canvas rendering is read-only visual output with no security boundary.

---

## Sources

### Primary (HIGH confidence)
- [web.dev/articles/canvas-hidipi](https://web.dev/articles/canvas-hidipi) — canonical DPR setup function, verified 2026-04-18
- [MDN: Window.devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) — canvas DPR scaling code example, verified 2026-04-18
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) — API reference, browser support, verified 2026-04-18
- [MDN: CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) — 2D context API reference
- Codebase: `components/samus-run/SamusRunGame.tsx`, `app/projects/samus-run/page.tsx` — existing Phase 4 integration, verified 2026-04-18
- `.planning/STATE.md` — locked v1.1 decisions (zero npm packages, SSR guard, physics in useRef)

### Secondary (MEDIUM confidence)
- [blog.jakuba.net: requestAnimationFrame and useEffect vs useLayoutEffect](https://blog.jakuba.net/request-animation-frame-and-use-effect-vs-use-layout-effect/) — useLayoutEffect vs useEffect for canvas, verified 2026-04-18
- [7tonshark.com: Scaling pixel art canvas for browser](https://7tonshark.com/posts/pixel-art-canvas-resize/) — DPR scaling and imageSmoothingEnabled, verified 2026-04-18
- [caniuse.com/resizeobserver](https://caniuse.com/resizeobserver) — ResizeObserver browser support, verified 2026-04-18
- [kirupaForum: Pixel art sprites blurry on canvas](https://forum.kirupa.com/t/why-do-my-pixel-art-sprites-blur-only-while-moving-on-canvas/680221) — `image-rendering: pixelated` and `imageSmoothingEnabled` pattern

### Tertiary (LOW confidence / ASSUMED)
- Norfair color palette — derived from Metroid game visual reference, not verified against official Metroid color data
- Samus sprite proportions — author knowledge of Metroid character design, not verified against sprite sheets
- `useEffect` vs `useLayoutEffect` recommendation — consistent with cited source but not verified against React 19 docs specifically

---

## Metadata

**Confidence breakdown:**
- Canvas DPR/sizing patterns: HIGH — verified against MDN and web.dev canonical sources
- ResizeObserver integration: HIGH — MDN verified, browser support confirmed
- React lifecycle (useEffect for canvas): MEDIUM — verified pattern, useLayoutEffect recommendation confirmed by cited blog
- Norfair palette: LOW — aesthetic judgment, needs user confirmation
- Samus primitive sprites: LOW — feasibility assumed, visual fidelity unverified until rendered

**Research date:** 2026-04-18
**Valid until:** 2026-07-18 (Canvas 2D API is stable; React 19 patterns are stable)
