# Feature Landscape: Flappy Bird Clone

**Domain:** Browser-based arcade game (side-scrolling infinite runner)
**Researched:** 2026-04-15
**Milestone:** v1.1 — adding Flappy Bird to an existing Next.js project catalog

---

## How the Game Works (Mechanics Reference)

Verified mechanics model. This section is the implementation ground truth.

### Bird Physics

- Gravity pulls the bird down continuously every frame. Standard constant: `0.5` velocity units per frame.
- A flap sets vertical velocity to a fixed negative value (upward impulse). Standard value: `-11.5`. This is an immediate velocity set, not an additive push.
- The bird falls with increasing speed between flaps and never hovers. This is the core tension.
- Bird rotates visually to follow velocity — nose up when ascending, nose down when falling. Cosmetic but critical to feeling authentic.

### Pipe Generation

- Pipes scroll leftward at a fixed speed. Reference constant: `6.2` px/frame on a ~430px-wide canvas at 60fps. This scales proportionally if using a fluid canvas approach.
- Pipes are spawned off-screen right at a fixed interval (~90–120 frames / 1.5–2 seconds).
- Gap height is fixed for all pipe pairs (not variable). Reference gap: `~150–270px`. The gap's vertical center is randomized each spawn.
- Only one pipe pair is in the danger zone at any moment.

### Collision Detection

- Axis-aligned bounding box (AABB) is sufficient — no rotation math needed.
- Three collision zones: top pipe, bottom pipe, ground. Ceiling collision is optional; the original blocked the ceiling.
- Inset the pipe hitbox by 2–4px from the visual edge. This is conventional forgiveness that makes the game feel fair.

### Scoring

- Score increments by 1 each time the bird's x-position passes the horizontal midpoint of a pipe pair.
- The original game had no progressive difficulty. Speed and gap are constant from score 0 to score 999. All difficulty comes from the physics model and random gap positions.

### Game States

Three states, not two:

1. **Idle** — Game loaded, waiting for first input. Bird bobs vertically (gentle sine wave), pipes not moving or not yet spawned. Tap/click/Space transitions to Playing.
2. **Playing** — Physics active, pipes scrolling, score counting.
3. **Game Over** — Bird hit something. Physics frozen. Score displayed with high score. Tap/click/Space restarts — returning to Idle is more polished than jumping straight back to Playing.

### Input Model

The original was single-tap-to-flap. The unified browser input model:

- `touchstart` on mobile — use `touchstart`, not `touchend`. `touchend` latency is perceptible at game speed.
- `mousedown` on desktop — more responsive than `click`.
- `keydown` with `Space` or `ArrowUp` for keyboard players.

All three fire the same `flap()` function. Guard against double-firing on mobile where both `touchstart` and `click` can fire — call `preventDefault()` on the touch event.

### Canvas and Responsive Sizing

Two standard approaches in the wild:

**Approach A — Fixed logical size, CSS scaled.** Canvas renders at a fixed resolution (e.g., 288x512). CSS `transform: scale()` stretches it to fill the viewport. Clean pixel art, but produces blurriness on high-DPI screens unless the backing buffer is scaled by `devicePixelRatio`.

**Approach B — Fluid canvas, physics constants expressed as fractions of canvas dimensions.** Canvas CSS size equals the container. All constants (pipe speed, gap, bird size) are relative to canvas height/width. No blurriness. Requires slightly more careful constant management.

Recommendation for this project: **Approach B**. Target users are kids on phones and iPads. Letterboxing and layout shift are worse UX than the mild added complexity of relative constants. Cap max-width at ~480px on desktop so it does not stretch absurdly on wide screens.

### Sound Effects

Three events need audio in the original:

1. **Flap** — Wing-flap sound on each tap. Short and percussive.
2. **Score** — A brief chime or ding when passing a pipe pair.
3. **Hit/Death** — A collision thud or crash sound.

A fourth optional sound: **swoosh** on the start screen or during score display animation.

**Web Audio API is the correct tool**, not `<audio>` elements. Reasons: zero latency on rapid repeated playback (fast flapping), works on mobile after first user gesture unlocks the AudioContext, no DOM node proliferation. The AudioContext must be created or resumed inside the `flap()` handler — it cannot be pre-created before a user gesture on mobile browsers.

The original game's sound files are freely available as WAV/OGG assets. Generating tones with the oscillator API is a fallback option but produces noticeably less satisfying audio.

---

## Table Stakes

Features whose absence makes the clone feel broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Gravity + flap impulse physics | Core mechanic — nothing else works without it | Low | ~10 lines; well-understood constants exist |
| Scrolling pipe pairs with randomized gap heights | Core obstacle | Low-Med | Pipe recycling prevents memory growth on long runs |
| AABB collision detection (pipes + ground) | Without it, scoring is meaningless | Low | Inset hitbox 2–4px for conventional forgiveness |
| Score increment on pipe pass | Players expect a number that goes up | Low | Simple x-position comparison against pipe midpoint |
| Three game states (Idle, Playing, Game Over) | Single boolean `gamePlaying` is insufficient — the Idle bobbing state and Game Over freeze are distinct behaviors | Low-Med | State machine: `"idle" \| "playing" \| "dead"` |
| Restart without page reload | Players expect immediate retry — any page reload kills the experience | Low | Reset all state variables, return to Idle |
| Tap/click to flap — mobile first | Primary users are on phones and iPads | Low | `touchstart` + `mousedown` unified handler |
| Space/ArrowUp keyboard support | Desktop players expect keyboard | Low | `keydown`, same `flap()` function |
| High score via localStorage | Players on repeat visits expect a remembered best | Low | One `getItem/setItem` call |
| Responsive canvas (fills mobile, capped on desktop) | Letterboxed game on a phone is broken UX for kids | Med | Fluid constants or CSS scale; max-width ~480px |
| Idle start screen | Starting mid-physics with no prompt is disorienting | Low | Bird bob + "tap to start" or "press space" text |
| Classic colorful aesthetic (blue sky, green pipes, yellow bird) | Explicitly required in PROJECT.md; the color contrast with the dark site is the charm | Med | Canvas 2D drawing; no external sprite sheets needed |

## Differentiators

Not expected but meaningfully improve the game feel if implemented.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bird rotation following velocity | Makes physics feel real rather than janky | Low | `angle = velocity * someConstant` clamped to a range |
| Bird wing-flap 3-frame animation | Visual liveliness; original had 3 frames | Low-Med | Cycle through 3 draw states on flap, reset on death |
| Screen-shake on death | Satisfying game-feel hit response | Low | CSS `translate` jitter or canvas offset for ~200ms |
| Subtle parallax scrolling background | Depth and motion without complexity | Low | Background layer scrolls at 0.5x pipe speed |
| Medal tier on game over screen | Mirrors original; gives players a mini-goal | Low | Bronze/silver/gold/platinum at 10/20/30/40 |
| "Tap anywhere" vs "Press Space" hint | Correct context for the device they are on | Low | `navigator.maxTouchPoints > 0` to branch message |

## Anti-Features

Explicitly do not build for this version.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Progressive difficulty (speed ramp) | The original did not have it. Adds balancing work. Players expect constant difficulty — the random gaps provide all natural variance. | Fixed speed from score 1 to infinity |
| Pause / resume | Flappy Bird has no pause. Adding it means freezing the canvas loop, suspending audio, and restoring all state. Scope creep with zero user demand. | Game over + restart is the intended rhythm |
| Leaderboard / server scores | No backend. Static site. | localStorage high score only |
| Settings screen | More UI surface, more bugs, kids do not tweak game settings | Single fixed difficulty |
| Multiple bird skins or character select | Scope creep; not in requirements | Classic yellow bird only |
| Background music | Annoying on mobile, hard to mute, not present in original gameplay | Three one-shot SFX only |
| Lives or continues | The brutality of one-life-per-run is the entire appeal of Flappy Bird | Instant death, immediate restart |
| Powerups or shield | Incompatible with the Flappy Bird genre | Omit |
| iframe embedding | Math flashcards used an iframe because it was a pre-existing standalone HTML file. Flappy Bird is being written from scratch in React — it renders as a native Next.js page. The iframe pattern is wrong here. | Native page at `/projects/flappy-bird` |
| Social sharing / screenshot | Engineering effort with unclear value | Omit |
| Ceiling collision | The original had it but most clones drop it. It adds a collision check without adding fun. Skip unless the game feels too easy without it. | Let the bird fly off the top — death only on pipes and ground |

---

## Feature Dependencies

```
Canvas sizing approach → All physics constants (fluid constants depend on canvas dimensions)
AudioContext unlock → Sound effects (must be created/resumed inside first user gesture handler)
Game state machine → All rendering and logic gates (states determine what runs)
Collision detection → Score increment (pass-through is only valid if no collision)
Game Over state → localStorage high score write (write only on death)
localStorage read → Idle screen (display existing high score before first play)
Catalog entry in lib/projects.ts → Project appearing on the homepage
```

---

## MVP Recommendation

Complete required set — everything below ships:

1. Bird physics (gravity + flap impulse)
2. Pipe generation and scrolling with randomized gap heights
3. AABB collision detection (pipes + ground), hitbox inset for forgiveness
4. Three game states: Idle, Playing, Game Over
5. Score counter + localStorage high score
6. Unified tap/click/space input model
7. Responsive canvas, fluid constants, max-width ~480px on desktop
8. Classic colorful canvas drawing (drawn with Canvas 2D API — no sprite assets required to ship)
9. Three sound effects via Web Audio API (flap, score, die)
10. Catalog entry added to `lib/projects.ts`

Add during implementation if the complexity is low in context:
- Bird rotation following velocity
- Bird wing-flap 3-frame animation

Defer explicitly to a future polish pass:
- Medal tiers on game over screen
- Parallax background
- Screen-shake on death

---

## Catalog Integration Pattern

The existing catalog at `lib/projects.ts` holds a typed array of `{ slug, name, description, href }`. Adding Flappy Bird is one array entry:

```typescript
{
  slug: "flappy-bird",
  name: "flappy bird",
  description: "tap to flap. don't hit the pipes.",
  href: "/projects/flappy-bird",
}
```

The page lives at `app/projects/flappy-bird/page.tsx` — the same pattern as `app/projects/math-flashcards/page.tsx`. Both are `"use client"` pages with canvas/interaction logic running in `useEffect` with refs.

---

## Complexity Summary for Roadmap Sizing

| Area | Estimate | Complexity |
|------|----------|------------|
| Game loop (requestAnimationFrame, state machine) | ~50 lines | Low |
| Bird physics | ~30 lines | Low |
| Pipe generation + scrolling + recycling | ~60 lines | Low-Med |
| Collision detection | ~20 lines | Low |
| Canvas drawing (classic aesthetic, no sprites) | ~80 lines | Medium |
| Sound (Web Audio API, 3 effects) | ~40 lines | Medium |
| Responsive canvas sizing | ~20 lines | Low |
| Input handling (touch + mouse + keyboard) | ~20 lines | Low |
| localStorage high score | ~10 lines | Low |
| Catalog entry | ~8 lines | Trivial |
| **Total estimate** | **~340 lines** | **Medium overall** |

This is a single-phase deliverable. The entire game fits in one `page.tsx` with a canvas ref and a `useEffect` game loop. The math-flashcards page demonstrates the project already uses this exact React pattern.

---

## Sources

- [Flappy Bird — Wikipedia](https://en.wikipedia.org/wiki/Flappy_Bird) — Original mechanics, fixed difficulty model, medal tiers. HIGH confidence.
- [Flappy Bird Wiki — Fandom](https://flappybird.fandom.com/wiki/Flappy_Bird) — Tap input model, scoring rules. HIGH confidence.
- [CoolKan Flappy Bird JS Gist](https://gist.github.com/CoolKan/a37cb36fc76a737494fb07fab213d9f1) — Verified numeric constants: gravity 0.5, flap -11.5, pipe speed 6.2, gap 270px, canvas 431x768. MEDIUM confidence (community implementation, consistent with multiple other sources).
- [valentina-mota/flappy-bird-with-canvas-api](https://github.com/valentina-mota/flappy-bird-with-canvas-api) — Canvas API implementation pattern. MEDIUM confidence.
- [Scaling Mobile Games to Any Device — Martin Drapeau](https://medium.com/@martindrapeau/scaling-your-mobile-game-to-any-device-size-4d12dd79cad6) — Fluid canvas sizing approach and rationale. MEDIUM confidence.
- [Flappy Bird Mechanics and Strategies](https://flappy-bird.com/exploring-flappy-bird-mechanics-and-strategies/) — Fixed difficulty model confirmed. MEDIUM confidence.
- [Build Flappy Bird with HTML, CSS, Canvas, JS — DEV Community](https://dev.to/codehuntersharath/create-a-flappy-bird-game-with-html-css-canvas-and-javascript-complete-tutorial-4h30) — Modern implementation reference (Dec 2024). MEDIUM confidence.
