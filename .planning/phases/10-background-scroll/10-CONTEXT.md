# Phase 10: Background Scroll - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Hook the already-loaded `norfair_upper.png` (512×384 RGBA, in `spritesRef.current.bg`) into the environment draw so it tiles horizontally across the full canvas and scrolls at a fixed speed independent of the obstacle speed multiplier. The lava floor continues to be drawn procedurally on top of the tiled background.

Out of scope:
- norfair_lower.png (deferred)
- Background scroll on idle/gameover screens
- Parallax or multi-layer scroll
- Any new npm packages

</domain>

<decisions>
## Implementation Decisions

### Background Coverage
- **D-01:** `norfair_upper.png` tiles horizontally to fill the **entire canvas** (full width × full height). No zone splitting — one draw pass replaces the sky and midground solid fills in `drawEnvironment`.
- **D-02:** The lava floor (bottom 15%) is still drawn procedurally **on top** of the tiled background, preserving the existing `drawEnvironment` lava/shimmer/ground-line logic.
- **D-03:** `imageSmoothingEnabled = false` enforced on the tiled background draw (pixel-perfect scaling, consistent with QUAL-01).
- **D-04:** All `drawImage` coordinates passed through `Math.floor()` (consistent with existing sprite draw pattern).

### Scroll Behavior
- **D-05:** `BG_SCROLL_SPEED` is a standalone constant in `constants.ts`, **not** derived from `speedMultiplier`. Decoupled from obstacle scroll speed as decided in the v1.2 roadmap.
- **D-06:** `bgScrollOffset` lives in the **Effect B rAF closure** (same pattern as `animState`) — auto-resets to 0 on game restart without explicit reset logic.
- **D-07:** Tiling math: draw at `x = -offset`, `x = -offset + 512`, `x = -offset + 1024`, etc., until `x > width`. Wrap by using `offset % tileWidth` each frame. `tileWidth = 512` (natural width of `norfair_upper.png`).
- **D-08:** `bgScrollOffset` is passed into `drawScene` as a new optional parameter (alongside existing `sprites` and `animState`). Static screens (Effect A) pass `bgScrollOffset=0`.

### Static Screens
- **D-09:** Background scroll **only runs during active play** (Effect B rAF loop). Idle and gameover screens draw the background at `offset=0` — clean "still world" / "game starts" / "world moves" separation.
- **D-10:** No second rAF in Effect A — the one-shot static render on state change is preserved as-is.

### Fallback
- **D-11:** When `spritesRef.current.bg === null` (image not yet loaded), the existing solid-fill `drawEnvironment` renders as before. No regression.

### norfair_lower.png
- **D-12:** **Not used in Phase 10.** Remains in `public/sprites/` for a future phase if depth/zone layering is ever wanted.

### Claude's Discretion
- `BG_SCROLL_SPEED` value (recommended: 60–80 CSS px/s — slow enough to feel ambient, fast enough to be clearly moving)
- Whether to introduce a `drawBackground` helper in `drawEnvironment.ts` or draw the tiles inline in `drawScene`
- Tile draw loop implementation details (for-loop vs while-loop, exact boundary conditions)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game Component
- `components/samus-run/SamusRunGame.tsx` — Main component. `spritesRef.current.bg` (already loaded by Effect D), `drawScene()` signature, Effect A (static render), Effect B (rAF loop with animState pattern to follow for bgScrollOffset).

### Environment Drawing
- `components/samus-run/canvas/drawEnvironment.ts` — Current procedural fills: sky, midground, lava, shimmer, ground line, ceiling stalactites. Phase 10 draws the tiled background before the lava floor overlay.

### Constants
- `components/samus-run/constants.ts` — `GAME.floorRatio` (lava starts at 85%), `PHYSICS.baseScrollSpeed` (reference for understanding speed scale). `BG_SCROLL_SPEED` will be added here.

### Asset
- `public/sprites/norfair_upper.png` — 512×384 RGBA. Already loaded into `spritesRef.current.bg` by Effect D (`/sprites/norfair_upper.png?v=3`).

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `spritesRef.current.bg`: `HTMLImageElement` — already loaded, already in the ref, just needs to be drawn. Natural tile width = 512px.
- `drawEnvironment(ctx, width, height)`: existing function — Phase 10 either prepends the tile draw inside this function (before lava) or calls a new `drawBackground(ctx, bg, width, height, offset)` before `drawEnvironment`.
- `animState` in Effect B closure: exact pattern to follow for `bgScrollOffset` — declare inside Effect B, advance each frame, auto-resets on game restart.

### Established Patterns
- `drawScene(ctx, screen, width, height, physics?, sprites?, animState?)` — add `bgScrollOffset?: number` as a new optional parameter. All existing callers continue to work (undefined = 0 fallback).
- Effect A (static render): passes `undefined` or `0` for `bgScrollOffset` — no animation needed.
- `Math.floor()` on all drawImage args: already enforced in `drawSamusSprite`, must also apply here.
- `imageSmoothingEnabled = false`: already set in `ctx.save()/restore()` blocks in sprite draws — same pattern for background tile.

### Integration Points
- `drawScene` in both Effect A and Effect B call sites — add `bgScrollOffset` argument to both.
- Effect B loop: advance `bgScrollOffset += BG_SCROLL_SPEED * dt; bgScrollOffset %= tileWidth;` each frame before passing to `drawScene`.
- `drawEnvironment` or a new sibling function: receives `bg: HTMLImageElement | null` and `offset: number` — draws tiled copies, then early-returns if `bg === null` (solid fill fallback).

</code_context>

<specifics>
## Specific Ideas

- Scroll direction: left-to-right world movement means background scrolls left (`offset` increases, tiles shift left). Consistent with obstacle direction.
- Tile width is exactly 512px — use this as the modulo value for wrap, not a computed `bg.naturalWidth` call each frame.

</specifics>

<deferred>
## Deferred Ideas

- `norfair_lower.png` — 512×384, same format as upper. Available for a future phase if zone-based layering or deeper cave appearance is wanted.
- Parallax scroll (background at a different speed than foreground) — out of scope for v1.2; `BG_SCROLL_SPEED` is already decoupled from `speedMultiplier` so this would be easy to wire later.
- Ambient background scroll on idle screen — deferred; requires a second rAF in Effect A which adds complexity not worth it for a static waiting screen.

</deferred>

---

*Phase: 10-background-scroll*
*Context gathered: 2026-04-27*
