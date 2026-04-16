# Domain Pitfalls

**Domain:** Next.js static site / personal hub on Vercel — Canvas game milestone (Flappy Bird)
**Researched:** 2026-04-15 (canvas game section); 2026-04-12 (site infrastructure section)
**Confidence:** HIGH (canvas pitfalls cross-verified against MDN, WebKit bug tracker, official specs, and community post-mortems)

---

## PART A — Canvas Game in Next.js App Router (v1.1 Flappy Bird)

Pitfalls specific to adding a browser Canvas game with mobile-first touch input, Web Audio, and responsive sizing to an existing Next.js 15 / React 19 / TypeScript project.

---

## Critical Pitfalls

---

### Pitfall C1: SSR Crashes — Canvas, Web Audio, and localStorage Don't Exist on the Server

**What goes wrong:** Importing a component that references `window`, `document`, `HTMLCanvasElement`, `AudioContext`, or `localStorage` at the module level will crash the Next.js server-side render with `ReferenceError: window is not defined`. This happens even with `"use client"` — the directive marks a component as a Client Component boundary, but Next.js still pre-renders Client Components on the server for the initial HTML shell.

**Why it happens:** Next.js App Router runs all components through Node.js first. Node.js has no DOM, no Canvas API, no Web Audio API, and no localStorage. The `"use client"` directive only tells React where to hydrate; it does not skip server execution.

**Consequences:** Vercel build succeeds locally but crashes in production, or crashes during `next build` locally. The error appears in build logs, not at runtime. The entire page fails to render, not just the game.

**Prevention — the only reliable pattern for a canvas game component:**

```tsx
// app/projects/flappy-bird/page.tsx (Server Component — fine)
import dynamic from 'next/dynamic'

const FlappyBirdGame = dynamic(
  () => import('@/components/FlappyBirdGame'),
  { ssr: false, loading: () => <div className="game-loading">Loading...</div> }
)

export default function FlappyBirdPage() {
  return <FlappyBirdGame />
}
```

The `ssr: false` flag tells Next.js to skip the component entirely during server render and only mount it in the browser after hydration. This is the canonical pattern for any component that uses browser-only APIs.

Inside `FlappyBirdGame.tsx`, all canvas/audio/localStorage access must still be inside `useEffect` or event handlers — never at module scope or in the component body outside of effects.

**Detection:** Build fails with `ReferenceError: window is not defined` or `ReferenceError: document is not defined`. Also appears as a runtime error in the browser console if the component is rendered server-side without `ssr: false`.

---

### Pitfall C2: iOS Safari AudioContext Is Born Suspended — Silence Until User Gesture

**What goes wrong:** On iOS Safari (and Chrome on Android), `new AudioContext()` starts in a `"suspended"` state. Any sounds played before a user gesture — even if queued in a promise, a timeout, or a useEffect — produce complete silence. There is no error. The game appears to work; sound simply never plays.

**Why it happens:** Apple (WebKit) and Google mandated that audio cannot autoplay without explicit user interaction. This is enforced at the OS level on iOS. `AudioContext.state` starts as `"suspended"` and only transitions to `"running"` after `audioContext.resume()` is called from within a user-initiated event handler (click, touchstart, keydown, etc.).

**Consequences:** Sound effects never play on any iOS device. The failure is silent — no console error, no exception. Developers testing on desktop Chrome miss this entirely.

**Additional iOS complication — hardware ringer mute switch:** On iOS, Web Audio is additionally silenced when the hardware ringer switch is set to mute (unlike `<audio>` HTML elements, which respect the mute switch differently). A workaround exists: play a short, silent `<audio>` tag alongside the AudioContext to shift the audio routing from the ringer channel to the media channel.

**Prevention:**

1. Create the `AudioContext` lazily — only on first user gesture, not at component mount:

```ts
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}
```

2. Hook the unlock into the first tap/click event that starts the game (the "tap to start" screen doubles as the audio unlock gesture):

```ts
function handleFirstTap() {
  getAudioContext() // unlocks audio
  startGame()
}
```

3. Use `howler.js` instead of raw Web Audio API. Howler abstracts the unlock pattern, handles iOS resume, falls back to HTML5 Audio on unsupported browsers, and handles the ringer mute workaround via a silent buffer trick. This is the recommended approach for a game with sound effects.

```bash
npm install howler
npm install -D @types/howler
```

**Detection:** Sound works on desktop Chrome/Firefox but not on any iPhone or iPad. `audioCtx.state` logs as `"suspended"` before the first tap. Add `console.log(audioCtx.state)` on game start to diagnose.

---

### Pitfall C3: Blurry Canvas on Retina / HiDPI Displays (iPad, iPhone, MacBook)

**What goes wrong:** A canvas element has two separate size concepts: the CSS display size (what the browser lays out) and the pixel buffer size (what the canvas renders into). By default, a canvas created at 800×600 has an 800×600 pixel buffer. On a Retina display (devicePixelRatio = 2), the browser stretches that 800×600 buffer to fill 1600×1200 physical pixels. The result is visibly blurry — like a low-resolution image scaled up.

iPhone 15 Pro has a devicePixelRatio of 3. iPad Pro has 2. These are the primary targets for this game.

**Why it happens:** The canvas API creates a raster buffer at the exact width/height you assign to `canvas.width` and `canvas.height`. CSS size and pixel buffer size are independent. Developers who set only the CSS size (via Tailwind classes or inline styles) get a 1:1 buffer stretched across more physical pixels.

**Consequences:** Game looks muddy and unprofessional on every Apple device — exactly the devices most likely to play this game. The bird, pipes, and text all appear blurry.

**Prevention — required pattern for every canvas initialization:**

```ts
function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  // Pixel buffer = CSS size × device pixel ratio
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  // CSS size stays the same (already set via Tailwind/CSS)
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`

  const ctx = canvas.getContext('2d')!
  // Scale all drawing operations to match the buffer
  ctx.scale(dpr, dpr)
  return ctx
}
```

After this setup, all drawing coordinates are in CSS pixels (as if dpr = 1). The scaling handles the physical pixel mapping transparently.

This function must be called on initial mount AND on every resize/orientation change event.

**Detection:** Game looks sharp on desktop but blurry on any iPhone or iPad. Take a screenshot on device and zoom in — if edges are aliased/fuzzy, dpr scaling is missing.

---

### Pitfall C4: React useEffect + requestAnimationFrame = Memory Leaks and Stale Closures

**What goes wrong:** A game loop using `requestAnimationFrame` inside `useEffect` is one of the most reliably broken patterns in React when implemented naively. Two distinct failure modes:

**Mode A — Memory leak / zombie loop:** If the `useEffect` cleanup function does not cancel the animation frame, the loop continues running after the component unmounts. In React Strict Mode (the default in development), effects run twice intentionally — so without cleanup, two game loops run simultaneously during development. After navigating away from the game page, the loop keeps consuming CPU/battery.

**Mode B — Stale closure:** The game loop callback captures state variables (score, isGameOver, bird velocity, etc.) from the closure at the time the effect ran. When React re-renders the component (e.g., score updates), the game loop still sees the old captured values. Score never increments, game-over never triggers, or the game loop reads a different state than React's.

**Why it happens:** `requestAnimationFrame` callbacks are plain JavaScript closures. `useEffect` captures the scope at the time it runs. React's rendering model creates new scope on every re-render, but the game loop callback is not recreated.

**Consequences:** CPU/battery drain after navigating away. Two game loops fighting each other in development. Score freezes at 0. Game never ends. Pipe physics diverge from React state.

**Prevention:**

The game loop must own all mutable game state via `useRef`, not `useState`. `useRef` values are stable across renders — no stale closure possible. Only values that need to trigger a React re-render (score display, game phase) should live in `useState`.

```tsx
// Correct pattern
const gameStateRef = useRef<GameState>(initialState)
const animationFrameRef = useRef<number>(0)

useEffect(() => {
  let running = true

  function gameLoop(timestamp: number) {
    if (!running) return
    // Read/write game state via gameStateRef.current — never stale
    update(gameStateRef.current, timestamp)
    draw(canvasRef.current, gameStateRef.current)
    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }

  animationFrameRef.current = requestAnimationFrame(gameLoop)

  return () => {
    running = false
    cancelAnimationFrame(animationFrameRef.current)
  }
}, []) // Empty deps — loop starts once, cleanup cancels it
```

Score increments and game-over state are written to `gameStateRef.current` by the game loop, then synced to React state for rendering the HUD:

```ts
// Inside game loop, when score changes:
gameStateRef.current.score = newScore
setScore(newScore) // triggers HUD re-render
```

**Detection:** In development (Strict Mode), look for the game running at double speed — this is two loops. After navigating away, check browser DevTools Performance tab — if the loop still fires, cleanup is broken.

---

### Pitfall C5: Touch Events on iOS Safari — Passive Listener Defaults Block preventDefault

**What goes wrong:** Chrome (since v56, 2017) and Safari default `touchstart` and `touchmove` event listeners to `{ passive: true }` on document-level targets. When passive is true, calling `event.preventDefault()` is silently ignored. For a Flappy Bird game, this means:

- The page scrolls during gameplay instead of passing touches to the game
- Pull-to-refresh fires on the first tap on Android Chrome
- Scroll momentum carries through the canvas
- `preventDefault()` calls in the event handler produce a console warning but have no effect

**Why it happens:** Browsers added passive listener defaults to guarantee smooth scrolling performance. Passive means "I promise not to call preventDefault." If a listener is passive, the browser scrolls immediately without waiting for JavaScript to complete.

**Consequences:** On mobile, the page bounces and scrolls during gameplay. The game receives the touch events but cannot suppress the browser's scroll behavior.

**Prevention — two complementary approaches:**

**Approach 1 (CSS — preferred, most performant):** Set `touch-action: none` on the canvas element. This tells the browser via CSS to hand all touch events to JavaScript without any default handling. No JavaScript change needed.

```tsx
<canvas
  ref={canvasRef}
  style={{ touchAction: 'none' }}
  className="w-full h-full"
/>
```

**Approach 2 (JS — required for global scroll suppression):** Register touch listeners with `{ passive: false }` explicitly, then call `preventDefault()`:

```ts
canvas.addEventListener('touchstart', handleTouch, { passive: false })
canvas.addEventListener('touchmove', handleTouch, { passive: false })
```

Note: React's synthetic event system (`onTouchStart={...}`) does NOT support `{ passive: false }`. You must use imperative `addEventListener` calls for this to work. This is a React limitation, not a browser limitation.

**Also:** Add a full-screen no-scroll style to the game page's `<body>` to prevent the URL bar from hiding/showing during gameplay on iOS Safari:

```css
body { overflow: hidden; position: fixed; width: 100%; }
```

**Detection:** On an actual iOS Safari or Android Chrome device, touching the canvas scrolls the page instead of triggering the game. Console shows: `Unable to preventDefault inside passive event listener invocation`.

---

## Moderate Pitfalls

---

### Pitfall C6: Game Loop Physics Speed Is Device-Dependent Without Delta Time

**What goes wrong:** A game loop that moves game objects by a fixed number of pixels per frame runs at different speeds on different devices. On a 60fps device, it runs at intended speed. On a 120Hz display (iPad Pro, iPhone 13+), it runs twice as fast. On a slow phone that drops to 30fps, it runs at half speed. Pipes arrive impossibly fast on iPad Pro and impossibly slow on a budget Android.

**Why it happens:** `requestAnimationFrame` calls the callback as fast as the display can refresh. Tying physics updates to frame count couples game speed to display refresh rate.

**Consequences:** Game is unplayable on high-refresh-rate displays. Difficulty varies wildly by device. This is a correctness bug, not a performance bug.

**Prevention:** Use delta time for all physics updates. Calculate the time elapsed since the last frame and scale all position changes by that value:

```ts
let lastTimestamp = 0

function gameLoop(timestamp: number) {
  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.05) // seconds, capped at 50ms
  lastTimestamp = timestamp

  bird.velocity += GRAVITY * delta
  bird.y += bird.velocity * delta
  pipes.forEach(pipe => pipe.x -= PIPE_SPEED * delta)

  requestAnimationFrame(gameLoop)
}
```

The cap at 50ms prevents the physics from exploding if the tab is backgrounded and then foregrounded (a single giant delta that would fling everything off-screen).

**Detection:** Test on an iPhone with ProMotion (120Hz). If the game runs twice as fast as on a laptop, delta time is missing.

---

### Pitfall C7: Canvas Resize Clears the Buffer and Loses the Context Scale

**What goes wrong:** Setting `canvas.width` or `canvas.height` — even to the same value — resets the canvas to a blank state and clears all context transformations, including the `ctx.scale(dpr, dpr)` applied during setup. If a resize handler re-applies the CSS size but forgets to re-apply the dpr scale, the canvas becomes blurry again after a resize or orientation change.

**Why it happens:** This is specified behavior: assigning to `canvas.width` or `canvas.height` resets the rendering context. It is not intuitive.

**Consequences:** After rotating an iPad, the canvas is correctly sized but blurry. After a browser resize on desktop, drawing coordinates shift and sprites appear at wrong positions.

**Prevention:** The resize handler must call the full `setupCanvas()` function (which re-applies dpr scaling), not just update dimensions. Debounce the resize event to avoid calling it on every pixel during a drag resize:

```ts
useEffect(() => {
  let resizeTimer: ReturnType<typeof setTimeout>

  function handleResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (canvasRef.current) {
        setupCanvas(canvasRef.current) // re-applies dpr scale
        // also update game world dimensions to match new canvas size
        updateGameDimensions(canvasRef.current)
      }
    }, 100)
  }

  window.addEventListener('resize', handleResize)
  return () => {
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimer)
  }
}, [])
```

**Detection:** On desktop, resize the browser window — if sprites jump position or become blurry, the context scale was not re-applied. On iPad, rotate device — same test.

---

### Pitfall C8: Game Over / Restart Creates Double Game Loops

**What goes wrong:** When the player dies and the game restarts, a new game loop is started. If the old loop was not properly cancelled before starting the new one, two loops run simultaneously. Both are updating physics, drawing frames, and incrementing score. The game appears to flicker, move at double speed, or score jumps by 2 per pipe.

**Why it happens:** Restart logic typically sets some state to "initial" and calls a `startGame()` function. If `startGame()` unconditionally calls `requestAnimationFrame`, and the previous loop's cancel logic relied on a stale closure that captured the old `animationFrameRef`, the cancel never fires.

**Consequences:** Double-speed gameplay. Double scoring. Flickering render. Worsens on every restart (triple-speed after 2 restarts, etc.).

**Prevention:** Keep exactly one `animationFrameRef`. Always cancel the current frame before starting a new loop:

```ts
function restartGame() {
  // Cancel any running loop first
  cancelAnimationFrame(animationFrameRef.current)

  // Reset game state via ref (not state — avoids stale closure)
  gameStateRef.current = createInitialGameState()

  // Start a fresh loop
  animationFrameRef.current = requestAnimationFrame(gameLoop)
}
```

Treat `cancelAnimationFrame` as mandatory before any new `requestAnimationFrame` call, not as optional cleanup.

**Detection:** After dying and restarting, the game runs noticeably faster. Score increments by 2. DevTools Performance tab shows two animation frame callbacks firing.

---

### Pitfall C9: localStorage Access During SSR or Before Mount

**What goes wrong:** Calling `localStorage.getItem('highScore')` at the top level of a component, in a `useState` initializer, or in any code that runs during SSR throws `ReferenceError: localStorage is not defined`. Even with `"use client"`, the initial render passes through the server.

**Why it happens:** Same root cause as Pitfall C1 — server has no DOM APIs.

**Consequences:** Build error or runtime error. High score never loads. In the best case, the default value is always shown.

**Prevention:** Read localStorage only inside `useEffect` (which only runs in the browser after mount):

```ts
const [highScore, setHighScore] = useState(0)

useEffect(() => {
  const stored = localStorage.getItem('highScore')
  if (stored) setHighScore(parseInt(stored, 10))
}, [])

function saveHighScore(score: number) {
  if (score > highScore) {
    setHighScore(score)
    localStorage.setItem('highScore', String(score))
  }
}
```

The initial render shows 0 (server-safe). After hydration, `useEffect` reads the real value. No hydration mismatch because the canvas game component is loaded via `dynamic({ ssr: false })` — it never renders on the server at all.

**Detection:** `ReferenceError: localStorage is not defined` in build output or server logs.

---

### Pitfall C10: Mobile Performance — What Kills 60fps on Canvas

**What goes wrong:** A game that runs at 60fps on a MacBook drops to 20-30fps on a mid-range Android phone, making it unplayable.

**Known frame-rate killers, in rough order of impact:**

1. **Shadow rendering on every frame.** `ctx.shadowBlur` and `ctx.shadowColor` are extremely expensive. A single shadowed draw call on mobile can consume an entire frame budget. Never use canvas shadows in a game loop.

2. **Frequent garbage collection from object allocation.** Creating new objects every frame (`{ x, y }`, new arrays, new closures) triggers GC pauses. Pre-allocate and reuse objects.

3. **Excessive canvas state saves/restores.** `ctx.save()` and `ctx.restore()` are not free. Minimize them — set state properties directly and restore them manually when done.

4. **Clearing and redrawing the entire canvas unnecessarily.** For a side-scroller where the background is a static color, `clearRect` is correct. But if a large image background is redrawn every frame at full resolution on a 3x HiDPI canvas, cost scales as O(width × height × dpr²).

5. **Text rendering every frame.** `ctx.fillText()` is slow. For a score counter that updates once per pipe, render the score to an off-screen canvas once and `drawImage` that cache to the main canvas each frame. Only invalidate the cache when the score changes.

6. **Too many draw calls from un-batched sprites.** Canvas has no GPU batching. Each `drawImage` call is a separate CPU operation.

**Prevention for Flappy Bird specifically:**

- Background: `ctx.fillRect` with a flat color — single draw call, free.
- Pipes: Draw two rectangles per pipe. No images needed unless art demands it.
- Bird: A single `drawImage` call per frame (or a simple circle/rectangle for MVP).
- Score: Cached off-screen canvas, updated only on score change.
- No shadows, no gradients in the main loop.
- No `ctx.save/restore` inside the per-frame draw unless absolutely necessary.

**Detection:** Chrome DevTools Performance tab → record 5 seconds of gameplay → inspect frame time. Anything over 16ms is a frame drop. Identify which `ctx.*` calls consume the most time in the flame chart.

---

## Minor Pitfalls

---

### Pitfall C11: AudioContext Interrupted When iOS Tab Is Backgrounded

**What goes wrong:** When a player switches tabs, locks their phone, or receives a call while playing, iOS Safari sets `audioContext.state` to `"interrupted"`. When they return to the game, audio is permanently silent — `state` stays `"interrupted"` and calling `.resume()` is required but developers often only call it once at game start.

**Prevention:** Listen for the `statechange` event on the AudioContext and the `visibilitychange` event on `document`. Resume whenever either signals a return:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audioCtx?.state !== 'running') {
    audioCtx?.resume()
  }
})
```

If using howler.js, this is handled automatically.

---

### Pitfall C12: next/dynamic Loading State Creates Layout Shift

**What goes wrong:** The `loading` fallback in `dynamic({ loading: () => <div>Loading...</div> })` renders at 0 height unless explicitly sized. When the real game canvas mounts and fills the screen, there is a layout shift (CLS). On a slow connection, this also looks broken.

**Prevention:** Match the loading placeholder to the same dimensions as the game canvas:

```tsx
const FlappyBirdGame = dynamic(
  () => import('@/components/FlappyBirdGame'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <span className="text-gray-400 text-sm">loading...</span>
      </div>
    )
  }
)
```

---

### Pitfall C13: iOS Safari 100vh Problem — Game Canvas Doesn't Fill Screen

**What goes wrong:** On iOS Safari, `100vh` includes the browser chrome (URL bar + tab bar). A canvas sized to `100vh` is taller than the visible viewport, causing scroll. When the URL bar auto-hides during scroll, the canvas resizes, triggering an orientation-change-like event.

**Prevention:** Use `100dvh` (dynamic viewport height) instead of `100vh`. This is supported in Safari 15.4+ (iOS 15.4+, April 2022) and reflects the actual visible viewport height:

```tsx
<canvas style={{ width: '100vw', height: '100dvh' }} />
```

Or use CSS variables for broader compatibility:

```css
.game-canvas {
  height: 100vh;          /* fallback */
  height: 100dvh;         /* modern browsers */
}
```

**Detection:** On an iPhone, the canvas extends behind the bottom navigation bar, or the page scrolls slightly even with `overflow: hidden` on `body`.

---

### Pitfall C14: Phaser.js Bundle Size Is 1MB — Unnecessary for Vanilla Canvas

**What goes wrong:** Choosing Phaser.js for a Flappy Bird clone adds approximately 1MB of JavaScript to the bundle. Phaser is a full-featured game framework with physics engines, scene management, tweens, tilemaps, and WebGL rendering. Flappy Bird needs: a game loop, a canvas context, collision detection between two rectangles, and gravity. All of this is 150 lines of vanilla code.

**Why it's a pitfall:** Phaser also requires non-trivial SSR workarounds (dynamic import with `ssr: false` is mandatory, it references `window`/`document` in hundreds of places), and its configuration surface is much larger than needed. If Phaser's `auto` renderer picks WebGL, canvas fallback behavior must be verified on all target devices.

**Prevention:** For Flappy Bird specifically, use vanilla Canvas API. No framework needed. The game is 5 sprites (bird, 2 pipes, background, ground), one physics calculation (gravity), and one collision check (rect-to-rect). Phaser would add weeks of framework learning and a 1MB bundle for zero gameplay benefit.

**When Phaser IS appropriate:** If the roadmap expands to a game with tilemaps, a physics world, multiple scene transitions, or asset loading pipelines — then Phaser's investment pays off.

---

## Phase-Specific Warnings (Canvas Game Milestone)

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Initial setup | SSR crash from canvas/audio at module level | Use `dynamic({ ssr: false })` for the game component before writing a single line of game code |
| Audio implementation | iOS silence, ringer mute, suspended AudioContext | Use howler.js from the start; do NOT attempt raw Web Audio API first |
| Canvas initialization | Blurry on retina | Apply dpr scaling in `setupCanvas()` before any drawing code |
| Touch input | Passive listener scroll-through on iOS | Set `touch-action: none` on canvas CSS before testing on device |
| Game loop | Double loop on restart, stale closures | Keep all mutable game state in `useRef`; always cancel before starting new loop |
| High score | localStorage SSR crash | Read inside `useEffect` only — but moot if game component uses `ssr: false` |
| Performance | Frame drops on mid-tier Android | No shadows, no per-frame text rendering, test on real device early |
| Canvas sizing | 100vh overflow on iOS Safari | Use `100dvh` from the start |
| Resize/orientation | Context scale lost after resize | `setupCanvas()` must run on every resize, not just mount |
| Game over state | Double loop after restart | Mandatory `cancelAnimationFrame` before every new loop start |

---

## PART B — Site Infrastructure (Existing Pitfalls, Unchanged)

*(From v1.0 research, 2026-04-12)*

---

## Critical Pitfalls

---

### Pitfall 1: Using `next export` (the CLI command) Instead of `output: 'export'` in next.config

**What goes wrong:** In Next.js 13+ App Router, the old `next export` command was deprecated and removed. Running it produces an error. Projects that copy old tutorials will wire up the wrong command in their build script or CI.

**Why it happens:** Most tutorials and Stack Overflow answers written before 2023 reference `next export` as the way to produce a static build. The App Router replaced this with a config flag.

**Consequences:** Build fails. Vercel deploy fails. Confusion when the error message doesn't clearly explain the migration path.

**Prevention:** Set `output: 'export'` in `next.config.js` (or `next.config.ts`) and use `next build` as the only build command. Never add `next export` to any script.

**Detection:** Build log contains `Error: 'next export' is no longer supported...` or similar. Vercel build step exits with a non-zero code immediately.

---

### Pitfall 2: `next/image` Breaks With `output: 'export'`

**What goes wrong:** The default `next/image` component relies on a server-side image optimization endpoint. With `output: 'export'`, there is no server, so this endpoint does not exist.

**Prevention:** Add `images: { unoptimized: true }` to `next.config.js` for a static export, or use plain `<img>` tags.

**Detection:** Build output contains `Error: Image Optimization using the default loader is not compatible with next export`.

---

### Pitfall 3: Public-Folder HTML File Name Collides With a Next.js Route

**What goes wrong:** Next.js enforces that no file in `/public` can share a name with a page route.

**Prevention:** Put standalone HTML projects in a named subdirectory (e.g., `/public/games/`) that has no corresponding Next.js route.

**Detection:** Build fails with `conflicting-public-file-page` error.

---

### Pitfall 4: Tailwind CSS v4 Config Format Is Completely Different From v3

**What goes wrong:** Tailwind v4 replaced `tailwind.config.js` with a CSS-first `@import "tailwindcss"` and `@theme` configuration. Mixing v3 and v4 patterns silently breaks styles.

**Prevention:** Verify installed version with `npm ls tailwindcss`. Use the correct config format for that version exclusively.

**Detection:** No Tailwind classes apply in dev or prod. PostCSS plugin resolution error at build time.

---

### Pitfall 5: Tailwind CSS Purges All Classes Because `content` Paths Are Too Narrow (v3)

**What goes wrong:** If the `content` array in `tailwind.config.js` does not include all files containing class names, those classes are purged in production.

**Prevention:** Include `./app/**/*.{js,ts,jsx,tsx,mdx}` and `./components/**/*.{js,ts,jsx,tsx,mdx}` in the content array. Never construct class names dynamically via template literals.

**Detection:** Production site renders unstyled. Dev server renders correctly.

---

## Moderate Pitfalls

---

### Pitfall 6: Dark Mode Hydration Mismatch

**What goes wrong:** If dark mode class is determined client-side, SSG renders without it, causing a flash on hydration.

**Prevention:** Since this site is permanently dark, apply `className="dark"` directly on `<html>` in `layout.tsx` as a static attribute.

---

### Pitfall 7: Vercel Ignores `output: 'export'` and Runs Node.js Build Anyway

**What goes wrong:** Vercel's native Next.js adapter may not use the static `out/` directory from `output: 'export'`.

**Prevention:** For Vercel deployment, skip `output: 'export'` entirely. Vercel natively serves SSG pages as static without it.

---

### Pitfall 8: DNS Setup — CNAME on Apex Domain

**What goes wrong:** CNAME on apex domain fails at most registrars. Full domain in the Name field creates `www.example.com.example.com`.

**Prevention:** A record for apex domain (`76.76.21.21`). CNAME for www (`cname.vercel-dns.com`). Name field = label only, not full domain.

---

### Pitfall 9: `trailingSlash` + Custom 404 = Broken 404 in Static Export

**What goes wrong:** `trailingSlash: true` produces `404/index.html` instead of `404.html` in static export. Static hosts look for `404.html`.

**Prevention:** Do not combine `trailingSlash: true` with `output: 'export'` without a post-build copy script. For Vercel-hosted projects, this is not an issue.

---

## Minor Pitfalls

---

### Pitfall 10: `next/font` Not Working After Vercel Deploy

**What goes wrong:** Font defined outside a Server Component, or variable not applied to `<html>`, causes fallback font in production.

**Prevention:** Define font once in `app/layout.tsx` (Server Component). Apply via `className` on `<html>`.

---

### Pitfall 11: Standalone HTML File in `/public` Does Not Inherit Site Styles

**What goes wrong:** Files in `/public` are raw static assets. They have no access to Tailwind, global CSS, or React context.

**Prevention:** Accept isolation as intended. Style standalone files independently using inline styles or a separate CSS file in the same directory.

---

### Pitfall 12: Vercel Hobby Plan Concurrent Build Lock

**What goes wrong:** Free tier allows one concurrent build. Rapid successive pushes may queue or cancel builds.

**Prevention:** No action needed for a personal site. Awareness is sufficient.

---

## Sources

### Canvas Game Pitfalls
- [MDN: Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — HIGH confidence
- [MDN: BaseAudioContext.state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state) — HIGH confidence
- [WebKit Bug: AudioContext suspended state on iOS](https://github.com/WebAudio/web-audio-api/issues/790) — HIGH confidence
- [WebKit Bug: Web Audio muted when iOS ringer is muted](https://bugs.webkit.org/show_bug.cgi?id=237322) — HIGH confidence
- [howler.js GitHub](https://github.com/goldfire/howler.js) — HIGH confidence
- [unmute-ios-audio (feross)](https://github.com/feross/unmute-ios-audio) — MEDIUM confidence
- [MDN: Window.devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) — HIGH confidence
- [web.dev: High DPI Canvas](https://web.dev/articles/canvas-hidipi) — HIGH confidence
- [Next.js Lazy Loading / dynamic import docs](https://nextjs.org/docs/pages/guides/lazy-loading) — HIGH confidence
- [requestAnimationFrame and useEffect vs useLayoutEffect (jakuba.net)](https://blog.jakuba.net/request-animation-frame-and-use-effect-vs-use-layout-effect/) — MEDIUM confidence
- [Passive event listener fix — uriports.com](https://www.uriports.com/blog/easy-fix-for-unable-to-preventdefault-inside-passive-event-listener-due-to-target-being-treated-as-passive/) — MEDIUM confidence
- [Debugging Touch Controls — Passive Listener Trap (2026)](https://vcfvct.wordpress.com/2026/01/25/debugging-touch-controls-in-vanilla-js-the-passive-listener-trap/) — HIGH confidence (recent, matches spec)
- [Canvas performance optimization for cross-device rendering (bswen.com, Feb 2026)](https://docs.bswen.com/blog/2026-02-21-canvas-performance-optimization/) — MEDIUM confidence
- [Stale closures in React hooks — dmitripavlutin.com](https://dmitripavlutin.com/react-hooks-stale-closures/) — HIGH confidence
- [GitHub Issue: Next.js dynamic + App Router flicker](https://github.com/vercel/next.js/issues/64060) — MEDIUM confidence

### Site Infrastructure Pitfalls
- [Next.js Static Exports — Official Docs](https://nextjs.org/docs/app/guides/static-exports)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Vercel Domains — Troubleshooting](https://vercel.com/docs/domains/troubleshooting)
- [next-themes GitHub](https://github.com/pacocoursey/next-themes)
