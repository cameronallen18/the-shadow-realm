---
phase: 02-landing-page
plan: 01
subsystem: ui
tags: [nextjs, tailwind, css, dark-mode, typography, geist]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Next.js 15 scaffold with Tailwind v4, Geist fonts loaded in layout.tsx
provides:
  - Static dark CSS vars always active (#0a0a0a bg, #ededed fg)
  - .heading-gradient component class with clamp sizing and cool diagonal gradient
  - className="dark" hardcoded on html element (no next-themes)
  - Centered splash layout with "the shadow realm" heading and placeholder blurb
affects: [02-02-blurb-metadata, 02-03-favicon]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dark-always via className='dark' on html — no media query, no next-themes"
    - "CSS background-clip:text gradient for heading visual identity"
    - "clamp() for fluid heading size without JS"

key-files:
  created: []
  modified:
    - app/globals.css
    - app/layout.tsx
    - app/page.tsx

key-decisions:
  - "Dark mode hardcoded via className='dark' — no next-themes, no system preference toggle (D-05)"
  - "Heading gradient uses off-white (#ededed) to cool silver (#9ba3ad) at 135deg — monochrome, static, no animation (D-14, D-15, D-16)"
  - "Blurb text is placeholder 'a place for things to land.' — finalized in plan 02-02 after checkpoint (D-17)"
  - ".heading-gradient added to globals.css alongside body changes — single file, no separate component CSS"

patterns-established:
  - "CSS custom property mapping: :root vars → @theme inline → Tailwind tokens"
  - "Component-level CSS classes (e.g. .heading-gradient) added directly to globals.css"

requirements-completed: [DESIGN-01, DESIGN-02, LAND-01, LAND-03]

# Metrics
duration: 8min
completed: 2026-04-13
---

# Phase 2 Plan 01: Dark Foundation and Landing Page Shell Summary

**Permanent dark theme via static CSS vars and className="dark", centered splash with cool-gradient heading using background-clip:text**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-13T00:00:00Z
- **Completed:** 2026-04-13T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced scaffold light/dark CSS with static dark-always vars (#0a0a0a background, #ededed foreground)
- Removed Arial font override so Geist Sans renders correctly via Tailwind @theme inline token
- Wired className="dark" on html element with suppressHydrationWarning
- Built centered splash layout replacing all scaffold content
- Added .heading-gradient with clamp fluid sizing and cool diagonal gradient (135deg, #ededed → #c8cdd4 → #9ba3ad)
- Build passes cleanly: 0 TypeScript errors, static page pre-rendered

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix globals.css — dark-always palette, remove Arial, remove media query** - `319daff` (feat)
2. **Task 2: Wire dark class on html and build the landing page** - `6727bcf` (feat)

## Files Created/Modified
- `app/globals.css` - Static dark CSS vars, no media query, no Arial, added .heading-gradient
- `app/layout.tsx` - Added className="dark" suppressHydrationWarning to html element
- `app/page.tsx` - Full replacement: centered splash with h1 heading and placeholder blurb

## Decisions Made
- Hardcoded dark via className="dark" per D-05 — no next-themes package, no system toggle
- Heading gradient: off-white (#ededed) fading to cool silver-gray (#9ba3ad) at 135deg — subtle depth, monochrome constraint maintained
- Blurb copy "a place for things to land." is a placeholder comment-marked for plan 02-02 approval
- .heading-gradient placed in globals.css (not a separate file) — keeps CSS co-located with body styles

## Deviations from Plan

None - plan executed exactly as written. The .heading-gradient class was included in Task 2 per the plan's action spec (appended to globals.css after the body block).

## Known Stubs

- **app/page.tsx line 9** — Blurb text "a place for things to land." is a placeholder. Comment in file marks it explicitly. Plan 02-02 (after checkpoint) will finalize this copy with user approval per D-17.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dark visual foundation is live: CSS vars, font rendering, className="dark" all wired
- Landing page shell is deployable — heading displays with gradient, placeholder blurb in place
- Plan 02-02 can proceed: needs user approval of blurb copy, then metadata + favicon updates
- No blockers

---
*Phase: 02-landing-page*
*Completed: 2026-04-13*

## Self-Check: PASSED

- app/globals.css: FOUND
- app/layout.tsx: FOUND
- app/page.tsx: FOUND
- .planning/phases/02-landing-page/02-01-SUMMARY.md: FOUND
- Commit 319daff: FOUND
- Commit 6727bcf: FOUND
