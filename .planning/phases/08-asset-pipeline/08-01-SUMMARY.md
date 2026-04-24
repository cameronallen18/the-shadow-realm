---
phase: 08-asset-pipeline
plan: "01"
subsystem: samus-run/sprites
tags: [sprites, asset-loading, canvas, magenta-conversion, constants]
dependency_graph:
  requires: []
  provides: [SPRITE_LAYOUT constants, spritesRef, Effect D image loader]
  affects: [components/samus-run/constants.ts, components/samus-run/SamusRunGame.tsx]
tech_stack:
  added: []
  patterns: [Promise.all image preload, getImageData magenta-to-alpha conversion, offscreen HTMLCanvasElement, useRef for asset cache]
key_files:
  modified:
    - components/samus-run/constants.ts
    - components/samus-run/SamusRunGame.tsx
decisions:
  - Used document.createElement("canvas") for offscreen canvas (not OffscreenCanvas) — iOS Safari memory budget silently blacks out OffscreenCanvas instances
  - cancelled flag guards Promise.all resolution against unmount races
  - spritesRef starts null; Phase 9 draw calls gate on samus !== null for shape fallback
metrics:
  duration: "96 seconds"
  completed: "2026-04-24T18:24:18Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 8 Plan 01: Asset Pipeline — Image Preloader Summary

One-liner: SPRITE_LAYOUT constants measured from samus.png committed, plus mount-only Effect D that loads both PNGs via Promise.all and converts magenta (#FF00FF) transparency key to alpha via getImageData/putImageData on an offscreen HTMLCanvasElement.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add SPRITE_LAYOUT constant to constants.ts | 33646ff | components/samus-run/constants.ts |
| 2 | Add spritesRef and Effect D to SamusRunGame.tsx | b3b7e65 | components/samus-run/SamusRunGame.tsx |

## What Was Built

**Task 1 — SPRITE_LAYOUT constant:**
Appended `SPRITE_LAYOUT` export to `constants.ts` with five sections (idle, spinJumpR, spinJumpL, screwAttackR, screwAttackL) and their measured sy/frames values from the 6496×4384px samus.png sprite sheet. cellSize=96, contentSize=81, contentOffset=17.

**Task 2 — spritesRef + Effect D:**
Added `spritesRef` typed as `{ samus: HTMLCanvasElement | null; bg: HTMLImageElement | null }` alongside the existing refs. Added Effect D (mount-only `useEffect(fn, [])`) that:
- Loads `/sprites/samus.png` and `/sprites/norfair_upper.png` in parallel via `Promise.all`
- Converts samus.png magenta pixels (#FF00FF) to full alpha transparency via `getImageData`/`putImageData` on an offscreen `document.createElement("canvas")`
- Stores the processed canvas in `spritesRef.current.samus` and the raw image in `spritesRef.current.bg`
- Guards against unmount races with a `cancelled` flag
- Non-fatal `.catch` logs a console warning; shape fallback Samus continues rendering

## Verification

- `npm run build` passes with zero TypeScript errors
- `grep "SPRITE_LAYOUT|spinJumpR|screwAttackR"` returns all three
- `grep "Effect D|spritesRef|convertMagentaToAlpha|Promise.all"` returns all four
- `ls public/sprites/` shows samus.png, norfair_upper.png, norfair_lower.png
- Game renders identically to Phase 7 — no visual change; spritesRef.current.samus starts null, becomes populated ~100ms after mount

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. spritesRef starts null by design; Phase 9 wires the draw calls that consume it. This is intentional infrastructure, not a stub.

## Threat Surface

No new threat surface beyond what the plan's threat model already covered (T-08-01 through T-08-03 all accepted or mitigated as specified).

## Self-Check: PASSED

- `components/samus-run/constants.ts` — FOUND (modified)
- `components/samus-run/SamusRunGame.tsx` — FOUND (modified)
- commit 33646ff — FOUND
- commit b3b7e65 — FOUND
