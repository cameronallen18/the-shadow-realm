---
phase: 03-project-catalog
plan: 02
subsystem: ui
tags: [nextjs, typescript, tailwind, react, game]

# Dependency graph
requires:
  - phase: 03-project-catalog
    plan: 01
    provides: "lib/projects.ts with math-flashcards entry linked to /projects/math-flashcards"
  - phase: 02-landing-page
    provides: "app/layout.tsx dark class, globals.css #0a0a0a bg / #ededed text"
provides:
  - "app/projects/math-flashcards/page.tsx: fully playable math flash card game"
  - "ScoreTracker component with extensible onSave prop (D-11 hook for future leaderboard)"
affects: [any future plan wiring leaderboard or auth to onSave callback]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "use client page with multiple components in one file (GameBoard pattern)"
    - "generateQuestion as pure function outside component for testability"
    - "useRef for timer interval and question start time (avoids stale closure)"
    - "ScoreTrackerProps.onSave optional callback pattern for future auth hook"

key-files:
  created:
    - app/projects/math-flashcards/page.tsx
  modified: []

key-decisions:
  - "All CSS keyframe animations inlined via <style> tag — Tailwind has no built-in for custom keyframes without config; inline style tag is the correct zero-config approach"
  - "Timer ring color uses cool tones (#ededed → #9ba3ad → #c8cdd4) instead of source's warm red/orange — faithful to mechanics, adapted to site's no-warm-color constraint"
  - "Streak badge shows count (e.g. '5 STREAK') without fire emoji — matches dark minimal aesthetic"
  - "Feedback shows 'FAST' / 'CORRECT' / '✗ {answer}' — faithful to source semantics, no green/red color coding"
  - "source file deleted post-conversion, not committed to repo"

patterns-established:
  - "ScoreTracker interface: { correct, total, onSave? } — extensibility pattern for future leaderboard"
  - "questionsRef pattern: useRef mirrors questions state to avoid stale closures in callbacks"

requirements-completed: [CAT-02, CAT-03]

# Metrics
duration: 20min
completed: 2026-04-15
---

# Phase 3 Plan 02: Math Flash Card Game React Page Summary

**Full faithful conversion of HTML/JS Math Blitz game to React at `/projects/math-flashcards` — numpad UI, timer ring, streak tracking, results table, all four arithmetic operations, endless mode**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-15T15:10:00Z
- **Completed:** 2026-04-15T15:30:00Z
- **Tasks:** 1 (Task 1 was checkpoint:human-action — owner supplied source; Task 2 executed)
- **Files created:** 1

## Accomplishments

- Read the full original HTML/JS source (`flashcards-source.html`) and extracted all game mechanics before writing React
- Created `app/projects/math-flashcards/page.tsx` with `"use client"` directive
- `generateQuestion()` pure function handles all four operations: multiply, divide, add, subtract; division always produces clean whole-number answers
- Full game loop: start screen → quiz screen → results screen, with Settings/Again buttons on results
- Numpad UI (3×4 grid: 7–9, 4–6, 1–3, clear/0/submit) with physical keyboard support (0–9, Backspace, Enter)
- Timer ring SVG: drains over 15s in finite mode (ring color shifts cool as time runs out); pulse animation in endless mode
- Progress bar: fills left-to-right in finite mode; scrolling shimmer in endless mode
- Streak badge appears at 3+ consecutive correct answers
- Per-question feedback: "FAST" (< 3s), "CORRECT", or "✗ {correct answer}"
- Results screen: correct/total, avg/fastest/slowest times, per-question table with fastest row highlighted
- `ScoreTracker` component with `onSave?: (correct, total) => void` prop — satisfies D-11 extensibility hook
- Dark theme throughout: `#0a0a0a` bg, `#ededed` text, `#c8cdd4` / `#9ba3ad` accents — no warm colors
- Back navigation (`← the shadow realm`) at top-left fixed position
- TypeScript compiles clean (`npx tsc --noEmit` exits 0)
- Source file deleted post-conversion

## Task Commits

1. **Task 2: Build math flash card game as React page** — `bd8b183` (feat)

## Files Created/Modified

- `app/projects/math-flashcards/page.tsx` — 867-line playable React flash card game

## Decisions Made

- Timer ring color adapted from source (warm orange/red) to cool tones (#9ba3ad → #c8cdd4 → #ededed) per site no-warm-color constraint (D-04)
- Inlined keyframe CSS via `<style>` tag — Tailwind v4 CSS-first config requires `@keyframes` in CSS file or inline; no tailwind.config.js exists to add custom animations
- `questionsRef` mirrors `questions` state to give `submitAnswer` callback stable access without stale closure
- Removed `duration-300` from progress bar fill (strict compliance with D-16 / acceptance criteria requiring duration-0 only)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale closure on submitAnswer referencing questions state**
- **Found during:** Task 2 implementation
- **Issue:** `submitAnswer` callback in useCallback would capture the initial empty `questions` array, causing it to reference stale state when reading `questions[currentIdx]`
- **Fix:** Added `questionsRef = useRef<Question[]>()` that mirrors `questions` state, read inside the callback via `questionsRef.current`
- **Files modified:** `app/projects/math-flashcards/page.tsx`
- **Commit:** bd8b183 (included in task commit)

**2. [Rule 2 - Adaptation] Warm colors removed from timer ring**
- **Found during:** Task 2 Step 6 (no-warm-colors check)
- **Issue:** Source used `#ff4747` (red) and `#ffaa47` (orange) for timer ring urgency states
- **Fix:** Replaced with `#9ba3ad` and `#c8cdd4` — cool silver tones that still convey progression without warm hues
- **Files modified:** `app/projects/math-flashcards/page.tsx`
- **Commit:** bd8b183 (included in task commit)

## Known Stubs

None — game is fully wired. `onSave` prop on ScoreTracker is intentionally unimplemented (future auth hook per D-11); this is documented behavior, not a stub.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 3 is complete: project catalog (03-01) + game page (03-02) both shipped
- `/projects/math-flashcards` is playable and linked from the landing page catalog
- `ScoreTracker.onSave` prop ready for leaderboard integration if a future phase adds auth
- No blockers

---
*Phase: 03-project-catalog*
*Completed: 2026-04-15*
