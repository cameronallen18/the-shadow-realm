# Roadmap: the shadow realm

## Overview

Three phases deliver a live, minimal dark personal site with a working project catalog. Phase 1 proves the deploy chain before any content exists. Phase 2 builds the visual identity and landing page. Phase 3 adds the project catalog and integrates the math flash card game as the first live entry.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Scaffold Next.js project, wire GitHub to Vercel, verify live deploy
- [ ] **Phase 2: Landing Page** - Build dark visual identity, header, blurb, and favicon
- [ ] **Phase 3: Project Catalog** - Add catalog section and integrate math flash card game

## Phase Details

### Phase 1: Foundation
**Goal**: A Next.js 15 project is live on Vercel and auto-deploys on every push to main
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. `npx create-next-app` output is committed and pushed to GitHub
  2. Vercel project is linked to the GitHub repo and a deploy triggers automatically on push
  3. A live public Vercel URL loads without errors in the browser
**Plans:** 1 plan
Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 15 with .git workaround, push to GitHub, connect Vercel via dashboard, verify auto-deploy and live URL

### Phase 2: Landing Page
**Goal**: Visitors see a complete, dark-themed landing page with the site's identity
**Depends on**: Phase 1
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03, LAND-01, LAND-02, LAND-03
**Success Criteria** (what must be TRUE):
  1. Page background is dark with a cool-toned palette — no warm colors visible anywhere
  2. "the shadow realm" heading appears in lowercase as the primary page element
  3. A short blurb is present communicating this is a personal placeholder / project dumping ground
  4. A single subtle visual element breaks the empty page without animation or visual noise
  5. Favicon renders correctly in the browser tab and Geist (or equivalent) font is applied
**Plans**: TBD
**UI hint**: yes

### Phase 3: Project Catalog
**Goal**: The site has a live project catalog, and the math flash card game is playable at a dedicated route
**Depends on**: Phase 2
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04
**Success Criteria** (what must be TRUE):
  1. A project catalog section is visible on the landing page
  2. The catalog section contains a link/card pointing to the math flash card game
  3. The math flash card game is playable at `/projects/math-flashcards` without errors
  4. The game page loads the owner-provided HTML/JS correctly (via iframe or adapted integration)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete | 2026-04-13 |
| 2. Landing Page | 0/? | Not started | - |
| 3. Project Catalog | 0/? | Not started | - |
