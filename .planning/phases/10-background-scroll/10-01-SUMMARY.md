---
phase: 10
plan: "01"
subsystem: canvas-rendering
tags: [background-scroll, canvas2d, tile-rendering, scroll-offset, norfair, pixel-perfect]
dependency_graph:
  requires:
    - "09-01: sprite animation system (Effect B closure pattern, animState)"
    - "08-01: norfair_upper.png loaded into spritesRef.current.bg (Effect D)"
  provides:
    - "BG_SCROLL_SPEED and TILE_WIDTH constants"
    - "drawBackground helper with pixel-perfect tile loop"
    - "drawEnvironment with optional bg/bgOffset params and null fallback"
    - "bgScrollOffset closure variable advancing each rAF frame"
  affects:
    - "components/samus-run/constants.ts"
    - "components/samus-run/canvas/drawEnvironment.ts"
    - "components/samus-run/SamusRunGame.tsx"
tech_stack:
  added: []
  patterns:
    - "Closure variable in Effect B for auto-reset on game restart (matches animState pattern)"
    - "ctx.save()/imageSmoothingEnabled=false/ctx.restore() for pixel-perfect drawImage"
    - "Modulo wrap (% TILE_WIDTH) to bound float accumulation over long sessions"
    - "Optional parameter with ?? fallback for backward-compatible signature extension"
key_files:
  created: []
  modified:
    - "components/samus-run/constants.ts"
    - "components/samus-run/canvas/drawEnvironment.ts"
    - "components/samus-run/SamusRunGame.tsx"
decisions:
  - "BG_SCROLL_SPEED=70 placed as standalone export after OBSTACLE_SPACING_PX, not inside PHYSICS object — matches existing OBSTACLE_SPACING_PX pattern and makes independence from speedMultiplier structurally explicit"
  - "bgScrollOffset advance placed BEFORE the game.gameOver check in rAF loop — harmless on death frame (early return skips draw) and keeps advance/draw symmetry consistent with animState pattern"
  - "Effect A static-render drawScene call left without bgScrollOffset arg — undefined coerces to 0 via bgOffset??0, idle/gameover screens stay frozen (D-09)"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-28"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 10 Plan 01: Background Scroll — Summary

**One-liner:** Norfair background tiles horizontally at 70 CSS px/s fixed speed via modulo-wrapped closure offset advancing each rAF frame, with pixel-perfect drawImage and solid-fill fallback when bg is null.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add BG_SCROLL_SPEED and TILE_WIDTH constants | `4e63a61` | `constants.ts` |
| 2 | Add drawBackground helper, extend drawEnvironment signature | `48bb532` | `canvas/drawEnvironment.ts` |
| 3 | Wire bgScrollOffset through SamusRunGame rAF loop | `11e4b51` | `SamusRunGame.tsx` |

---

## What Was Built

### Task 1 — constants.ts

Two new standalone `export const` declarations added after `OBSTACLE_SPACING_PX` and before `COLLISION`:

- `BG_SCROLL_SPEED = 70` — fixed CSS px/s ambient scroll speed, structurally decoupled from `PHYSICS.baseScrollSpeed` (220) and the `speedMultiplier` gameplay variable
- `TILE_WIDTH = 512` — natural tile width of `norfair_upper.png`, used as modulo wrap value and tile draw loop step size

### Task 2 — canvas/drawEnvironment.ts

Full file rewrite:

- Added private `drawBackground(ctx, bg, width, height, offset)` helper — tiles the loaded `HTMLImageElement` horizontally using `ctx.save()` / `ctx.imageSmoothingEnabled = false` / `Math.floor()` on all coordinates / `ctx.restore()` per QUAL-01 pixel-perfect rules. Loop starts at `x = -Math.floor(offset)` ∈ `[-511, 0]` and steps by `TILE_WIDTH` until `x >= width` — no blank gap possible.
- Extended `drawEnvironment` signature with optional `bg?: HTMLImageElement | null` and `bgOffset?: number` params
- When `bg` truthy: calls `drawBackground` with `bgOffset ?? 0`
- When `bg` null/undefined: falls through to original solid fills (`NORFAIR.sky` + `NORFAIR.midground`) — D-11 fallback preserved
- Lava floor, shimmer line, ground line, ceiling stalactites always draw on top of whichever background branch ran

### Task 3 — SamusRunGame.tsx

Five targeted edits:

1. Import line extended to include `BG_SCROLL_SPEED` and `TILE_WIDTH`
2. `drawScene` signature extended with optional `bgScrollOffset?: number` as last param
3. `drawEnvironment` call inside `drawScene` extended to `drawEnvironment(ctx, width, height, sprites?.bg, bgScrollOffset ?? 0)`
4. `let bgScrollOffset = 0` declared in Effect B closure alongside `animState` — auto-resets to 0 on game restart because Effect B re-runs when `state.screen` changes to `"playing"`
5. Per-frame advance `bgScrollOffset = (bgScrollOffset + BG_SCROLL_SPEED * dt) % TILE_WIDTH` added before the `game.gameOver` check; Effect B `drawScene` call extended with `bgScrollOffset` as final arg
6. Effect A static-render call (`drawScene(ctx, state.screen, ...)`) left unchanged — no `bgScrollOffset` arg means `undefined`, which resolves to 0 via `?? 0`, keeping idle/gameover screens frozen (D-09)

---

## Success Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|---------|
| ENV-01: Background scrolls at 70 px/s independent of speedMultiplier | PASS | `BG_SCROLL_SPEED` is a standalone constant; grep confirms no `BG_SCROLL_SPEED * speedMultiplier` anywhere |
| ENV-02: Seamless wrap — no blank gap at tile boundary | PASS | Offset bounded to `[0, 512)` via modulo; loop starts at `[-511, 0]`; left tile always covers `x=0` |
| bgScrollOffset resets to 0 on restart | PASS | `let bgScrollOffset = 0` declared in Effect B closure; re-declared each time Effect B re-runs |
| Fallback: null bg renders Phase 9 solid fills, no regression | PASS | `else` branch preserves `NORFAIR.sky` + `NORFAIR.midground` fills; `NORFAIR.lavaGlow`/shimmer/stalactites unmodified |
| `npx tsc --noEmit` exits 0 | PASS | Verified after each task and at plan completion |
| `npx next build` exits 0 | PASS | Build output: 8/8 static pages, no errors |

---

## Deviations from Plan

None — plan executed exactly as written. All 5 edits to `SamusRunGame.tsx` matched the plan's action text precisely. The plan's note about Edit 6 (leaving Effect A unchanged) was followed: that call site has no `bgScrollOffset` argument.

---

## Known Stubs

None. `spritesRef.current.bg` is loaded from the real asset (`/sprites/norfair_upper.png`) by Effect D (Phase 8). The fallback path exists for null-image safety, not as a stub.

---

## Threat Flags

T-10-02 and T-10-03 (both `mitigate` disposition in threat register) are addressed:

| Flag | File | Description |
|------|------|-------------|
| T-10-02 mitigated | `canvas/drawEnvironment.ts` | Tile loop bounded: `for (let x = startX; x < width; x += TILE_WIDTH)` — max ~5 iterations on 2560px canvas; no user input affects iteration count |
| T-10-03 mitigated | `SamusRunGame.tsx` | `bgScrollOffset = (...) % TILE_WIDTH` every frame bounds value to `[0, 512)` regardless of session length or frame rate |

No new threat surface beyond what is documented in the plan's threat model.

---

## Self-Check: PASSED

- FOUND: `components/samus-run/constants.ts`
- FOUND: `components/samus-run/canvas/drawEnvironment.ts`
- FOUND: `components/samus-run/SamusRunGame.tsx`
- FOUND: `.planning/phases/10-background-scroll/10-01-SUMMARY.md`
- FOUND: commit `4e63a61` (Task 1)
- FOUND: commit `48bb532` (Task 2)
- FOUND: commit `11e4b51` (Task 3)
