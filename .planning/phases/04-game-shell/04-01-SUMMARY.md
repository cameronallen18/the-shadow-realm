---
phase: 04-game-shell
plan: 01
subsystem: game-shell
tags: [game, routing, state-machine, react, next.js]
dependency_graph:
  requires: []
  provides: [samus-run-catalog-entry, samus-run-route, samus-run-game-shell]
  affects: [lib/projects.ts, app/page.tsx]
tech_stack:
  added: []
  patterns: [useReducer state machine, next/dynamic ssr:false, "use client" boundary]
key_files:
  created:
    - app/projects/samus-run/page.tsx
    - components/samus-run/SamusRunGame.tsx
  modified:
    - lib/projects.ts
decisions:
  - "Added 'use client' to app/projects/samus-run/page.tsx — next/dynamic ssr:false requires client boundary in Next.js App Router (RSC-first attempt failed at build)"
  - "SamusRunGame uses useReducer for three-state machine (idle/playing/gameover) — clean action dispatch pattern for future canvas integration"
  - "h-dvh instead of h-screen — iOS Safari viewport fix per UI-SPEC"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-17"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
requirements:
  - CAT-05
  - GAME-04
  - GAME-06
---

# Phase 04 Plan 01: Game Shell Summary

**One-liner:** Samus Run game shell with useReducer state machine (idle/playing/gameover), SSR-guarded dynamic route, and catalog entry wired to landing page.

## What Was Built

Three files establish the complete structural foundation for the Samus Run game before any canvas drawing or physics exist:

1. **`lib/projects.ts`** — Added `samus-run` entry to the projects array. The landing page catalog auto-renders it via the existing `projects.map()` loop.

2. **`app/projects/samus-run/page.tsx`** — Client boundary page using `next/dynamic` with `ssr: false` to load the game component. SSR guard prevents hydration issues with canvas/requestAnimationFrame APIs in future phases.

3. **`components/samus-run/SamusRunGame.tsx`** — Full game shell with:
   - `useReducer` state machine: `idle → playing → gameover → idle`
   - Three overlay screens: idle (title + CTA + best score), playing (score HUD top-right), gameover (final score + best score + restart)
   - Back link matching `math-flashcards` pattern exactly
   - All design constraints applied: `h-dvh`, cool-tone colors only, `font-mono tabular-nums` on scores, `py-3` touch targets

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `"use client"` to SSR-guarded route page**
- **Found during:** Task 2 verification (`npx next build`)
- **Issue:** `next/dynamic` with `ssr: false` cannot be used in Server Components in Next.js App Router — build error: "ssr: false is not allowed in Server Components"
- **Fix:** Added `"use client"` directive to `app/projects/samus-run/page.tsx`. This was explicitly anticipated in the plan as a known pitfall with a documented fix path.
- **Files modified:** `app/projects/samus-run/page.tsx`
- **Commit:** 36b2fe1

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `score: 0` shown in playing HUD | `components/samus-run/SamusRunGame.tsx` | ~73 | Score counter hardcoded to 0 — canvas game loop (Phase 5) will dispatch GAME_OVER with real score |
| `best: {state.highScore}` always 0 on first load | `components/samus-run/SamusRunGame.tsx` | ~78 | highScore not persisted to localStorage — Phase 7 (SCORE-03) will add persistence |

These stubs are intentional scaffolding. The plan goal (route + state machine + overlay screens) is fully achieved. Canvas rendering and score persistence are explicitly Phase 5 and Phase 7 work.

## Verification

- `npx next build` passes clean — `/projects/samus-run` statically pre-rendered at 1.27 kB
- `lib/projects.ts` has exactly 2 entries with `samus-run` as second entry
- `app/projects/samus-run/page.tsx` contains `ssr: false` and `import("@/components/samus-run/SamusRunGame")`
- `components/samus-run/SamusRunGame.tsx` starts with `"use client"`, uses `useReducer`, renders all three overlay screens
- No warm color hex values in any game file
- RESTART action preserves `highScore` — only sets `screen: "idle"`

## Self-Check: PASSED

- `app/projects/samus-run/page.tsx` — FOUND
- `components/samus-run/SamusRunGame.tsx` — FOUND
- `lib/projects.ts` updated with samus-run entry — FOUND
- Commit 0664cbb — FOUND
- Commit 36b2fe1 — FOUND
