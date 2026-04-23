---
phase: 06-physics-and-input
plan: "02"
subsystem: samus-run/game-loop-integration
tags: [canvas, requestAnimationFrame, react, hooks, input, physics, touch]

# Dependency graph
requires:
  - phase: 06-01
    provides: [GamePhysicsState, Obstacle, createInitialGameState, updateGame, triggerJump, PHYSICS]
provides:
  - rAF game loop wired into SamusRunGame.tsx React component
  - Unified input handler for keyboard (Space/ArrowUp), mouse click, and touch
  - Dynamic drawScene driven by physics state (obstacle positions, Samus Y, sprite selection)
  - Screen-ref mirror pattern for stale-closure-free event handlers
  - Delta-time normalization preventing physics explosion on tab switch
affects: [07-collision-and-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns: [screen-ref-mirror, raf-cleanup-pattern, passive-false-touchstart, delta-time-cap]

key-files:
  created: []
  modified:
    - components/samus-run/SamusRunGame.tsx

key-decisions:
  - "screenRef mirrors state.screen in a separate useEffect so input handlers (mounted once) always read current screen without stale closure"
  - "Two separate useEffects for idle/gameover static rendering vs playing rAF loop — each has its own cleanup path, preventing cross-state leaks"
  - "pendingJump=true set immediately when rAF loop initializes, so the first input that transitions to playing also causes an immediate jump"
  - "e.preventDefault() on both Space keydown and touchstart — prevents page scroll and double-tap zoom on mobile"
  - "dt capped at PHYSICS.dtCap (0.05s) to prevent physics explosion after tab switch or long frame"

patterns-established:
  - "screenRef pattern: keep a useRef mirror of React state for use inside mount-only event listeners"
  - "rAF effect: only runs when screen === 'playing', returns cancelAnimationFrame cleanup"
  - "Static render effect: only runs when screen !== 'playing', drives ResizeObserver"

requirements-completed: [GAME-01, GAME-02, GAME-03, GAME-07, INPUT-01, INPUT-02, INPUT-03, INPUT-04]

# Metrics
duration: ~10 min
completed: 2026-04-23
---

# Phase 06 Plan 02: Game Loop Integration Summary

**rAF game loop, three-way input handling (keyboard/mouse/touch), and physics-driven drawScene wired into SamusRunGame.tsx — samus-run is now fully playable with frame-rate-independent physics**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-23T15:30:00Z
- **Completed:** 2026-04-23T15:41:06Z
- **Tasks:** 2 (1 auto, 1 human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- Full rAF game loop integrated with delta-time normalization and tab-switch protection
- Unified input handler reads `screenRef` to distinguish idle-start vs in-game jump, covering Space, ArrowUp, click, and touch
- `drawScene` rewritten to accept optional `GamePhysicsState` — static scene preserved for idle/gameover, dynamic obstacle positions and Samus Y driven by physics during play
- Human verification confirmed: gravity, jump, obstacle scrolling, speed progression, all input methods, and no page-scroll-on-Space all work correctly on live Vercel deployment

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire rAF game loop, input handlers, and dynamic drawScene** - `dd1f846` (feat)
2. **Task 2: Verify gameplay — physics, input, and obstacle scrolling** - checkpoint approved by human

## Files Created/Modified

- `components/samus-run/SamusRunGame.tsx` - Added rAF loop (Effect B), static render with ResizeObserver (Effect A), screen-ref mirror, unified input handler, three input listeners, and physics-driven drawScene

## Decisions Made

- `screenRef` pattern used instead of adding `screen` to input listener deps — avoids re-registering listeners on every screen transition while still reading current screen state accurately
- Two separate `useEffect` hooks (one for static render, one for rAF loop) rather than a single combined effect — cleaner separation, each cleanup path is explicit and non-overlapping
- `pendingJump = true` set at rAF loop init so the START-triggering input also causes immediate jump without requiring a second keypress
- Touch event uses `{ passive: false }` option so `preventDefault()` is permitted — required to block page scroll on mobile during play

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None. The game loop and input wiring are fully functional. Score display in the HUD shows `state.score` which is only updated on GAME_OVER dispatch (obstaclesCleared count). Live score during play is not tracked (deferred to Phase 7 collision/scoring).

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. Input event whitelist (Space, ArrowUp only) verified present per T-06-04 mitigation.

## Next Phase Readiness

- Game is playable end-to-end: idle → playing → (manually trigger game over) → restart
- Collision detection absent by design — Samus passes through obstacles (Phase 7 scope)
- Live obstacle-cleared score counter not yet displayed during play (Phase 7 scope)
- Phase 7 (collision and scoring) can import `GamePhysicsState` and extend `updateGame` with AABB collision check

## Self-Check

- [x] components/samus-run/SamusRunGame.tsx exists and contains rAF loop
- [x] Task 1 commit dd1f846 exists
- [x] `npx next build` passes clean (confirmed above — all 8 static pages generated, /projects/samus-run present)

---
*Phase: 06-physics-and-input*
*Completed: 2026-04-23*
