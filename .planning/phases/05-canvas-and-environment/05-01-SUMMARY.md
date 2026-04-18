---
phase: 05-canvas-and-environment
plan: "01"
subsystem: canvas-rendering
tags: [canvas, dpr, resize-observer, game-shell]
dependency_graph:
  requires: [04-01]
  provides: [canvas-surface, dpr-sizing-utility, norfair-constants]
  affects: [05-02]
tech_stack:
  added: []
  patterns: [ResizeObserver-canvas-resize, DPR-aware-canvas-sizing, CSS-pixel-drawing]
key_files:
  created:
    - components/samus-run/constants.ts
    - components/samus-run/canvas/setupCanvas.ts
  modified:
    - components/samus-run/SamusRunGame.tsx
decisions:
  - "Norfair palette uses very dark reddish-browns (#0d0608–#7a2020) as thematic exception inside canvas — page UI stays cool-toned per CLAUDE.md"
  - "ResizeObserver observes parent element (not canvas itself) — more accurate for embedded component resize"
  - "useEffect (not useLayoutEffect) for canvas draw — no visible flash risk on initial black fill"
  - "Canvas smoke test fills with NORFAIR.sky (#0d0608) — Plan 02 will replace with full drawScene call"
metrics:
  duration: "2m"
  completed: "2026-04-18"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 05 Plan 01: Canvas Infrastructure Summary

**One-liner:** DPR-aware canvas element with ResizeObserver replaces Phase 4 placeholder div, backed by setupCanvas utility and Norfair/Samus/GAME constants.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create constants.ts and setupCanvas.ts | 00b3eed | components/samus-run/constants.ts, components/samus-run/canvas/setupCanvas.ts |
| 2 | Replace placeholder div with DPR-aware canvas | 69b2714 | components/samus-run/SamusRunGame.tsx |

## What Was Built

### constants.ts
Exports three constant objects:
- `NORFAIR` — 7-key Norfair cave palette (sky through groundLine), dark reddish-browns used only inside the canvas
- `SAMUS` — 5-key varia suit palette in cool silver/grey/teal tones
- `GAME` — 5-key logical dimension constants (floor/samus/obstacle ratios and pixel sizes)

### setupCanvas.ts
Pure function `setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null` that:
- Reads `window.devicePixelRatio` for retina sizing
- Gets `getBoundingClientRect()` for CSS dimensions
- Guards against zero-size canvas (returns null)
- Sets `canvas.width` and `canvas.height` to `Math.floor(cssSize * dpr)`
- Gets the 2D context and applies `ctx.scale(dpr, dpr)` and `ctx.imageSmoothingEnabled = false`
- Must be called on every resize (canvas.width/height assignment resets all context state)

### SamusRunGame.tsx changes
- Added `useRef`, `useEffect` to React import
- Added `import { setupCanvas } from "./canvas/setupCanvas"`
- Added `canvasRef = useRef<HTMLCanvasElement>(null)`
- Added `useEffect` with `render()` function that calls `setupCanvas` then fills with Norfair sky color
- `ResizeObserver` on `canvas.parentElement` re-runs `render()` on container resize
- Cleanup: `observer.disconnect()` returned from effect
- Replaced `<div className="absolute inset-0 bg-[#0a0a0a]" />` with `<canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: "pixelated" }} />`
- All three overlay screens (idle, playing, gameover), state machine, and back link unchanged

## Verification Results

- `npx next build` — passes clean, all routes static
- All acceptance criteria passed (canvasRef, setupCanvas import, ResizeObserver, observer.observe(parent), observer.disconnect(), imageRendering, placeholder removed)
- Zero-size guard in setupCanvas prevents issues before parent has layout

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `render()` in SamusRunGame.tsx fills canvas with `#0d0608` (Norfair sky). This is an intentional stub — Plan 02 will replace it with the full `drawScene()` call that renders the environment, obstacle, and Samus sprite.

## Threat Flags

None — canvas rendering is client-side visual output only. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

Files exist:
- components/samus-run/constants.ts — FOUND
- components/samus-run/canvas/setupCanvas.ts — FOUND
- components/samus-run/SamusRunGame.tsx — FOUND (modified)
- .planning/phases/05-canvas-and-environment/05-01-SUMMARY.md — FOUND

Commits exist:
- 00b3eed (Task 1: constants.ts + setupCanvas.ts) — FOUND
- 69b2714 (Task 2: SamusRunGame.tsx canvas swap) — FOUND
