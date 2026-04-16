# Requirements: the shadow realm

**Defined:** 2026-04-12
**Core Value:** A live, publicly accessible home base that deploys cleanly from GitHub and can absorb new projects without turning into a mess.

## v1.0 Requirements (Completed)

### Infrastructure

- [x] **INFRA-01**: Next.js 15 App Router project is scaffolded with TypeScript and Tailwind CSS v4
- [x] **INFRA-02**: GitHub repository connects to Vercel and auto-deploys on push to main
- [x] **INFRA-03**: Live Vercel URL is verified and accessible after first deploy

### Design

- [x] **DESIGN-01**: Site uses a permanently dark background with cool-toned color palette (no warm tones, no loud colors)
- [x] **DESIGN-02**: Typography is set with a clean sans-serif font (Geist or equivalent)
- [x] **DESIGN-03**: Favicon is present and renders correctly in browser tabs

### Landing Page

- [x] **LAND-01**: Page displays "the shadow realm" as the primary heading (lowercase, intentional)
- [x] **LAND-02**: A short blurb communicates this is a personal placeholder / project dumping ground, understated in tone
- [x] **LAND-03**: A single subtle visual or graphic element is present — not busy, not animated, just breaks the empty page

### Project Catalog

- [x] **CAT-01**: A project catalog section is visible on the landing page
- [x] **CAT-02**: Math flash card game code is refactored and integrated into the project (provided by owner)
- [x] **CAT-03**: Math flash card game is playable at a dedicated route (/projects/math-flashcards)
- [x] **CAT-04**: The project catalog section links to the math flash card game page

## v1.1 Requirements — Samus Run

### Game Mechanics

- [ ] **GAME-01**: User can play a side-scrolling Norfair escape where Samus clears rock wall gaps
- [ ] **GAME-02**: Samus falls with gravity; input applies upward space jump impulse
- [ ] **GAME-03**: Rock wall obstacles scroll right-to-left with randomized gap heights
- [ ] **GAME-04**: Game opens in idle state — Samus bobs in varia suit, waiting for first input
- [ ] **GAME-05**: First input starts the game; collision with walls or bounds triggers game over
- [ ] **GAME-06**: Game over screen shows final score and restart option
- [ ] **GAME-07**: Scroll speed increases noticeably each ~10 obstacles cleared

### Score

- [ ] **SCORE-01**: Score increments each time Samus clears an obstacle gap
- [ ] **SCORE-02**: Current score is visible during play
- [ ] **SCORE-03**: High score persists via localStorage and shows on idle/game over screens

### Input

- [ ] **INPUT-01**: Tap (touchstart) triggers space jump — mobile/tablet first-class
- [ ] **INPUT-02**: Mouse click triggers space jump — desktop
- [ ] **INPUT-03**: Spacebar and arrow keys trigger space jump — keyboard
- [ ] **INPUT-04**: First valid input transitions game from idle → playing

### Display

- [ ] **DISPLAY-01**: Canvas fills viewport on phone, tablet, and desktop (100dvh, responsive)
- [ ] **DISPLAY-02**: Canvas renders at device pixel ratio — no blur on retina/iPad screens
- [ ] **DISPLAY-03**: Norfair environment: dark cave background, lava detail, reddish rock wall obstacles

### Visuals

- [ ] **VIS-01**: Samus varia suit sprite shown during idle state
- [ ] **VIS-02**: Samus space jump sprite shown while airborne/jumping
- [ ] **VIS-03**: Rock wall obstacles styled as reddish Norfair rock

### Audio

- [ ] **AUDIO-01**: Jump sound plays on each space jump input
- [ ] **AUDIO-02**: Score sound plays when clearing an obstacle
- [ ] **AUDIO-03**: Death/hit sound plays on game over
- [ ] **AUDIO-04**: Audio unlocks on first user gesture (iOS AudioContext compliance)

### Catalog

- [ ] **CAT-05**: New catalog entry on landing page links to /projects/samus-run

## Future Requirements

- Pause/resume functionality
- Background music (Norfair theme)
- Medal tiers for score milestones
- Custom domain connected to Vercel deployment (INFRA-V2-01)
- Facebook Marketplace posting tool integrated as project entry (PROJ-V2-01)
- Additional projects added to catalog as they're built (PROJ-V2-02)
- Project detail pages with descriptions (LAND-V2-01)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Leaderboard / backend scores | localStorage only; no server, no auth |
| Multiple game modes or difficulty settings | Keep it simple |
| Additional character skins or environments | Future milestone |
| Backend / API routes | No server-side logic needed; static site |
| Auth / login | Personal site, no multi-user requirement |
| CMS / content management | Overkill; lib/projects.ts array is sufficient |
| Blog | Not requested; counter to the minimal vibe |
| Animations / scroll effects on landing page | Explicitly counter to the design brief |
| Analytics | Not requested |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| DESIGN-01 | Phase 2 | Complete |
| DESIGN-02 | Phase 2 | Complete |
| DESIGN-03 | Phase 2 | Complete |
| LAND-01 | Phase 2 | Complete |
| LAND-02 | Phase 2 | Complete |
| LAND-03 | Phase 2 | Complete |
| CAT-01 | Phase 3 | Complete |
| CAT-02 | Phase 3 | Complete |
| CAT-03 | Phase 3 | Complete |
| CAT-04 | Phase 3 | Complete |
| CAT-05 | Phase 4 | Pending |
| GAME-04 | Phase 4 | Pending |
| GAME-06 | Phase 4 | Pending |
| DISPLAY-01 | Phase 5 | Pending |
| DISPLAY-02 | Phase 5 | Pending |
| DISPLAY-03 | Phase 5 | Pending |
| VIS-01 | Phase 5 | Pending |
| VIS-02 | Phase 5 | Pending |
| VIS-03 | Phase 5 | Pending |
| GAME-01 | Phase 6 | Pending |
| GAME-02 | Phase 6 | Pending |
| GAME-03 | Phase 6 | Pending |
| GAME-07 | Phase 6 | Pending |
| INPUT-01 | Phase 6 | Pending |
| INPUT-02 | Phase 6 | Pending |
| INPUT-03 | Phase 6 | Pending |
| INPUT-04 | Phase 6 | Pending |
| GAME-05 | Phase 7 | Pending |
| SCORE-01 | Phase 7 | Pending |
| SCORE-02 | Phase 7 | Pending |
| SCORE-03 | Phase 7 | Pending |
| AUDIO-01 | Phase 7 | Pending |
| AUDIO-02 | Phase 7 | Pending |
| AUDIO-03 | Phase 7 | Pending |
| AUDIO-04 | Phase 7 | Pending |

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-15 — v1.1 Samus Run phase assignments added*
