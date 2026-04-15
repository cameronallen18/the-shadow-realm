---
phase: 03-project-catalog
plan: 01
subsystem: ui
tags: [nextjs, typescript, tailwind, react]

# Dependency graph
requires:
  - phase: 02-landing-page
    provides: "app/page.tsx with splash section, globals.css with heading-gradient and CSS vars, dark theme wiring"
provides:
  - "lib/projects.ts: typed Project interface and projects array with math-flashcards entry"
  - "Landing page catalog section rendering from projects array below splash"
  - "Internal link from catalog to /projects/math-flashcards"
affects: [03-02-project-catalog, any future plan adding project entries]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "lib/projects.ts as typed data layer for catalog — projects array, not inline JSX"
    - "projects.map rendering pattern in app/page.tsx for extensible catalog"

key-files:
  created:
    - lib/projects.ts
  modified:
    - app/page.tsx

key-decisions:
  - "Removed justify-center from <main> so page can scroll naturally with catalog below splash"
  - "Splash gets flex-1 + justify-center so it remains vertically centered in its allocated space"
  - "No hover transitions on catalog entries per D-16 (static presentation only)"
  - "Section label 'projects' uses text-xs uppercase tracking-widest for subtle minimal vibe"

patterns-established:
  - "lib/projects.ts: central typed data store for project catalog entries"
  - "Project shape: { slug, name, description, href } — href is internal path or external URL"
  - "Catalog section: <section> with <h2> label and <ul> of <li><a> entries below splash"

requirements-completed: [CAT-01, CAT-04]

# Metrics
duration: 10min
completed: 2026-04-15
---

# Phase 3 Plan 01: Project Catalog Data and Landing Page Section Summary

**Typed `lib/projects.ts` data layer and scrollable catalog section on landing page, rendering math-flashcards as first entry linked to `/projects/math-flashcards`**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-15T15:00:00Z
- **Completed:** 2026-04-15T15:10:19Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created `lib/projects.ts` with typed `Project` interface (`slug`, `name`, `description`, `href`) and a `projects` array containing the math-flashcards entry
- Updated `app/page.tsx` to render a catalog section below the splash using `projects.map`, with each entry name linked to its `href`
- Preserved the splash (heading-gradient, blurb) and adjusted layout so splash stays centered while catalog scrolls below
- TypeScript and Next.js build both pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/projects.ts and add catalog section to page.tsx** - `f3748fc` (feat)

## Files Created/Modified
- `lib/projects.ts` - Typed Project interface and projects array with math-flashcards entry
- `app/page.tsx` - Added catalog section below splash; imports and renders from lib/projects

## Decisions Made
- Removed all hover transition classes from catalog entries per D-16 (no animations, static presentation only)
- Used `flex-1` on the splash div so it absorbs remaining viewport height, keeping splash centered even as catalog appears below
- `<h2>` section label "projects" in `text-xs uppercase tracking-widest` — subtle, matches site tone without decoration

## Deviations from Plan

None - plan executed exactly as written, with one minor deviation: omitted `transition-colors duration-0` from catalog link hover state (plan included it as a way to "disable" animation, but D-16 says no transitions at all — removed entirely for strict compliance).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `lib/projects.ts` data contract is established; Plan 02 can add the math-flashcards game page at `app/projects/math-flashcards/page.tsx`
- Catalog renders cleanly with a single entry; no "sparse" appearance
- No blockers

---
*Phase: 03-project-catalog*
*Completed: 2026-04-15*
