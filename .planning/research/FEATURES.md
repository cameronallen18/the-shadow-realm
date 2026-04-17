# Feature Landscape

**Domain:** Personal developer landing page / project hub
**Researched:** 2026-04-12
**Project:** the shadow realm

---

## Table Stakes

Features visitors expect. Missing = the page feels broken or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Identity signal | Visitors need to know whose page this is, even if minimal — a name or handle | Low | "the shadow realm" header satisfies this |
| Short purpose statement | Answers "what is this place?" in one or two lines; without it visitors bounce confused | Low | Already specified in PROJECT.md as the blurb |
| Project list / catalog | If you link someone here, they expect to see what you've built | Low | Even a single entry with a link is enough |
| Outbound links to projects | A hub that doesn't link out is a dead end; this is the core value | Low | Each project card needs at least a title and a link |
| Fast load | Static pages have no excuse for being slow; a slow personal site signals carelessness | Low | SSG + Vercel handles this by default |
| Mobile-readable layout | Most link shares get opened on phones; a broken mobile layout kills credibility | Low-Med | Simple single-column layout covers this |
| Dark theme consistency | Owner has committed to it publicly; inconsistency breaks the aesthetic contract | Low | Already a constraint in PROJECT.md |

## Differentiators

Not expected, but they raise the quality ceiling. Choose selectively.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Subtle visual / graphic element | Prevents the page from feeling like a bare `<h1>` — gives it personality without noise | Low-Med | Already specified in PROJECT.md; must stay non-busy |
| Intentional lowercase typography | Small tone signal that the minimalism is deliberate, not lazy | Low | Already decided ("this is the shadow realm" header) |
| Project card metadata | Tech used, brief description, or status (e.g. "live") — gives cards enough weight to feel like real entries | Low | Even one metadata line per card adds credibility |
| Custom domain | Makes the hub feel permanent and owned, not a temp link | Low | Vercel makes this nearly zero effort |
| Favicon | A missing favicon is a minor but noticeable slop signal in browser tabs | Low | Dark/minimal icon; easy win |

## Anti-Features

Explicitly do not build these for v1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Contact form | Adds backend, spam surface, and maintenance overhead — no one needs to contact a placeholder page | Link a GitHub profile if contact is needed |
| About / bio section | Expands scope without serving the "project hub" use case; adds content maintenance burden | The blurb and identity signal are enough |
| Blog | Requires ongoing content production; a dead blog with one post from launch day is worse than no blog | Defer indefinitely or add as a separate project |
| Skill bars / tech badges grid | Common portfolio filler that communicates little — a list of logos proves nothing | Let the actual projects demonstrate skill |
| Scroll animations / transitions | Directly counter to the stated aesthetic and complexity constraints | Static layout with clean spacing is the right call |
| Light/dark mode toggle | Doubles CSS complexity; the owner explicitly wants dark only | Dark is the only mode |
| Analytics dashboard / visitor counter | Unnecessary infrastructure; owner stated no analytics required | Skip entirely |
| CMS / admin panel | No dynamic content is planned; this is a static site | Hardcode project entries; add data file if list grows |
| Social feed / GitHub activity widget | Pulls in external data, breaks on API changes, adds latency | Direct links to profiles are sufficient |
| Search | Overkill for a catalog that will have fewer than 10 entries for the foreseeable future | Plain catalog list is enough |
| Loading screen / splash | Adds perceived latency and signals the opposite of minimalism | Ship instantly |

## Feature Dependencies

```
Custom domain → Vercel project wired to GitHub repo
Project card list → At least one project entry (math flash card game)
Math flash card game entry → Decision: embed vs link-out (link-out preferred for v1)
Favicon → Brand color / icon decision
```

## MVP Recommendation

Prioritize for v1:

1. Identity header ("this is the shadow realm", lowercase)
2. Short blurb (purpose statement, understated tone)
3. Project catalog section with one live entry (math flash card game, links out)
4. Subtle visual element — one graphic or texture, nothing animated
5. Favicon (dark, minimal — easy win, avoids the slop signal)
6. GitHub → Vercel deploy pipeline wired (this is the stated primary goal of v1)

Defer:
- Project card metadata (tech stack, description) — add when second project lands
- Additional visual polish — validate deploy works first
- Any feature not on this list — the minimal surface is the point

## Sources

- PROJECT.md — owner requirements and constraints (primary source)
- [Best Web Developer Portfolio Examples from Top Developers in 2026](https://elementor.com/blog/best-web-developer-portfolio-examples/) — ecosystem survey (MEDIUM confidence)
- [21 Best Developer Portfolio Websites — Real Examples (2026)](https://colorlib.com/wp/developer-portfolios/) — feature pattern survey (MEDIUM confidence)
- [Project Hubs: A Home Base for Design Projects — 24 ways](https://24ways.org/2013/project-hubs/) — project hub conventions (MEDIUM confidence, older but patterns still apply)
- [33 Creative Minimalist Website Designs — HostAdvice](https://hostadvice.com/blog/website-design/minimalist-website-design/) — minimal site conventions (LOW confidence, single source)
