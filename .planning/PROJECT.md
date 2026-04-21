# the shadow realm

## What This Is

A personal landing page and project hub deployed at a custom domain via GitHub + Vercel. The vibe is minimal and dark — a low-key placeholder that says "this is where my stuff lives" and grows a project catalog over time as things get built and shipped.

## Core Value

A live, publicly accessible home base that deploys cleanly from GitHub and can absorb new projects without turning into a mess.

## Requirements

### Validated

- [x] Dark, minimal landing page with cool-toned color palette — validated in Phase 1
- [x] GitHub → Vercel CI/CD pipeline wired up — validated in Phase 1
- [x] Project catalog section with entries — validated in Phase 3
- [x] Math flash card game as first project entry — validated in Phase 3
- [x] Samus Run game shell entry in catalog, linking to /projects/samus-run — validated in Phase 4
- [x] Samus Run canvas fills viewport on all devices, DPR-aware, Norfair environment drawn with both Samus sprite states — validated in Phase 5

### Active

- [ ] Dark, minimal landing page with cool-toned color palette — no loud colors, nothing that pops
- [ ] "this is the shadow realm" header (lowercase, intentional)
- [ ] Short blurb: placeholder / project dumping ground, understated tone
- [ ] A graphic or visual element — subtle, nothing busy
- [ ] GitHub → Vercel CI/CD pipeline wired up and verified with a live deploy
- [ ] Project catalog section (initially empty or placeholder) — ready to receive entries as projects ship
- [ ] Math flash card game integrated as first project entry (simple HTML/JS, built for kids)

### Out of Scope

- Facebook Marketplace posting tool — not ready yet; add when it is
- Backend, auth, databases — this is a static/SSG site
- Animations, scroll effects, visual complexity — counter to the vibe
- CMS or dynamic content management — overkill for now

## Context

- Stack: Next.js (chosen for extensibility as the project catalog grows — still mostly static output)
- Deployment: Vercel, connected to GitHub repo `cameronallen18/the-shadow-realm`
- Future projects to absorb: math flash card game (HTML/JS), Facebook Marketplace tool (not ready)
- The math flash card game is a standalone HTML/JS project — will be embedded or linked, not rewritten
- Owner is the only user; no auth, no multi-user, no analytics required

## Constraints

- **Design**: Dark theme, cool tones only — nothing warm, nothing bright, nothing loud
- **Complexity**: Keep it simple; this is a landing page, not an app
- **Stack**: Next.js — already decided, don't revisit
- **Deploy target**: Vercel — must wire up GitHub auto-deploy as part of v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js over plain HTML | Extensibility as project catalog grows; Vercel native | — Pending |
| Vercel for hosting | Native GitHub integration, zero-config deploys, free tier | — Pending |
| Static export / SSG | No server needed; keeps it cheap and fast | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-20 after Phase 5 (Canvas and Environment) completion*
