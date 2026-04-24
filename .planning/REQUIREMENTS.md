# Requirements: the shadow realm

**Defined:** 2026-04-12
**Core Value:** A live, publicly accessible home base that deploys cleanly from GitHub and can absorb new projects without turning into a mess.

## v1 Requirements (complete)

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
- [x] **CAT-03**: Math flash card game is playable at a dedicated route (e.g. /projects/math-flashcards)
- [x] **CAT-04**: The project catalog section links to the math flash card game page

## v1.1 Requirements (complete)

### Samus Run Game

- [x] **GAME-01**: Samus Run game shell entry in catalog, linking to /projects/samus-run
- [x] **GAME-02**: Canvas fills viewport on all devices, DPR-aware
- [x] **GAME-03**: Norfair environment drawn with both Samus sprite states
- [x] **GAME-04**: Samus moves under gravity, responds to keyboard/mouse/touch input
- [x] **GAME-05**: Obstacles scroll with randomized gaps and speed progression
- [x] **SCORE-01**: Samus scores points for clearing gaps
- [x] **SCORE-02**: Live score HUD visible during play
- [x] **SCORE-03**: High score persists in localStorage across sessions
- [x] **AUDIO-01**: Jump sound plays on each jump input
- [x] **AUDIO-02**: Score sound plays when a gap is cleared
- [x] **AUDIO-03**: Death sound plays on collision
- [x] **AUDIO-04**: iOS Safari AudioContext unlocked on first user gesture

## v1.2 Requirements

### Sprite Assets

- [ ] **ASSET-01**: Samus sprite sheet PNG committed to `public/sprites/` and served from same origin
- [ ] **ASSET-02**: Norfair background/tileset PNG committed to `public/sprites/` and served from same origin

### Sprite Animation

- [ ] **ANIM-01**: Samus displays the correct idle frame when standing on the floor
- [ ] **ANIM-02**: Samus displays a looping spin jump animation while airborne (frame-rate independent via dt accumulator)
- [ ] **ANIM-03**: Screw attack is visually distinct from normal jump (spin frames + visual overlay)
- [ ] **ANIM-04**: Shape-based sprite fallback renders when PNGs are not yet loaded

### Environment

- [ ] **ENV-01**: Norfair background tiles horizontally scroll at a fixed speed independent of obstacle speed multiplier
- [ ] **ENV-02**: Background scroll is seamless (no visible seam at tile wrap boundary)

### Quality

- [ ] **QUAL-01**: Sprites render at pixel-perfect nearest-neighbor scaling (no bilinear blur)
- [ ] **QUAL-02**: Hitbox constants updated to match real sprite body dimensions after sprite swap

## Future Requirements

### Infrastructure

- **INFRA-V2-01**: Custom domain is connected to the Vercel deployment

### Projects

- **PROJ-V2-01**: Facebook Marketplace posting tool integrated as a project entry (not ready yet)
- **PROJ-V2-02**: Additional projects added to catalog as they're built

### Landing Page

- **LAND-V2-01**: Project detail pages with descriptions (currently just link-outs)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend / API routes | No server-side logic needed; static site |
| Auth / login | Personal site, no multi-user requirement |
| CMS / content management | Overkill; lib/projects.ts array is sufficient |
| Blog | Not requested; counter to the minimal vibe |
| Contact form | Not requested |
| Animations / scroll effects | Explicitly counter to the design brief |
| Analytics | Not requested |
| Social meta tags / OG images | Nice-to-have; defer to future |
| Brinstar / Maridia environments | Incompatible with existing warm-dark palette; require full redesign |
| Running animation | Samus does not run in this game; irrelevant |
| Idle breathing animation | Not present in Super Metroid ROM data |
| Obstacle column texturing | Cosmetic only; lowest priority, defer to v1.3+ |
| New npm packages | Zero new packages constraint; Canvas 2D is sufficient |

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
| GAME-01 | Phase 4 | Complete |
| GAME-02 | Phase 5 | Complete |
| GAME-03 | Phase 5 | Complete |
| GAME-04 | Phase 6 | Complete |
| GAME-05 | Phase 6 | Complete |
| SCORE-01 | Phase 7 | Complete |
| SCORE-02 | Phase 7 | Complete |
| SCORE-03 | Phase 7 | Complete |
| AUDIO-01 | Phase 7 | Complete |
| AUDIO-02 | Phase 7 | Complete |
| AUDIO-03 | Phase 7 | Complete |
| AUDIO-04 | Phase 7 | Complete |
| ASSET-01 | Phase 8 | Pending |
| ASSET-02 | Phase 8 | Pending |
| ANIM-01 | Phase 9 | Pending |
| ANIM-02 | Phase 9 | Pending |
| ANIM-03 | Phase 9 | Pending |
| ANIM-04 | Phase 9 | Pending |
| ENV-01 | Phase 10 | Pending |
| ENV-02 | Phase 10 | Pending |
| QUAL-01 | Phase 9 | Pending |
| QUAL-02 | Phase 9 | Pending |

**Coverage:**
- v1.2 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-24 — v1.2 Pixel Perfect requirements added*
