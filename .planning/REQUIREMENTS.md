# Requirements: the shadow realm

**Defined:** 2026-04-12
**Core Value:** A live, publicly accessible home base that deploys cleanly from GitHub and can absorb new projects without turning into a mess.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: Next.js 15 App Router project is scaffolded with TypeScript and Tailwind CSS v4
- [ ] **INFRA-02**: GitHub repository connects to Vercel and auto-deploys on push to main
- [ ] **INFRA-03**: Live Vercel URL is verified and accessible after first deploy

### Design

- [ ] **DESIGN-01**: Site uses a permanently dark background with cool-toned color palette (no warm tones, no loud colors)
- [ ] **DESIGN-02**: Typography is set with a clean sans-serif font (Geist or equivalent)
- [ ] **DESIGN-03**: Favicon is present and renders correctly in browser tabs

### Landing Page

- [ ] **LAND-01**: Page displays "the shadow realm" as the primary heading (lowercase, intentional)
- [ ] **LAND-02**: A short blurb communicates this is a personal placeholder / project dumping ground, understated in tone
- [ ] **LAND-03**: A single subtle visual or graphic element is present — not busy, not animated, just breaks the empty page

### Project Catalog

- [ ] **CAT-01**: A project catalog section is visible on the landing page
- [x] **CAT-02**: Math flash card game code is refactored and integrated into the project (provided by owner)
- [x] **CAT-03**: Math flash card game is playable at a dedicated route (e.g. /projects/math-flashcards)
- [ ] **CAT-04**: The project catalog section links to the math flash card game page

## v2 Requirements

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
| Analytics | Not requested for v1 |
| Social meta tags / OG images | Nice-to-have; defer to v2 |
| `output: 'export'` static export | Vercel native adapter handles SSG; this flag would break image optimization |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| DESIGN-01 | Phase 2 | Pending |
| DESIGN-02 | Phase 2 | Pending |
| DESIGN-03 | Phase 2 | Pending |
| LAND-01 | Phase 2 | Pending |
| LAND-02 | Phase 2 | Pending |
| LAND-03 | Phase 2 | Pending |
| CAT-01 | Phase 3 | Pending |
| CAT-02 | Phase 3 | Complete |
| CAT-03 | Phase 3 | Complete |
| CAT-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after roadmap creation*
