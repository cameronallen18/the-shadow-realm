# Phase 3: Project Catalog - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a project catalog section to the existing landing page and build the math flash card game as a full React app at `/projects/math-flashcards`. This phase delivers CAT-01 through CAT-04: catalog visible on landing page, game integrated as a proper React component (not iframe), and a clean data model that can absorb more projects over time.

No backend, no auth, no animations. The catalog section and game page follow the same dark/minimal aesthetic established in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Catalog Placement (CAT-01)
- **D-01:** Catalog lives as a section on the landing page — user scrolls below the splash to find it
- **D-02:** Each project entry in the catalog links to its individual project page or an external URL
- **D-03:** The landing page remains one page (no separate /projects index route needed for now)

### Project Entry Design (CAT-04)
- **D-04:** Each entry shows: project name (as a link) + one-line description
- **D-05:** No tags, no tech stack labels — keep it minimal, matching the blurb tone
- **D-06:** Projects without their own in-house page link directly to an external URL (GitHub, live demo, etc.) — no route needed for those

### Flash Cards Integration (CAT-02, CAT-03)
- **D-07:** Convert the existing HTML/JS source to proper React — no iframe, no static asset serving
- **D-08:** Owner will provide the HTML/JS source file at implementation time; executor agent should wait for it or request it before converting
- **D-09:** Full game implementation in React this phase — questions, answers, score tracking — not a stub
- **D-10:** Route: `app/projects/math-flashcards/page.tsx` — a dedicated Next.js App Router page
- **D-11:** Build with extensibility in mind: component structure should accommodate future auth + leaderboard without a rewrite (e.g., score state isolated in a component that can later accept a save callback)

### Projects Data Structure (CAT-01, CAT-04)
- **D-12:** Project list lives in `lib/projects.ts` as a typed array — not inline in page.tsx
- **D-13:** Each project entry shape: `{ slug: string, name: string, description: string, href: string }` where `href` is either an internal path (`/projects/math-flashcards`) or an external URL
- **D-14:** Only projects with real UI/logic get a folder under `app/projects/[slug]/`; external-link-only projects just get a catalog entry with an external `href`

### Style Consistency
- **D-15:** Catalog section follows Phase 2 palette: `#0a0a0a` bg, `#ededed` text, no accent colors, cool tones only
- **D-16:** No animations, no hover transitions — static presentation only (consistent with Phase 2 decisions)
- **D-17:** Geist Sans throughout — no new font introductions

### Claude's Discretion
- Exact catalog section heading label (e.g., "projects", "things i've built", etc.) — within the lowercase/minimal tone
- Spacing and layout of the catalog section relative to the splash
- Whether to use a `<section>` with a heading or just an unstyled list
- Flash card game visual design within the dark/minimal constraint
- Game mechanics beyond what the source file shows (difficulty levels, timer, etc. — only if present in source)

</decisions>

<specifics>
## Specific Notes

- The flash card game is intended for kids (arithmetic practice) — keep the game UI legible and clean even within the dark theme
- Auth + high scores is explicitly a future phase — don't implement it now, but don't architect against it either (isolated score state is sufficient preparation)
- The catalog will start with 1 project; it should look intentional with 1 entry, not sparse or broken

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/phases/03-project-catalog/03-CONTEXT.md` — this file (decisions locked here)
- `.planning/phases/02-landing-page/02-CONTEXT.md` — Phase 2 decisions (palette, typography, dark wiring)
- `.planning/PROJECT.md` — vision, constraints, out-of-scope list
- `.planning/REQUIREMENTS.md` — CAT-01, CAT-02, CAT-03, CAT-04
- `app/page.tsx` — current landing page (catalog section goes here)
- `app/layout.tsx` — layout wrapper (dark class, Geist fonts)
- `app/globals.css` — existing CSS vars and `.heading-gradient` class
- `CLAUDE.md` — stack decisions, dark theme constraints

</canonical_refs>

<deferred>
## Deferred Ideas

- **Auth + leaderboard for flash cards** — future phase. User mentioned wanting high scores eventually; noted as future scope. Build flash card component with isolated score state so this can be wired in later without a rewrite.
- **Facebook Marketplace tool** — already in PROJECT.md out-of-scope list; not ready yet

</deferred>
