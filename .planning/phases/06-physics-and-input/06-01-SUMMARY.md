---
phase: 06-physics-and-input
plan: "01"
subsystem: samus-run/physics
tags: [physics, game-loop, typescript, pure-functions]
dependency_graph:
  requires: [05-02]
  provides: [GamePhysicsState, Obstacle, createInitialGameState, updateGame, triggerJump, PHYSICS, OBSTACLE_SPACING_RATIO]
  affects: [06-02]
tech_stack:
  added: []
  patterns: [frame-rate-independent-physics, pure-mutation-functions, obstacle-pooling]
key_files:
  created:
    - components/samus-run/gameLoop.ts
  modified:
    - components/samus-run/constants.ts
decisions:
  - "Obstacles mutate in place (not immutable) to avoid GC pressure in the 60fps hot path"
  - "randomGap uses floorRatio boundary so gaps always fit within the playable area"
  - "triggerJump always applies jumpVelocity (Flappy Bird style) — no mid-air restriction; collision/death deferred to Phase 7"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-23T14:55:32Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 06 Plan 01: Physics Constants and Game Loop Summary

Pure physics module created — PHYSICS constants with gravity/jump/scroll tuning, plus gameLoop.ts with frame-rate-independent gravity, obstacle recycling with gap randomization, and speed progression every 10 obstacles.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend constants.ts with PHYSICS and OBSTACLE_SPACING_RATIO | e68cdb9 | components/samus-run/constants.ts |
| 2 | Create gameLoop.ts with types, factory, update, jump | be90204 | components/samus-run/gameLoop.ts |

## What Was Built

**constants.ts additions:**
- `PHYSICS` constant with 7 keys: gravity (1200 px/s²), jumpVelocity (520 px/s), terminalVelocity (900 px/s), baseScrollSpeed (220 px/s), speedIncrement (0.15), maxSpeedMultiplier (2.5), dtCap (0.05s)
- `OBSTACLE_SPACING_RATIO = 0.6` for obstacle pool x-stagger

**gameLoop.ts (new file, 129 lines):**
- `Obstacle` interface: x, gapTop, gapBottom, scored
- `GamePhysicsState` interface: samusY, samusVY, obstacles[], obstaclesCleared, speedMultiplier, gameOver, pendingJump
- `createInitialGameState(w, h)` — places Samus on floor, creates 2 staggered obstacles with randomized gaps
- `updateGame(state, dt, w, h)` — processes pendingJump, applies gravity with terminal velocity clamp, clamps to floor/ceiling, scrolls obstacles and recycles off-screen ones with new random gaps, increments speed every 10 obstacles cleared
- `triggerJump(state)` — Flappy Bird style, always applies -PHYSICS.jumpVelocity regardless of mid-air state
- Zero React imports; only imports from `./constants`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx next build` passes clean (confirmed after each task)
- All 5 exports present: GamePhysicsState, Obstacle, createInitialGameState, updateGame, triggerJump
- PHYSICS and OBSTACLE_SPACING_RATIO confirmed in constants.ts
- gameLoop.ts imports from `./constants` only — no React

## Known Stubs

None. gameLoop.ts is a pure computation module with no UI rendering. No stubs or placeholders.

## Threat Flags

None. Pure computation module with no I/O, network, or user input processing as documented in plan threat model.

## Self-Check

- [x] components/samus-run/constants.ts exists and contains PHYSICS export
- [x] components/samus-run/gameLoop.ts exists with all 5 required exports
- [x] Task 1 commit e68cdb9 exists
- [x] Task 2 commit be90204 exists
- [x] npx next build passes
