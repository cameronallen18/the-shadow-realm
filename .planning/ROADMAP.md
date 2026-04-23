# Roadmap: the shadow realm

## Overview

Three phases deliver a live, minimal dark personal site with a working project catalog. Phase 1 proves the deploy chain before any content exists. Phase 2 builds the visual identity and landing page. Phase 3 adds the project catalog and integrates the math flash card game as the first live entry.

Four additional phases (4-7) deliver the v1.1 Samus Run milestone: a fully playable side-scrolling browser game integrated as a new catalog entry.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Scaffold Next.js project, wire GitHub to Vercel, verify live deploy
- [x] **Phase 2: Landing Page** - Build dark visual identity, header, blurb, and favicon
- [x] **Phase 3: Project Catalog** - Add catalog section and integrate math flash card game (completed 2026-04-15)
- [ ] **Phase 4: Game Shell** - Catalog entry, route, SSR guard, and overlay screens
- [ ] **Phase 5: Canvas and Environment** - Viewport-filling canvas, retina scaling, Norfair visuals, and Samus sprites
- [x] **Phase 6: Physics and Input** - Game loop, gravity/jump mechanics, obstacle scrolling, speed progression, and unified input (completed 2026-04-23)
- [ ] **Phase 7: Collision, Scoring, and Audio** - Hit detection, score counter, localStorage high score, and all sound effects

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
**Plans:** 2 plans
Plans:
- [x] 02-01-PLAN.md — Fix globals.css (dark-always palette, remove Arial, remove media query), wire className="dark" on html, replace page.tsx with centered splash layout and heading gradient
- [x] 02-02-PLAN.md — Blurb copy checkpoint (user approves), insert approved blurb, create SVG favicon (app/icon.svg), update metadata, delete scaffold SVGs from public/

### Phase 3: Project Catalog
**Goal**: The site has a live project catalog, and the math flash card game is playable at a dedicated route
**Depends on**: Phase 2
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04
**Success Criteria** (what must be TRUE):
  1. A project catalog section is visible on the landing page
  2. The catalog section contains a link/card pointing to the math flash card game
  3. The math flash card game is playable at `/projects/math-flashcards` without errors
  4. The game page loads the owner-provided HTML/JS correctly (via iframe or adapted integration)
**Plans:** 2/2 plans complete
Plans:
- [x] 03-01-PLAN.md — Create lib/projects.ts typed data structure and render catalog section on landing page
- [x] 03-02-PLAN.md — Convert owner-provided HTML/JS flash card source to React page at /projects/math-flashcards

---

## v1.1 Samus Run

### Phase 4: Game Shell
**Goal**: A new catalog entry exists, the /projects/samus-run route loads without error on any device, and the game's three overlay screens (idle, playing HUD, game over) are wired to a state machine — all before any game logic exists
**Depends on**: Phase 3
**Requirements**: CAT-05, GAME-04, GAME-06
**Success Criteria** (what must be TRUE):
  1. A Samus Run entry appears in the project catalog on the landing page and navigates to /projects/samus-run
  2. The page loads without JavaScript errors on both desktop and a mobile device
  3. On load, an idle/start screen is visible — Samus is shown waiting for input, not a blank canvas
  4. A game-over screen exists with final score and a restart affordance (verified by triggering it from code)
**Plans:** 1 plan
Plans:
- [x] 04-01-PLAN.md — Add samus-run catalog entry, create SSR-guarded route, build state machine with idle/playing/gameover overlay screens

### Phase 5: Canvas and Environment
**Goal**: The canvas fills the viewport correctly on every target device and the complete Norfair visual world is drawn — background, rock walls, and both Samus sprite states — before any physics run
**Depends on**: Phase 4
**Requirements**: DISPLAY-01, DISPLAY-02, DISPLAY-03, VIS-01, VIS-02, VIS-03
**Success Criteria** (what must be TRUE):
  1. Canvas fills the full screen on a phone, tablet, and desktop with no overflow or letterboxing
  2. Sprite and environment art are crisp on a retina/high-dpr screen — no blurring or pixelation visible
  3. Norfair environment is recognizable: dark cave background, lava detail, reddish rock wall obstacle shapes
  4. Samus varia suit sprite is visible in the idle/waiting position
  5. Samus space jump sprite appears when the jump state is forced on (verified by toggling a flag)
**Plans:** 2 plans
Plans:
- [x] 05-01-PLAN.md — Create constants and setupCanvas utility, replace placeholder div with DPR-aware canvas, wire ResizeObserver
- [x] 05-02-PLAN.md — Create drawing modules (environment, Samus, obstacles), wire drawScene with DEBUG_FORCE_JUMP, visual verification checkpoint

### Phase 6: Physics and Input
**Goal**: Samus moves under gravity, responds to all three input methods, obstacles scroll and speed up, and the game transitions cleanly between idle and playing states
**Depends on**: Phase 5
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-07, INPUT-01, INPUT-02, INPUT-03, INPUT-04
**Success Criteria** (what must be TRUE):
  1. Samus falls under gravity and jumps upward when the player taps, clicks, or presses Spacebar/arrow key
  2. Rock wall obstacles scroll right-to-left continuously with randomized gap heights on each new pair
  3. Scroll speed noticeably increases after approximately every 10 obstacles cleared
  4. The first valid input (any of: tap, click, Spacebar, arrow key) transitions the screen from idle to active play
  5. Physics run at consistent speed on both a 60Hz laptop and a 120Hz iPad (delta-time verified)
**Plans:** 2/2 plans complete
Plans:
- [x] 06-01-PLAN.md — Create PHYSICS constants and pure gameLoop.ts module (types, gravity, jump, obstacle scrolling, speed progression)
- [x] 06-02-PLAN.md — Wire rAF game loop, unified input handlers, and dynamic drawScene into SamusRunGame.tsx; visual gameplay verification

### Phase 7: Collision, Scoring, and Audio
**Goal**: The game is fully winnable and losable — Samus scores points for clearing gaps, dies on collision, the high score persists, and all sound effects fire on the correct events
**Depends on**: Phase 6
**Requirements**: GAME-05, SCORE-01, SCORE-02, SCORE-03, AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04
**Success Criteria** (what must be TRUE):
  1. Touching a rock wall or the top/bottom boundary ends the game and shows the game-over screen
  2. Score increments by 1 each time Samus clears an obstacle gap, and the current score is visible during play
  3. The highest score ever achieved persists after a page reload and is shown on idle and game-over screens
  4. A jump sound, a score sound, and a death sound each play at the correct moment
  5. All sounds play on iOS Safari after the first tap (AudioContext unlocked on first user gesture)
**Plans**: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete | 2026-04-13 |
| 2. Landing Page | 2/2 | Complete | 2026-04-14 |
| 3. Project Catalog | 2/2 | Complete | 2026-04-15 |
| 4. Game Shell | 1/1 | Complete | 2026-04-17 |
| 5. Canvas and Environment | 0/2 | Planning complete | - |
| 6. Physics and Input | 2/2 | Complete   | 2026-04-23 |
| 7. Collision, Scoring, and Audio | 0/? | Not started | - |
