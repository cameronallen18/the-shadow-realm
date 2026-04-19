---
phase: 05-canvas-and-environment
plan: 02
subsystem: samus-run/canvas
tags: [canvas, sprites, norfair, drawing-modules, visual]
dependency_graph:
  requires: ["05-01"]
  provides: ["drawEnvironment", "drawSamusIdle", "drawSamusJump", "drawRockWall", "drawScene"]
  affects: ["components/samus-run/SamusRunGame.tsx"]
tech_stack:
  added: []
  patterns:
    - "Pure Canvas 2D drawing functions (no image assets)"
    - "DEBUG_FORCE_JUMP dev flag for sprite testing"
    - "drawScene orchestrator pattern wired into useEffect + ResizeObserver"
key_files:
  created:
    - components/samus-run/canvas/drawEnvironment.ts
    - components/samus-run/canvas/drawSamus.ts
    - components/samus-run/canvas/drawObstacleShape.ts
  modified:
    - components/samus-run/SamusRunGame.tsx
decisions:
  - "All sprite drawing done with Canvas 2D primitives — no image assets, no sprite sheets"
  - "DEBUG_FORCE_JUMP constant (false by default) allows idle screen to show jump pose for visual QA"
  - "drawScene is a pure module-level function, not inside the React component"
metrics:
  duration: "~30 min"
  completed: "2026-04-18"
  tasks_completed: 3
  files_created: 3
  files_modified: 1
requirements:
  - VIS-01
  - VIS-02
  - VIS-03
---

# Phase 05 Plan 02: Norfair Visual World — Drawing Modules Summary

Norfair cave environment and Samus varia suit sprites drawn entirely with Canvas 2D primitives using the NORFAIR and SAMUS color palettes from constants.ts, wired into SamusRunGame.tsx via a drawScene orchestrator.

## What Was Built

Three pure drawing modules and an updated SamusRunGame.tsx that replaced the Phase 4 placeholder with a fully drawn Norfair scene:

**drawEnvironment.ts** — Draws the cave background in layers: full-canvas sky fill (#0d0608), midground cave wall band (top 30%), lava floor (bottom 15%), lava shimmer line with highlight stroke, ground boundary line, and ceiling stalactites via a private `drawCeilingDetail` helper that places varying-height downward triangles along the top edge.

**drawSamus.ts** — Two sprite functions:
- `drawSamusIdle`: Standing varia suit pose with body, shoulder pads, circular helmet via `ctx.arc`, visor slit, arm cannon, and two leg rectangles
- `drawSamusJump`: Curled/airborne pose with a `ctx.save/rotate(-0.15)/ctx.restore` forward lean on the torso, extended arm cannon, and legs tucked

**drawObstacleShape.ts** — `drawRockWall` draws a top column (ceiling to gapTop) and bottom column (gapBottom to floor) with 4px edge highlights on each opening using NORFAIR.rockEdge.

**SamusRunGame.tsx** — Updated with:
- `DEBUG_FORCE_JUMP = false` constant at top of file
- Imports for all three drawing modules and GAME constants
- `drawScene(ctx, screen, width, height)` module-level function that orchestrates environment, obstacle, and Samus sprite (idle vs jump based on screen state or debug flag)
- useEffect render function now calls `drawScene` instead of the old temporary fill

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Create drawing modules (drawEnvironment.ts, drawSamus.ts, drawObstacleShape.ts) | 090865a |
| 2 | Wire drawScene into SamusRunGame.tsx with DEBUG_FORCE_JUMP | 297714c |
| 3 | Visual verification of Norfair scene and Samus sprites (human-verify) | — (checkpoint approved) |

## Decisions Made

1. **Pure Canvas 2D primitives only** — No image assets or sprite sheets. All visuals built from `fillRect`, `arc`, `beginPath/fill/stroke`, and `save/rotate/restore`. This keeps the bundle clean and avoids asset pipeline complexity for a prototype-stage game.

2. **DEBUG_FORCE_JUMP flag** — A module-level boolean constant (not a React state or env var) that forces the jump sprite on the idle screen. Simple to toggle during visual QA, compiles away at the constant value, no runtime overhead.

3. **drawScene as module-level pure function** — Not defined inside the React component. Keeps the function stable across renders, avoids re-creation on every state change, and makes it trivially testable in isolation.

## Deviations from Plan

None — plan executed exactly as written. All three drawing modules match the specified signatures and palette imports. The drawScene wiring matches the specified pattern. Build passed clean.

## Known Stubs

None. All drawing functions are fully implemented with real pixel output. The obstacle position is static (not game-physics-driven yet — that is Phase 05 plan 03+), but this is intentional: the plan explicitly calls it a "static obstacle placeholder" and the visual verification confirmed it renders correctly.

## Threat Surface Scan

No new trust boundaries introduced. All drawing functions are pure Canvas 2D output with no user input processing, no network requests, and no data storage. The `DEBUG_FORCE_JUMP` constant is a compiled-in boolean that exposes no secrets — consistent with T-05-03 in the plan's threat register (accepted, no mitigation needed).

## Self-Check

### Files exist

- [x] `components/samus-run/canvas/drawEnvironment.ts` — confirmed present (read during execution)
- [x] `components/samus-run/canvas/drawSamus.ts` — confirmed present (read during execution)
- [x] `components/samus-run/canvas/drawObstacleShape.ts` — confirmed present (read during execution)
- [x] `components/samus-run/SamusRunGame.tsx` — confirmed updated with drawScene and DEBUG_FORCE_JUMP

### Commits exist

- [x] 090865a — `feat(05-02): create drawing modules for environment, Samus, and obstacles`
- [x] 297714c — `feat(05-02): wire drawScene into SamusRunGame with DEBUG_FORCE_JUMP`

### Visual verification

- [x] User visually confirmed Norfair scene renders correctly (checkpoint approved)

## Self-Check: PASSED
