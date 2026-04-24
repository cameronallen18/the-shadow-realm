# Project Research Summary

**Project:** the shadow realm — Samus Run v1.2 Pixel Perfect
**Domain:** Canvas sprite sheet animation + level background integration for an existing rAF-based game
**Researched:** 2026-04-23
**Confidence:** HIGH

## Executive Summary

Milestone v1.2 adds authentic Super Metroid sprites and a Norfair scrolling background to the existing Samus Run canvas game. The existing architecture is a well-structured rAF loop with clear separation between physics (`gameLoop.ts`) and rendering (`canvas/` modules). Adding sprites requires zero new npm packages — every needed API (`drawImage`, `imageSmoothingEnabled`, `HTMLImageElement`) is native Canvas 2D and baseline-available across all modern browsers. The integration touches five existing files, adds four new canvas modules, and adds two PNG assets to `public/sprites/`. The physics engine (`gameLoop.ts`) is not touched at all.

The recommended approach is a four-phase build order: (A) asset pipeline — download and serve sprite PNGs; (B) animation state machine — derive idle/jump mode from physics, advance frame index with a time accumulator; (C) Samus sprite draw — replace procedural shape draw with `drawImage` using a sprite/fallback branch; (D) background scroll — tile the Norfair background image at a fixed independent speed. Obstacle texturing (Phase E) is optional and lowest priority. The Norfair environment is the only viable target for v1.2: it requires zero palette changes since the existing `NORFAIR` color constants already match. Brinstar and Maridia would require full environment redesigns.

The top risk is invisible silent failure: `drawImage` on an unloaded image silently no-ops, fractional pixel coordinates silently blur sprites, and canvas state leaks between draw calls with no thrown error. Every pitfall in this domain produces a symptom (invisible sprite, blurry sprite, offset obstacles) that looks like a different bug. The prevention is uniform: gate draws on load, floor all `drawImage` coordinates, and wrap every draw function in `ctx.save()`/`ctx.restore()`. Background scroll speed must be decoupled from `game.speedMultiplier` from day one or the environment becomes unreadable at high game speed.

## Key Findings

### Recommended Stack

No new dependencies. The entire sprite animation and background system is implemented with native Canvas 2D APIs that have been baseline-available since 2015-2017. The key APIs are the 9-argument `drawImage()` for frame slicing and scaling, `imageSmoothingEnabled = false` for nearest-neighbor pixel art rendering, and a simple `Promise.all` image preloader. The existing rAF loop's `dt` variable already provides everything needed for frame-rate-independent animation timing — no additional timing infrastructure required.

**Core APIs (all native browser):**
- `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)` — 9-arg form for sprite sheet frame extraction and scaling
- `ctx.imageSmoothingEnabled = false` — nearest-neighbor scaling for pixel art
- `new Image()` + `onload` / `Promise.all` — fire-and-forget preloader pattern, stored in `useRef`

### Expected Features

**Must have (table stakes for v1.2):**
- Samus idle frame (single standing frame — Super Metroid has NO idle breathing animation in ROM data)
- Samus spin jump animation (4-8 frames, ~80-100ms per frame, loops while airborne)
- Norfair scrolling background (tiled, fixed speed independent of obstacle scroll multiplier)

**Should have:**
- Screw attack visual distinction (spin jump frames + yellow flash overlay — no separate sprite data needed)
- Graceful shape fallback when sprites are not yet loaded

**Defer to v2+:**
- Running animation (Samus does not run in this game; 10-frame run cycle is irrelevant)
- Brinstar or Maridia environments (incompatible with existing warm dark palette; require full redesign)
- Obstacle column texturing (Phase E; cosmetic-only, lowest priority)

**Anti-features confirmed:**
- No idle breathing animation from ROM — Wikitroid confirms no 2D Metroid game has idle animations. If desired, author a 2-3 frame subtle canvas bob instead.
- No new npm packages — Canvas 2D is sufficient; Phaser/PixiJS/Konva are explicitly rejected.

### Architecture Approach

The integration follows the established ref-based rendering pattern already used by the existing game. `AnimState` is a local closure variable inside Effect B (auto-resets on game restart, never triggers React re-renders). `spritesRef` is a `useRef` loaded once on mount via a new Effect D. The physics module (`gameLoop.ts`) is untouched — the animation layer reads physics state as a read-only input to derive animation mode. Every new draw function receives state as parameters (pure inputs to deterministic output) and wraps mutations in `ctx.save()`/`ctx.restore()`.

**Major components (new or modified):**
1. `canvas/spriteSheet.ts` (new) — `loadImage()` helper, `SpriteSheet` type
2. `canvas/animState.ts` (new) — `AnimState` interface, `updateAnimation()` function; reads `GamePhysicsState.samusVY` to derive mode; advances frame with dt accumulator
3. `canvas/drawSamusSprite.ts` (new) — primary Samus draw path using `drawImage` with frame slice from sheet
4. `canvas/drawEnvironment.ts` (modified) — extended with `scrollOffset` and `bgImage` optional params; existing solid-fill path preserved as fallback
5. `SamusRunGame.tsx` (modified) — `spritesRef`, Effect D (image loading), `anim` and `bgOffset` locals in Effect B, extended `drawScene` signature

**Unchanged:** `gameLoop.ts`, `audioManager.ts`, `drawSamus.ts` (kept as shape fallback), `drawObstacleShape.ts`

### Critical Pitfalls

1. **Drawing before image loads** — `drawImage` on an unloaded `Image` silently no-ops; no error thrown. Gate all draw calls on `spritesRef.current.samus !== null`; never create `new Image()` inside the rAF loop.

2. **`setupCanvas` every frame + float drawImage coords** — `canvas.width =` resets `imageSmoothingEnabled` and all transforms each frame. Move `setupCanvas` to ResizeObserver only before adding `drawImage`; apply `Math.floor()` to all eight `drawImage` arguments.

3. **Frame advancement coupled to rAF cadence** — `frameIndex++` per tick makes animation 2x faster on 120Hz displays. Use the dt accumulator: `anim.timer += dt; if (anim.timer >= 1/fps) { anim.timer -= 1/fps; anim.frame++ }`.

4. **Background speed coupled to `speedMultiplier`** — at 2.5x game speed the background becomes a blur. Give background its own fixed speed constant independent of obstacle speed.

5. **CORS-tainted canvas from external sprite URLs** — loading from Spriters Resource directly will taint the canvas or fail CORS. Download PNGs and commit to `public/sprites/`; serve from same origin.

6. **Hitbox mismatch after sprite swap** — existing `COLLISION.samusWidth: 28` was tuned for the procedural shape. After first sprite draw, overlay a red debug rect, verify hitbox alignment, and update `COLLISION` constants to match visible body (excluding transparent padding).

7. **iOS Safari canvas memory budget** — off-screen canvas caching can silently black out the canvas on iPhone. Do not use `OffscreenCanvas`; direct `drawImage` slice is fast enough for under 20 frames.

8. **Canvas state pollution** — a missing `ctx.restore()` in any new sprite function carries transform state into `drawRockWall`, causing obstacles to appear rotated. Every draw function that mutates context state must use `ctx.save()`/`ctx.restore()`.

## Implications for Roadmap

### Phase A: Asset Pipeline
**Rationale:** Everything else depends on having the PNGs present and loadable. Zero canvas code risk; verified by network tab alone.
**Delivers:** Both PNGs committed to `public/sprites/`; Effect D loading them into `spritesRef`; HTTP 200 confirmed on both assets in browser.
**Addresses:** Pitfalls 1 (load gating) and 5 (CORS — assets served from same origin from day one).
**Asset URLs:**
- Samus complete sheet: https://www.spriters-resource.com/snes/smetroid/asset/182270/
- Norfair dedicated sheet: https://www.spriters-resource.com/snes/smetroid/asset/159298/
- Tile Sheets (norfair_upper.png + norfair_lower.png): https://www.spriters-resource.com/snes/smetroid/sheet/144515/
- Fallback source: https://spritedatabase.net/game/543

### Phase B: Animation State Machine
**Rationale:** Animation logic proven correct via console output before any visual change is made. Isolates mode-transition bugs from draw-call bugs entirely.
**Delivers:** `AnimState` in rAF closure; `updateAnimation()` deriving idle/jump mode from `samusVY`; console-verified mode transitions; zero visual change.
**Implements:** `canvas/animState.ts`, stub `SPRITE_FRAMES`/`SPRITE_FPS`/`SPRITE_LAYOUT` constants in `constants.ts`.
**Avoids:** Pitfall 3 (dt accumulator mandated from day one).

### Phase C: Samus Sprite Draw
**Rationale:** The centerpiece of the milestone. Background waits. Doing Samus first simplifies debugging — only one new system active at a time.
**Delivers:** Sprite Samus renders and animates on idle/jump; shape fallback confirmed when image is null; hitbox audit completed and collision constants updated.
**Implements:** `canvas/drawSamusSprite.ts`; sprite/fallback branch in `drawScene`; `SPRITE_LAYOUT` filled with real values after measuring the downloaded sheet.
**Avoids:** Pitfalls 2 (Math.floor on all drawImage args), 6 (hitbox audit required before shipping), 7 (save/restore on all new draw functions), 8 (no OffscreenCanvas).

### Phase D: Background Scroll
**Rationale:** Additive and cosmetically isolated from Samus. Can be integrated, verified, and reverted independently.
**Delivers:** Norfair background tiles scrolling in a loop; fixed speed independent of `speedMultiplier`; solid-fill fallback preserved; restart resets offset to 0.
**Implements:** Modified `drawEnvironment` with `scrollOffset` and `bgImage` optional params; `bgOffset` as rAF closure local variable (not `useRef`).
**Avoids:** Pitfall 4 (background speed decoupled from game speed), Architecture Anti-Pattern 3 (`bgOffset` as local var so it auto-resets on restart).

### Phase E: Obstacle Textures (optional, lowest priority)
**Rationale:** Purely cosmetic; existing `drawRockWall` is already visually coherent with the Norfair palette. Add only if the tile sheet produces a compelling result.
**Delivers:** `canvas/drawObstacleSprite.ts`; textured obstacle columns with identical physics geometry.

### Phase Ordering Rationale

- Phase A before all: no canvas changes until assets are confirmed loadable at their final production URL on Vercel.
- Phase B before Phase C: animation state machine verified in isolation before it drives visual output; prevents mixing logic bugs and draw bugs in the same phase.
- Phase C before Phase D: Samus is the harder technical problem (hitbox audit, DPR correctness, save/restore discipline). Background is additive.
- Phase E last and optional: zero gameplay coupling; add only if texture quality justifies the effort.

### Research Flags

Phases with well-documented patterns (no additional research needed):
- **Phase A:** Standard Next.js `public/` static serving.
- **Phase B:** Delta-time accumulator is established game dev pattern; code structure fully specified in ARCHITECTURE-SPRITES.md.
- **Phase D:** Manual tiling with `drawImage` is the recommended approach; pattern fully documented.

Phases requiring a measurement step during implementation (not a research gap):
- **Phase C:** Exact `SPRITE_LAYOUT` constants (frameW, frameH, row index per animation, pixel padding) cannot be known until the sheet is downloaded and measured in an image editor. Budget 30 minutes for this step before writing draw code.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All APIs are MDN-documented baseline browser standards; zero new packages; confirmed against existing codebase |
| Features | HIGH | Frame counts and animation types confirmed from ROM hacking community and Wikitroid; no idle animation is HIGH confidence (official Wikitroid source) |
| Architecture | HIGH | Derived from direct inspection of all existing source files; patterns match established rAF canvas game conventions |
| Pitfalls | HIGH | All 8 critical pitfalls verified against MDN, web.dev, WebKit bug tracker, and direct codebase analysis |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact frame layout constants:** `SPRITE_LAYOUT` (row, frameW, frameH) requires manual measurement of the downloaded sprite sheet. Use placeholder values in Phase B; fill in real values at the start of Phase C.
- **Spin jump frame count:** Community sources cite 4-8 frames. Use 6 as a placeholder; adjust after measuring the sheet.
- **Sprite alpha transparency:** Most community PNG rips have correct alpha, but verify the downloaded PNG is not using magenta as a transparent color before writing draw code.
- **Legal risk:** Nintendo IP enforcement is accepted by project scope. Non-commercial personal portfolio game; risk level tolerated.

## Sources

### Primary (HIGH confidence)
- MDN drawImage: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
- MDN imageSmoothingEnabled: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
- MDN CORS enabled images in canvas: https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image
- MDN Optimizing canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- web.dev High DPI Canvas: https://web.dev/articles/canvas-hidipi
- WebKit bug 195325 (canvas memory limit): https://bugs.webkit.org/show_bug.cgi?id=195325
- Wikitroid idle pose (no idle animation in 2D Metroid): https://metroid.fandom.com/wiki/Idle_pose
- Wikitroid Screw Attack (flash-only visual differentiator): https://metroid.fandom.com/wiki/Screw_Attack
- Next.js static file serving: https://nextjs.org/docs/app/api-reference/file-conventions/public-folder
- Direct codebase inspection: SamusRunGame.tsx, gameLoop.ts, drawEnvironment.ts, drawSamus.ts, constants.ts

### Secondary (MEDIUM confidence)
- The Spriters Resource — Super Metroid hub: https://www.spriters-resource.com/snes/smetroid/
- Samus complete sheet (asset 182270): https://www.spriters-resource.com/snes/smetroid/asset/182270/
- Tile Sheets collection (asset 144515): https://www.spriters-resource.com/snes/smetroid/sheet/144515/
- Norfair dedicated sheet (asset 159298): https://www.spriters-resource.com/snes/smetroid/asset/159298/
- Samus run cycle dimensions (10 frames, 35x43px): https://www.tumblr.com/desandro/113218736476/super-metroid-samus-run-cycle-10-frames-16
- Turnaround animation 6 frames: https://tasvideos.org/GameResources/SNES/SuperMetroid
- Norfair visual description: https://metroid.fandom.com/wiki/Norfair
- Background HQ: https://bghq.com/bgs.php?c=31
- MDN Square tilemaps scrolling: https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps/Square_tilemaps_implementation:_Scrolling_maps
- Sprite Database fallback: https://spritedatabase.net/game/543

### Tertiary (LOW confidence)
- NES-SNES-Sprites.com (server unreliable): http://www.nes-snes-sprites.com/SuperMetroidSamus.html

---
*Research completed: 2026-04-23*
*Ready for roadmap: yes*
