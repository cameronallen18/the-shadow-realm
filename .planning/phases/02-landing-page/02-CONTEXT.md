# Phase 2: Landing Page - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Next.js scaffold with the real site: a dark-themed landing page with visual identity, heading, blurb, and favicon. All content in `app/page.tsx` and `app/layout.tsx` is new. `app/globals.css` gets a dark color palette and cleanup. No new routes, no catalog, no interactive components.

</domain>

<decisions>
## Implementation Decisions

### Color Palette (DESIGN-01)
- **D-01:** Background: `#0a0a0a` (near-black, matches scaffold dark var)
- **D-02:** Text: `#ededed` (off-white, matches scaffold dark var)
- **D-03:** Strictly monochrome — no accent color
- **D-04:** Cool tones only — no warm tints anywhere in the palette

### Dark Mode Wiring (DESIGN-01)
- **D-05:** Hardcode dark via `className="dark"` on `<html>` in `layout.tsx` — no `next-themes`, no system preference toggle
- **D-06:** Remove the `@media (prefers-color-scheme: dark)` block from `globals.css` — replace with static dark CSS custom properties that are always active
- **D-07:** Fix the `body {}` font-family override in `globals.css` — remove the `Arial, Helvetica, sans-serif` line so Geist renders correctly (code review WR-01)

### Typography (DESIGN-02)
- **D-08:** Font: Geist Sans (already loaded in `layout.tsx` via `next/font/google`) — no additional installs
- **D-09:** Heading size: `clamp(2.5rem, 6vw, 5rem)` — large and dominant without being aggressive
- **D-10:** Heading is lowercase — "the shadow realm" (intentional, from LAND-01)

### Layout & Composition
- **D-11:** Centered splash — heading + blurb vertically and horizontally centered in the full viewport
- **D-12:** Use `min-h-screen` + flexbox/grid centering — content IS the page, no scrolling needed for core content
- **D-13:** Generous whitespace between heading and blurb

### Visual Element (LAND-03)
- **D-14:** The visual element IS the heading — a subtle cool-toned gradient or glow on the heading text
- **D-15:** Implementation: CSS `background-clip: text` gradient (cool gray → off-white, or off-white → slightly dimmer white) OR a subtle `text-shadow` glow. No separate SVG, no background texture, no extra DOM elements.
- **D-16:** Nothing animated — static gradient/glow only

### Blurb Copy (LAND-02)
- **D-17:** Claude drafts the blurb; user approves before it ships
- **D-18:** Tone: understated, personal, slightly dry. "a place for things to land" or similar — communicates personal placeholder / project dumping ground
- **D-19:** Length: 1-2 short sentences maximum. No full paragraph.

### Favicon (DESIGN-03)
- **D-20:** Letter mark "S" — white on `#0a0a0a` background, Geist font style
- **D-21:** Format: SVG favicon (better than .ico for crispness at small sizes in modern browsers)
- **D-22:** Replace the existing `app/favicon.ico` with an `app/icon.svg` (Next.js App Router supports SVG favicons natively via the `icon` file convention)

### Metadata (layout.tsx)
- **D-23:** Title: "the shadow realm" (lowercase, matching site identity)
- **D-24:** Description: something short and dry — Claude drafts, should match blurb tone
- **D-25:** No OG tags, no Twitter cards — deferred to v2

### Scaffold Cleanup
- **D-26:** `app/page.tsx` — fully replaced (all scaffold content removed)
- **D-27:** `public/` scaffold SVGs (next.svg, vercel.svg, file.svg, globe.svg, window.svg) — can be removed since page.tsx no longer references them
- **D-28:** Keep `public/` directory itself — Phase 3 uses it for math flash card game assets

### Claude's Discretion
- Exact gradient angle and color stops for the heading glow (within cool/monochrome constraint)
- Padding/margin values and exact spacing
- Whether to use `font-feature-settings` or letter-spacing on the heading for polish
- Exact blurb wording (subject to user approval)

</decisions>

<specifics>
## Specific Ideas

- The heading gradient/glow should be subtle — not a rainbow, not neon. Think: off-white center fading to a slightly cooler/dimmer edge, or a faint luminous quality. The goal is "this heading has presence" not "look at this effect."
- The page should feel like something someone made intentionally, not a template. The emptiness is the point.
- Blurb drafts to try: "a place for things to land." / "personal projects, work in progress." / "somewhere to put things."

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/phases/02-landing-page/02-CONTEXT.md` — this file (decisions locked here)
- `.planning/PROJECT.md` — vision, constraints, out-of-scope list
- `.planning/REQUIREMENTS.md` — DESIGN-01, DESIGN-02, DESIGN-03, LAND-01, LAND-02, LAND-03
- `app/layout.tsx` — current state (needs className="dark", metadata update)
- `app/globals.css` — current state (needs dark wiring, Arial fix)
- `CLAUDE.md` — stack decisions, dark theme constraints

</canonical_refs>

<deferred>
## Deferred Ideas

None raised during discussion.

</deferred>
