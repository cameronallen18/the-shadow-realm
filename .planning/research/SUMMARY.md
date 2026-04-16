# Project Research Summary

**Project:** the shadow realm — v1.1 Flappy Bird
**Domain:** Browser canvas game integrated into an existing Next.js 15 project catalog
**Researched:** 2026-04-15
**Confidence:** HIGH

---

## Executive Summary

This milestone adds a fully playable Flappy Bird clone to an existing Next.js 15 / React 19 / Tailwind v4 project hub at `/projects/flappy-bird`. The game is a medium-complexity single-page feature (~340 lines) that slots naturally into the established pattern from the math-flashcards page: a `"use client"` page at `app/projects/flappy-bird/`, game state managed with `useState` in `page.tsx`, and all physics state in `useRef` objects inside a `GameCanvas.tsx` client component. Zero new npm dependencies are needed — Canvas 2D API, `requestAnimationFrame`, Web Audio API, and `localStorage` are all browser built-ins available in any client component.

The recommended approach is vanilla Canvas 2D, not Phaser. Phaser 3 and the newly released Phaser 4 (April 10, 2026) both weigh ~345 KB and provide scene graphs, physics engines, tilemap loaders, and WebGL pipelines — none of which Flappy Bird uses. The complete game fits in ~300 lines of TypeScript. The integration pattern is a three-file structure: `page.tsx` (state machine), `GameCanvas.tsx` (imperative loop, physics, audio), and `GameOverlay.tsx` (pure JSX screens). The only existing file that needs modification is `lib/projects.ts` (one array entry).

The primary risks are all mobile-focused and iOS-specific. Three pitfalls will silently break the game on the most likely target devices (iPhones and iPads) if not addressed up front: SSR crashes from browser APIs accessed before mount (fix: `dynamic({ ssr: false })`), blurry canvas on retina displays (fix: `devicePixelRatio` scaling in `setupCanvas()`), and iOS AudioContext suspension (fix: create AudioContext lazily inside the first user gesture handler). Touch input scroll-through on iOS Safari (fix: `touch-action: none` on the canvas element) is a fourth mobile pitfall that kills gameplay if missed. Address all four before writing any game logic — they are cheaper to prevent than to debug mid-implementation.

---

## Key Findings

### Recommended Stack

The existing stack (Next.js 15, React 19, TypeScript, Tailwind v4, Vercel) requires no additions for the Flappy Bird milestone. The game implementation layer is entirely browser built-ins. Phaser was evaluated and rejected: it adds ~345 KB gzip for a game that uses roughly 5% of its feature surface. The only conditional addition is `howler.js` for audio if raw Web Audio API mobile edge cases (iOS ringer mute switch, AudioContext interruption) prove too painful to handle manually — this is a judgment call during audio implementation.

**Core technologies:**
- Canvas 2D API (browser built-in): game rendering — `fillRect`, `arc`, `drawImage`; zero bundle cost
- `requestAnimationFrame` (browser built-in): game loop — auto-pauses in background tabs, ties to display refresh
- Web Audio API (browser built-in): sound effects — flap, score, die; programmatic or file-based
- `localStorage` (browser built-in): high score persistence — survives reload, no backend
- `dynamic({ ssr: false })` (Next.js built-in): SSR safety — required before any browser API access

**Explicitly rejected:**
- Phaser 3 / Phaser 4: ~345 KB for features the game does not use
- Any game loop library (`raf-loop`, `mainloop.js`): `requestAnimationFrame` + delta time is 10 lines
- Any physics library: gravity is one variable; collision is four comparisons
- Any asset loader: sprites drawn with Canvas 2D primitives; no image files needed to ship

### Expected Features

**Must have (table stakes) — the entire MVP list:**
- Gravity + flap impulse physics (constants: gravity `0.5`, flap velocity `-11.5`)
- Scrolling pipe pairs with randomized gap heights (pipe speed ~`6.2` px/frame at 60fps)
- AABB collision detection with 2–4px hitbox inset for forgiveness
- Three game states: `"idle"` (bird bobs, waiting for input), `"playing"` (full physics), `"dead"` (frozen, show score)
- Score counter (increments when bird x passes pipe midpoint) + `localStorage` high score (`fb-hi` key)
- Unified input: `pointerdown` (covers both touch and mouse) + `keydown` for Space/ArrowUp
- Responsive canvas: fluid constants relative to canvas dimensions, max-width ~480px on desktop
- Classic colorful aesthetic: blue sky (`#70c5ce`), green pipes (`#5fa832`), yellow bird (`#f5c518`) — all drawn with Canvas 2D primitives, no sprite files required to ship
- Three sound effects: flap, score, die
- Catalog entry in `lib/projects.ts` linking to `/projects/flappy-bird`

**Should have (differentiators — add during implementation if complexity is low):**
- Bird rotation following velocity: `angle = velocity * constant`, clamped — makes physics feel real
- Bird wing-flap 3-frame animation: cycle through 3 draw states on tap

**Defer to post-ship polish:**
- Medal tiers on game over screen (Bronze/Silver/Gold/Platinum at 10/20/30/40)
- Parallax scrolling background (0.5x pipe speed)
- Screen-shake on death (~200ms CSS translate jitter)

**Confirmed anti-features — do not build:**
- Progressive difficulty (the original had none; random gaps provide all variance)
- Pause/resume (Flappy Bird has no pause; instant restart is the intended rhythm)
- Background music (annoying on mobile, not in original)
- Settings screen, multiple bird skins, leaderboard, powerups, lives, ceiling collision

### Architecture Approach

The game follows the existing project page pattern: a dedicated route at `app/projects/flappy-bird/` with `"use client"` components. Unlike math-flashcards (single-file, pure React state), Flappy Bird splits into three files because it mixes imperative Canvas/rAF/Web Audio code with declarative overlay JSX — keeping them separate makes each file independently readable and debuggable.

**Major components:**
1. `app/projects/flappy-bird/page.tsx` — Game state machine (`idle | playing | dead`), score/highScore `useState`, layout shell, back link; imports GameCanvas via `dynamic({ ssr: false })`
2. `app/projects/flappy-bird/GameCanvas.tsx` — Canvas ref, `requestAnimationFrame` loop in `useEffect`, all physics in `useRef` objects (never `useState`), collision detection, `onScore`/`onDie` callbacks, Web Audio initialization on first gesture
3. `app/projects/flappy-bird/GameOverlay.tsx` — Start screen, game-over screen, score HUD; pure JSX, zero browser API calls, all data received as props

**Modified files (existing):**
- `lib/projects.ts`: one array entry added

No other existing files need modification. `app/layout.tsx`, `globals.css`, `next.config.ts`, and `app/page.tsx` are untouched.

**Key implementation patterns:**
- Physics world in `useRef` object — mutated every frame, never triggers React re-render
- Score/game state in `useState` — only values that need to drive overlay re-renders
- `cancelAnimationFrame` is mandatory before every new `requestAnimationFrame` call (prevents double loops on restart)
- Delta time for all physics: `const dt = Math.min((now - last) / 1000, 0.05)` — frame-rate independence across 60Hz and 120Hz devices
- `setupCanvas(canvas)` function applies `devicePixelRatio` scaling and must run on mount AND every resize

### Critical Pitfalls

Prioritized by probability of silently shipping a broken game to the primary target devices (iPhones and iPads):

1. **Missing `dynamic({ ssr: false })` — SSR crash on deploy** — Even with `"use client"`, Next.js pre-renders client components on the server. Canvas/Audio/localStorage do not exist in Node.js. Fix: wrap the game component in `dynamic(() => import(...), { ssr: false })` in `page.tsx` before writing a single line of game code. This is step zero.

2. **iOS AudioContext born suspended — silent sound on all Apple devices** — `new AudioContext()` starts `"suspended"` on iOS Safari. No error is thrown. Sound never plays. Fix: create AudioContext lazily inside the first `pointerdown`/`keydown` handler, call `.resume()` if state is `"suspended"`. The "tap to start" screen doubles as the audio unlock gesture. If iOS ringer mute becomes a problem, add `howler.js`.

3. **Blurry canvas on retina displays (all iPhones, iPads, MacBooks)** — Canvas pixel buffer defaults to 1:1 with CSS pixels. On Retina (dpr=2) or iPhone 15 Pro (dpr=3), everything is stretched and blurry. Fix: `setupCanvas()` sets `canvas.width = rect.width * dpr`, applies `ctx.scale(dpr, dpr)`, on both initial mount and every resize.

4. **Touch events scroll the page instead of controlling the game on iOS Safari** — Browsers default touch listeners to `{ passive: true }`, silently ignoring `preventDefault()`. Fix: add `style={{ touchAction: 'none' }}` to the `<canvas>` element. React's synthetic event system does not support `{ passive: false }` — use imperative `addEventListener` if direct registration is needed.

5. **Double game loop after restart — double speed, double scoring** — If `cancelAnimationFrame` is not called before starting a new loop, both loops run. Symptoms: 2x speed, score increments by 2. In React Strict Mode (development default), effects run twice, so two loops start immediately on mount without cleanup. Fix: store the rAF ID in `useRef`, cancel unconditionally before every new `requestAnimationFrame` call and in every `useEffect` cleanup.

**Additional pitfalls:**
- `canvas.width` assignment (resize) resets context and clears `ctx.scale` — `setupCanvas()` must reapply dpr scaling after every resize (C7)
- Physics must use delta time — 120Hz iPad Pro runs 2x faster than 60Hz laptop without it (C6)
- Canvas must use `100dvh` not `100vh` — iOS Safari's `100vh` includes browser chrome, causing scroll (C13)
- `useState` for physics causes 60 React reconciliations/second — performance collapses (C4)

---

## Implications for Roadmap

This is a single-milestone deliverable. The natural build order is driven by testability dependencies: establish the UI shell before any game code so the state flow is verifiable before touching the canvas loop.

### Phase 1: Foundation — Catalog Entry, Route Shell, and Overlay

**Rationale:** Visible from day one; unblocks all future steps. The catalog link appears immediately. The `ssr: false` wrapper must be wired before any other code exists.
**Delivers:** Catalog entry in `lib/projects.ts`, `page.tsx` game state machine with `dynamic({ ssr: false })` import, `GameOverlay.tsx` with start/game-over/HUD screens in JSX
**Addresses:** Catalog integration; GameOverlay props interface serves as the contract the rest of the implementation fulfills
**Avoids:** SSR crash (C1) from the start; layout shift on load (C12)

### Phase 2: Canvas Mount, Sizing, and Static Draw

**Rationale:** Establish correct canvas sizing, retina handling, and the visual aesthetic before any game logic. Debugging blurriness and sizing issues is far easier without moving physics.
**Delivers:** Canvas filling viewport at all screen sizes, `setupCanvas()` with dpr scaling, resize handler that reapplies scale, `touch-action: none`, `100dvh` height, static draw of bird/pipes/background at fixed positions
**Addresses:** Responsive canvas; classic colorful aesthetic; iPhone/iPad correctness verification
**Avoids:** Blurry canvas (C3), iOS vh overflow (C13), passive listener scroll-through (C5), resize loses context scale (C7)

### Phase 3: Physics Loop and Game State Machine

**Rationale:** Add movement and state transitions after visuals are proven correct. `useRef`-based physics world and delta time are the core architectural decisions.
**Delivers:** Working `requestAnimationFrame` loop with delta time, gravity + flap impulse, pipe generation and scrolling with pipe recycling, three game states with transitions, unified `pointerdown`/`keydown` input
**Addresses:** Core mechanics — bird physics, pipe obstacles, game states, input model
**Avoids:** useState-for-physics performance collapse (C4), stale closures (C4), double loop on restart (C8), device-dependent physics speed (C6)

### Phase 4: Collision, Scoring, and High Score

**Rationale:** Collision depends on a working physics loop; scoring depends on collision; high score depends on scoring. Clean sequential dependency chain.
**Delivers:** AABB collision with 2–4px hitbox inset, game-over trigger on pipe/ground hit, score counter, `localStorage` high score persistence with `fb-hi` key
**Addresses:** Collision, scoring, and persistence requirements
**Avoids:** localStorage accessed correctly inside `useEffect` only (C9) — moot because `ssr: false` is already in place, but correct practice regardless

### Phase 5: Audio and Polish

**Rationale:** Audio is the most device-sensitive and most deferrable feature. The game is shippable without it. Doing it last means iOS audio complexity cannot block the milestone.
**Delivers:** Three sound effects (flap, score, die) via Web Audio API or howler.js, lazy AudioContext initialization inside first user gesture, bird velocity rotation and wing animation if complexity is low
**Addresses:** Sound effects requirement; differentiator features
**Avoids:** iOS AudioContext silence (C2), AudioContext interrupted on tab background (C11)

### Phase Ordering Rationale

- `ssr: false` wrapper must exist before any browser API code — it is step zero, enforced by Phase 1
- Visual correctness (dpr scaling, touch-action, dvh) must be verified on a real device before physics are added — visual bugs and physics bugs cannot be separated otherwise
- `useRef` for physics state is an architectural commitment that must be made before the loop is written, not refactored in after performance degrades
- Audio is genuinely independent of all other phases and the most likely to require iteration on real iOS hardware — deferring it protects the ship date

### Research Flags

**Standard patterns — skip additional research:**
- Phase 1 (catalog/overlay): established pattern from math-flashcards page
- Phase 3 (physics loop): `useRef` + rAF + delta time is well-documented
- Phase 4 (collision/scoring): AABB math and localStorage are trivial

**Requires attention during implementation, not research:**
- Phase 2 (canvas sizing): `devicePixelRatio` + resize interaction is tricky — follow `setupCanvas()` pattern from PITFALLS.md C3/C7 exactly
- Phase 5 (audio): iOS AudioContext requires testing on a real device. If raw Web Audio API is painful, decision point: add `howler.js`. That decision does not require replanning.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions grounded in official docs. Phaser rejection confirmed against official bundle size data. Zero new npm dependencies — no version risk. |
| Features | HIGH | Mechanics model verified against multiple implementations and Wikipedia. Numeric constants cross-verified across community sources. |
| Architecture | HIGH | Derived from observed codebase, not speculation. File structure follows established math-flashcards pattern. Component boundaries match React + Canvas best practices from MDN and React docs. |
| Pitfalls | HIGH | All five critical pitfalls verified against official sources (MDN, WebKit bug tracker, Chrome developer docs). iOS-specific behavior confirmed against WebKit specifications. |

**Overall confidence: HIGH**

### Gaps to Address

- **Sound file sourcing**: ARCHITECTURE.md recommends real `.mp3` files at `public/sounds/`; STACK.md suggests synthesized Web Audio tones as an alternative. Either works — decide at the start of Phase 5. The original game's sound files are freely available as WAV/OGG online.

- **howler.js vs raw Web Audio API**: Research recommends howler.js for iOS reliability but vanilla Web Audio for zero-dependency simplicity. Make this call at the start of Phase 5 based on how much iOS complexity is acceptable. Not a planning gap — a Phase 5 entry decision.

- **Canvas drawing detail level**: MVP specifies primitive shapes. Whether to draw a more detailed bird (eye, beak, wing) versus a simple yellow circle is an aesthetic call with no research dependency — decide during Phase 2.

---

## Sources

### Primary (HIGH confidence)
- Next.js 15 official docs — App Router, `use client`, `next/dynamic`, static generation
- MDN: Canvas API, Web Audio API, devicePixelRatio, autoplay policy
- WebKit Bug Tracker — AudioContext suspended state on iOS, ringer mute behavior
- Chrome Developers — Web Audio autoplay policy
- React docs — `useRef` for mutable values, effect cleanup patterns
- Phaser.io — Phaser v4.0.0 release (April 10, 2026), official Next.js template (uses Pages Router)
- Tailwind CSS v4 release notes — CSS-first config format

### Secondary (MEDIUM confidence)
- bundlephobia — Phaser bundle size (~345 KB gzip)
- Community Flappy Bird canvas implementations — numeric constants verification
- Martin Drapeau on fluid canvas sizing — approach rationale
- CSS-Tricks — requestAnimationFrame with React hooks

### Tertiary (LOW confidence)
- DEV Community Flappy Bird tutorial (Dec 2024) — implementation reference; constants verified against other sources

---

*Research completed: 2026-04-15*
*Ready for roadmap: yes*
