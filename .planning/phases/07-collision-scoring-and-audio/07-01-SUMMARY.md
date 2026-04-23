---
phase: 07-collision-scoring-and-audio
plan: "01"
subsystem: ui
tags: [canvas, game, collision, localStorage, webapi]

# Dependency graph
requires:
  - phase: 06-physics-and-input
    provides: updateGame loop, GamePhysicsState with gameOver/obstaclesCleared/scored fields, rAF loop in SamusRunGame.tsx
provides:
  - AABB collision detection with 65% reduced hitbox that sets gameOver=true on rock wall contact
  - Per-gap scoring via obs.scored flag, obstaclesCleared incremented as Samus passes each obstacle
  - Speed progression check moved to scoring block (was in recycle block, now fires on actual gaps cleared)
  - Live score HUD via scoreDisplayRef DOM mutation each rAF frame (no React re-renders)
  - localStorage read on mount and write on GAME_OVER for high score persistence
  - "new best" label on game-over screen when score beats stored high score
affects:
  - 07-02-audio (will add sounds on gameOver, score, jump events handled in same rAF loop and input handler)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DOM ref mutation for rAF-driven HUD values (scoreDisplayRef.textContent) — avoids React re-render flood"
    - "Reducer initializer function reads localStorage so SSR guard (typeof window) is co-located with storage access"
    - "Speed progression check tied to scoring event, not obstacle recycle, for accurate pacing"

key-files:
  created: []
  modified:
    - components/samus-run/constants.ts
    - components/samus-run/gameLoop.ts
    - components/samus-run/SamusRunGame.tsx

key-decisions:
  - "COLLISION constant placed in constants.ts alongside GAME/PHYSICS — single source of tunable values"
  - "obstaclesCleared++ moved from recycle block to scoring block — recycle fires when obstacle leaves screen left, scoring fires when Samus passes right edge (these diverge at high speed)"
  - "scoreDisplayRef uses HTMLDivElement (not HTMLSpanElement) to match the wrapping div in JSX"

patterns-established:
  - "Per-frame DOM mutation pattern: useRef<HTMLElement>(null), update textContent in rAF loop"
  - "useReducer lazy initializer for localStorage hydration: (state, null, () => {...}) avoids useState + useEffect pattern"

requirements-completed: [GAME-05, SCORE-01, SCORE-02, SCORE-03]

# Metrics
duration: ~15min
completed: 2026-04-23
---

# Phase 7 Plan 01: Collision, Scoring, and High Score Summary

**AABB collision with 65% reduced hitbox ends game on rock wall contact; per-gap scoring with localStorage persistence and live DOM-mutation HUD completes the game loop**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-23T21:20:00Z
- **Completed:** 2026-04-23T21:38:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Rock wall collision sets gameOver=true via AABB check with centered 65% hitbox — ceiling and floor remain non-lethal (clamped, not lethal per D-05)
- Per-gap scoring increments obstaclesCleared when Samus's left edge passes obstacle right edge using existing obs.scored dedup flag
- Live score counter updates every rAF frame via scoreDisplayRef.textContent mutation — zero React re-renders during play
- High score loaded from localStorage on mount (lazy useReducer initializer), saved to localStorage on GAME_OVER when beaten
- "new best" label renders on game-over screen when state.score > 0 && state.score >= state.highScore

## Task Commits

Each task was committed atomically:

1. **Task 1: Add collision detection and per-gap scoring to gameLoop.ts** - `5c94f1d` (feat)
2. **Task 2: Wire live score HUD, localStorage high score, and new best label** - `332932f` (feat)

## Files Created/Modified

- `components/samus-run/constants.ts` - Added COLLISION constant (hitboxScale: 0.65, samusWidth: 28, samusHeight: 36)
- `components/samus-run/gameLoop.ts` - Added AABB collision block and per-gap scoring block between clamp steps and obstacle scroll; moved speed progression check to scoring block
- `components/samus-run/SamusRunGame.tsx` - Lazy useReducer init reads localStorage; GAME_OVER writes localStorage; scoreRef + scoreDisplayRef added; playing HUD uses ref div; game-over shows "new best" conditional

## Decisions Made

- Speed progression check moved from obstacle recycle block to scoring block — at high speed obstacles can scroll off-screen before Samus has fully passed them, so recycle-based counting would lag behind actual player progress
- `scoreDisplayRef` typed as `useRef<HTMLDivElement>` matching the wrapping div (not a span) used in JSX
- Lazy useReducer initializer `(state, null, () => {...})` used instead of useState + useEffect to avoid a flash of 0 highScore before hydration

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Collision, scoring, and localStorage persistence all wired — game is fully winnable/losable with persistent progress
- Phase 7 Plan 02 (audio) can piggyback on the same rAF loop and input handlers: jump sound in triggerJump, score sound after obs.scored = true, death sound on gameOver dispatch
- AudioContext unlock can reuse the existing input handler (first tap/click/keydown that starts the game)

---
*Phase: 07-collision-scoring-and-audio*
*Completed: 2026-04-23*
