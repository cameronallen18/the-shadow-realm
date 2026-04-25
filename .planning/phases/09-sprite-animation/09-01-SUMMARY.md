---
phase: 9
plan: "09-01"
subsystem: game-rendering
tags: [sprite-animation, canvas2d, game-loop, animation-state]
dependency_graph:
  requires: [phase-08-asset-pipeline]
  provides: [sprite-draw-samus, anim-state-loop, screw-attack-visual]
  affects: [components/samus-run/SamusRunGame.tsx, components/samus-run/canvas/drawSamus.ts, components/samus-run/gameLoop.ts]
tech_stack:
  added: []
  patterns: [dt-accumulator-frame-advance, closure-animstate, cross-closure-flag-bridge, 9-arg-drawImage]
key_files:
  created: []
  modified:
    - components/samus-run/gameLoop.ts
    - components/samus-run/canvas/drawSamus.ts
    - components/samus-run/SamusRunGame.tsx
decisions:
  - "AnimState (frame, accumulator, isScrewAttack) lives in Effect B rAF closure — auto-resets on game restart without explicit reset logic (D-10)"
  - "pendingScrewAttack boolean on GamePhysicsState bridges handleInput → Effect B cross-closure communication (Pattern 4)"
  - "FRAME_DURATION subtraction (not reset to 0) preserves leftover time for accurate 120Hz timing"
  - "isAirborne = samusY < canvasHeight * floorRatio - 1 matches updateGame clamp logic, avoids jump-apex false positive"
  - "10fps chosen for both spinJumpR and screwAttackR — midpoint of 8-12fps Super Metroid typical range"
  - "Screw attack overlay uses screen composite at rgba(80,120,255,0.35) — cool blue per project palette constraint"
metrics:
  duration: "3m"
  completed: "2026-04-25"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 9 Plan 01: Sprite Animation — Samus Draw System Summary

**One-liner:** Sprite-sheet Samus draw with looping 9-frame spin jump + screw attack animation at 10fps via dt-accumulator in rAF closure, replacing procedural shapes with pixel-perfect imageSmoothingEnabled=false drawImage draws.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add pendingScrewAttack to GamePhysicsState | a494184 | gameLoop.ts |
| 2 | Add drawSamusSprite to drawSamus.ts | aa8bc09 | canvas/drawSamus.ts |
| 3 | Wire AnimState + sprite draw into SamusRunGame.tsx, fix WR-02/WR-03/IN-03 | a4930ac | SamusRunGame.tsx |

## What Was Built

### Task 1 — gameLoop.ts
Added `pendingScrewAttack: boolean` to `GamePhysicsState` interface and initialized it as `false` in `createInitialGameState`. This field is the cross-closure bridge: `handleInput` writes it when the player jumps mid-air, and Effect B's rAF loop reads and clears it on the next frame to trigger the screw attack animation state.

### Task 2 — canvas/drawSamus.ts
Added `drawSamusSprite()` — the core sprite rendering function — alongside the preserved `drawSamusIdle` and `drawSamusJump` shape fallbacks. Key implementation details:
- Imports `SPRITE_LAYOUT`, `GAME`, `COLLISION` from constants
- `AnimState` interface declared locally (matches closure type in SamusRunGame)
- `DEBUG_HITBOX = false` constant present for local hitbox tuning
- Section selection: idle → `SPRITE_LAYOUT.idle`; airborne spinJump → `SPRITE_LAYOUT.spinJumpR`; screw attack → `SPRITE_LAYOUT.screwAttackR`
- All 8 source/destination drawImage arguments through `Math.floor()`
- `ctx.imageSmoothingEnabled = false` set inside `ctx.save()`/`ctx.restore()` before each draw
- Screw attack blue overlay via `globalCompositeOperation = "screen"` at `rgba(80, 120, 255, 0.35)`
- `samusY` bottom-anchor preserved: `dy = Math.floor(y - dh)` matches shape-Samus convention

### Task 3 — SamusRunGame.tsx
Wired the full animation system:
- `drawScene` signature extended with `sprites?` and `animState?` parameters
- `AnimState` object declared in Effect B closure (frame=0, accumulator=0, isScrewAttack=false)
- `SPIN_FPS = 10`, `FRAME_DURATION = 1/10` constants in Effect B closure
- Per-frame loop: airborne detection, `pendingScrewAttack` consumption, floor reset, dt-accumulator frame advance with subtraction (not reset)
- All three `drawScene` call sites updated with `spritesRef.current` and `animState`/`undefined`
- **WR-01 fixed:** `spritesRef` now piped to all draw call sites
- **WR-02 fixed:** `audioRef.current?.playJump()` with optional chaining null guard
- **WR-03 fixed:** `game.gameOver` check moved before `drawScene` call in Effect B loop
- **IN-03 fixed:** idle "tap to start" button uses `handleInput` instead of direct `dispatch({ type: "START" })`

## Success Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|---------|
| ANIM-01: Idle sprite on floor | PASS | `drawSamusSprite(..., undefined, false)` on idle/gameover paths; `section = idle` when `!isAirborne` |
| ANIM-02: Looping 9-frame spin jump at 10fps | PASS | `SPRITE_LAYOUT.spinJumpR.frames=9`, `FRAME_DURATION=0.1s`, subtraction accumulator |
| ANIM-03: Screw attack visually distinct | PASS | `SPRITE_LAYOUT.screwAttackR` frames + blue overlay via screen composite |
| ANIM-04: Shape fallback when samus===null | PASS | `if (sprites?.samus)` guards all sprite draws; shape functions preserved |
| QUAL-01: imageSmoothingEnabled=false + Math.floor on all args | PASS | grep confirms both; 8x Math.floor in drawSamusSprite |
| T-09-01: DEBUG_HITBOX=false | PASS | `const DEBUG_HITBOX = false` committed |
| WR-02: audioRef null guard | PASS | `audioRef.current?.playJump()` |
| WR-03: game-over before drawScene | PASS | gameOver check line 240, drawScene call line 253 |
| IN-03: idle button uses handleInput | PASS | `onClick={handleInput}` |
| TypeScript: npx tsc --noEmit exits 0 | PASS | Clean — no errors |

## Deviations from Plan

None — plan executed exactly as written. All ten changes (A through J) applied in order. No architectural surprises encountered. The `void GAME;` line added to suppress unused import warning (GAME imported per plan instruction for caller context) is a minor TypeScript hygiene addition, not a behavioral deviation.

## Known Stubs

None. All sprite draw paths are wired to real data sources (`spritesRef.current.samus`, `SPRITE_LAYOUT` constants, `animState` closure variable). Shape fallbacks are intentional and correct per D-05.

Note: `COLLISION.samusWidth = 28` and `COLLISION.samusHeight = 36` remain as Phase 7 placeholder values — hitbox tuning via `DEBUG_HITBOX` workflow (QUAL-02) is explicitly assigned to Plan 09-02, not this plan.

## Threat Flags

No new trust boundaries introduced. `DEBUG_HITBOX = false` committed (T-09-01 mitigated). All other threats accepted per plan threat model.

## Self-Check: PASS

- [x] `components/samus-run/gameLoop.ts` modified — confirmed in `git diff b8d276d HEAD`
- [x] `components/samus-run/canvas/drawSamus.ts` modified — confirmed in `git diff b8d276d HEAD`
- [x] `components/samus-run/SamusRunGame.tsx` modified — confirmed in `git diff b8d276d HEAD`
- [x] Commit a494184 exists — `git log --oneline` confirms
- [x] Commit aa8bc09 exists — `git log --oneline` confirms
- [x] Commit a4930ac exists — `git log --oneline` confirms
- [x] TypeScript clean — `npx tsc --noEmit` exits 0
