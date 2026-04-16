# the shadow realm

## What This Is

A personal landing page and project hub deployed at a custom domain via GitHub + Vercel. The vibe is minimal and dark — a low-key placeholder that says "this is where my stuff lives" and grows a project catalog over time as things get built and shipped.

## Core Value

A live, publicly accessible home base that deploys cleanly from GitHub and can absorb new projects without turning into a mess.

## Current Milestone: v1.1 Flappy Bird

**Goal:** Add a playable Flappy Bird clone to the project catalog

**Target features:**
- Classic Flappy Bird mechanics — side-scroll, tap/click to flap, vertical pipe gaps
- Classic colorful aesthetic (blue sky, green pipes, yellow bird)
- Responsive canvas — fills the screen on any device (phone, tablet, desktop)
- Local high score via localStorage — persists across sessions, no backend
- Sound effects — flap, score point, death
- Integrated as a new entry in the project catalog at /projects/flappy-bird

## Requirements

### Validated

- Dark, minimal landing page with cool-toned color palette — no loud colors, nothing that pops (Phase 2)
- "this is the shadow realm" header (lowercase, intentional) (Phase 2)
- Short blurb: "my digital junk drawer." (Phase 2)
- A graphic or visual element — subtle, nothing busy (Phase 2)
- GitHub → Vercel CI/CD pipeline wired up and verified with a live deploy (Phase 1)
- Project catalog section ready to receive entries (Phase 3)
- Math flash card game integrated as first project entry (Phase 3)

### Active

- [ ] Flappy Bird clone playable at /projects/flappy-bird
- [ ] Classic colorful aesthetic (blue sky, green pipes, yellow bird)
- [ ] Responsive canvas fills screen on phone, tablet, desktop
- [ ] Tap/click to flap — touch-first input
- [ ] Classic pipe obstacle mechanics with randomized gap positions
- [ ] Score counter during play, high score via localStorage
- [ ] Sound effects: flap, score, death
- [ ] New catalog entry linking to /projects/flappy-bird

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
*Last updated: 2026-04-15 — Milestone v1.1 started*
