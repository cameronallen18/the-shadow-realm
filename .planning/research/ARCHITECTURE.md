# Architecture Patterns

**Domain:** Next.js personal site / project catalog hub
**Researched:** 2026-04-12
**Confidence:** HIGH — all key decisions verified against official Next.js docs, Vercel docs, and Tailwind CSS docs

---

## Recommended Architecture

A minimal App Router Next.js site deployed natively on Vercel (no `output: 'export'` needed), with standalone HTML/JS mini-projects served as static files from `public/projects/<slug>/` and embedded via `<iframe>` on catalog entry pages.

```
GitHub push
  → Vercel detects Next.js (zero-config)
  → next build runs server-side on Vercel
  → Output served from Vercel's CDN edge network

URL structure:
  /                          → Landing page (home)
  /projects                  → Catalog index
  /projects/[slug]           → Individual project page (React, contains iframe or link)
  /projects/math-flashcards  → iframe → /static/math-flashcards/index.html
  /static/math-flashcards/   → Standalone HTML/JS game (in public/)
```

---

## Decision 1: App Router vs Pages Router

**Use App Router.** Confidence: HIGH.

App Router is Next.js's current and future primary architecture. The Pages Router is in maintenance mode — Vercel's own docs, Next.js docs, and the broader 2025 ecosystem all treat App Router as the default for new projects.

For a simple static personal site, App Router adds no meaningful complexity. The only files you'll write are `app/layout.tsx`, `app/page.tsx`, and `app/projects/[slug]/page.tsx`. That's it.

**What App Router gives you over Pages Router:**
- Server Components by default (no client-side JS shipped for static content — good for performance)
- Nested layouts without `_app.tsx` workarounds
- Co-location of components with routes using `_components/` private folders
- Future-proof: any capability added to Next.js from here forward will land in App Router first

**Reject Pages Router because:** It is not deprecated but it is not where Next.js is heading. Starting a new project on Pages Router in 2026 means migrating later or staying on a dead branch.

---

## Decision 2: Vercel Deployment — Native vs `output: 'export'`

**Do NOT use `output: 'export'`. Deploy natively to Vercel.** Confidence: HIGH.

This is the most commonly misunderstood decision for a "static" Next.js site on Vercel.

### What `output: 'export'` does
Converts Next.js into a plain static site generator — produces an `out/` folder of HTML/CSS/JS files. Useful when deploying to S3, Netlify, Nginx, or any non-Node CDN host.

### What `output: 'export'` breaks
- `next/image` optimization (disabled — images are not optimized)
- Route Handlers (`app/api/` routes)
- Middleware
- ISR (incremental static regeneration)
- Dynamic routes require `generateStaticParams()` to be fully enumerated at build time

### Why Vercel does not need it
Vercel is the native Next.js platform. When you push to GitHub and Vercel detects a Next.js project, it runs `next build` on Vercel's infrastructure and serves output from its CDN edge network automatically. All pages that can be statically rendered are served as static HTML from the CDN. No `output: 'export'` flag needed.

In short: `output: 'export'` is for deploying Next.js somewhere that is *not* Vercel. On Vercel, it removes capabilities for no benefit.

### next.config.ts for this project

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // No output: 'export' — Vercel handles this natively
  // images.unoptimized only needed if using output: 'export'
}

export default nextConfig
```

That's it. Zero special config required for Vercel deployment.

---

## Decision 3: Standalone HTML/JS Projects — Public Folder + iframe

**Put standalone HTML/JS projects in `public/static/<slug>/` and embed with `<iframe>`.** Confidence: HIGH.

### Options evaluated

| Approach | Verdict | Reason |
|---|---|---|
| `public/static/<slug>/index.html` + iframe | **Use this** | Clean isolation, no DOM conflicts, served at predictable URL, zero build involvement |
| Rewrite as React component | Reject | Defeats the point; math flashcard game is already built |
| Separate Vercel project per mini-app | Overkill for now | Multiple repos, multiple domains, added complexity for a personal site |
| `dangerouslySetInnerHTML` to inline HTML | Reject | DOM ownership conflicts, CSP issues, CSS leakage in both directions |

### How it works

Files placed in `public/` are served verbatim at the root URL with no processing. So:

```
public/static/math-flashcards/index.html
public/static/math-flashcards/game.js
public/static/math-flashcards/style.css
```

...are accessible at:

```
https://yourdomain.com/static/math-flashcards/index.html
https://yourdomain.com/static/math-flashcards/game.js
```

The corresponding catalog page at `app/projects/math-flashcards/page.tsx` renders:

```tsx
export default function MathFlashcardsPage() {
  return (
    <main>
      <h1>Math Flash Cards</h1>
      <p>Simple arithmetic drill game for kids.</p>
      <iframe
        src="/static/math-flashcards/index.html"
        title="Math Flash Cards"
        width="100%"
        height="600"
        style={{ border: 'none' }}
      />
    </main>
  )
}
```

### iframe height
For games/apps with fixed viewport dimensions, set a fixed pixel height. For content-height responsiveness, use a `ResizeObserver` postMessage pattern — but fixed height is fine for v1.

### Security headers (if needed)
Vercel does not block same-origin iframes by default. No `X-Frame-Options` changes needed for self-hosted content. Only matters if embedding third-party URLs.

---

## Decision 4: Tailwind CSS Setup

**Use Tailwind CSS v4 with the PostCSS plugin approach.** Confidence: HIGH (verified against official Tailwind docs, April 2026 — v4.2 is current).

### v4 is a breaking change from v3

v4 dropped `tailwind.config.ts` as the primary configuration mechanism. Configuration is now CSS-first via `@theme` blocks in your CSS file. There is no `content` array to configure — Tailwind v4 scans your files automatically.

### Setup (verified against tailwindcss.com/docs/guides/nextjs)

```bash
npx create-next-app@latest the-shadow-realm --typescript --eslint --app
cd the-shadow-realm
npm install tailwindcss @tailwindcss/postcss postcss
```

**`postcss.config.mjs`** (create in project root):
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
export default config
```

**`app/globals.css`** (replace contents with):
```css
@import "tailwindcss";

/* Dark theme CSS variables go here */
:root {
  --background: #0a0a0a;
  --foreground: #e5e5e5;
}
```

**`app/layout.tsx`** imports globals.css as normal:
```tsx
import './globals.css'
```

No `tailwind.config.ts` file is needed for basic usage. If you need custom theme tokens, add them via `@theme` blocks in globals.css.

### Dark mode
With Tailwind v4, dark mode class strategy is configured in CSS:
```css
@import "tailwindcss";
@variant dark (&:where(.dark, .dark *));
```

Apply `className="dark"` to the `<html>` element in `app/layout.tsx`. Since this site is dark-only, hardcode the `dark` class rather than toggling it.

---

## Folder Structure

Recommended structure for a growing project catalog:

```
the-shadow-realm/
├── app/
│   ├── layout.tsx              # Root layout — html, body, dark class, font
│   ├── page.tsx                # Landing page — hero, blurb, catalog preview
│   ├── globals.css             # Tailwind import + CSS variables
│   ├── projects/
│   │   ├── page.tsx            # Full catalog index
│   │   └── [slug]/
│   │       └── page.tsx        # Individual project page (iframe host)
│   └── _components/            # Underscore = private, excluded from routing
│       ├── ProjectCard.tsx     # Catalog card component
│       ├── Header.tsx
│       └── Footer.tsx
├── public/
│   ├── static/
│   │   └── math-flashcards/    # Standalone HTML/JS project
│   │       ├── index.html
│   │       ├── game.js
│   │       └── style.css
│   └── favicon.ico
├── lib/
│   └── projects.ts             # Project catalog data (typed array, no CMS)
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

### Key structural decisions

**`app/_components/`** — The underscore prefix makes this folder invisible to the Next.js router. Components live next to the routes that use them without creating accidental URL segments.

**`lib/projects.ts`** — A typed array of project metadata is the right "CMS" for this scale. No database, no MDX, no Contentlayer. When the catalog grows to 20+ projects, evaluate MDX or a JSON file, but a TypeScript array is zero-friction:

```ts
export interface Project {
  slug: string
  title: string
  description: string
  type: 'iframe' | 'link' | 'coming-soon'
  iframeSrc?: string   // e.g. '/static/math-flashcards/index.html'
  externalUrl?: string
}

export const projects: Project[] = [
  {
    slug: 'math-flashcards',
    title: 'Math Flash Cards',
    description: 'Arithmetic drill game built for kids.',
    type: 'iframe',
    iframeSrc: '/static/math-flashcards/index.html',
  },
]
```

**Dynamic route `projects/[slug]`** — `generateStaticParams()` reads from `lib/projects.ts` so Vercel pre-renders each project page at build time:

```ts
export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}
```

**`public/static/`** — Nesting under `static/` (rather than `public/projects/`) keeps the URL namespace clean and avoids any collision with the Next.js `/projects` route. Files in `public/` are served verbatim; Next.js routes take precedence for path conflicts, but `public/projects/` would be confusing.

---

## Component Boundaries

| Component | Responsibility | Notes |
|---|---|---|
| `app/layout.tsx` | HTML shell, dark class, font, global nav | Server Component |
| `app/page.tsx` | Hero section + catalog teaser | Server Component |
| `app/projects/page.tsx` | Full project grid | Server Component, reads from `lib/projects.ts` |
| `app/projects/[slug]/page.tsx` | Project detail + iframe | Server Component wrapping a Client Component for iframe resize if needed |
| `_components/ProjectCard.tsx` | Single catalog entry card | Server Component unless it needs hover state |
| `lib/projects.ts` | Typed project data | Plain TS module, no React |
| `public/static/<slug>/` | Standalone HTML/JS app | Entirely outside Next.js — served as-is |

---

## Data Flow

```
lib/projects.ts (static typed array)
  → app/projects/page.tsx (build-time read → static HTML)
  → ProjectCard components (rendered to HTML at build time)

lib/projects.ts
  → app/projects/[slug]/page.tsx (generateStaticParams → static HTML per project)
  → <iframe src="/static/<slug>/index.html" />

Browser requests /static/math-flashcards/index.html
  → Vercel CDN serves public/ file directly (bypasses Next.js runtime entirely)
```

No client-side data fetching. No API routes. No runtime server. Everything is pre-rendered at build time.

---

## Scalability Considerations

| Concern | Now (1-5 projects) | Later (20+ projects) |
|---|---|---|
| Project data | Typed array in `lib/projects.ts` | Consider splitting to JSON or MDX if descriptions get long |
| Catalog page | Single static page | Still fine; add filtering/search as Client Component only when needed |
| Standalone projects | `public/static/<slug>/` | Same pattern scales; each project is isolated |
| Build time | Negligible | Still negligible — no external data fetching |
| Routing complexity | None | Consider route groups `(catalog)` if the site grows beyond catalog |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: `output: 'export'` on Vercel
**What:** Adding `output: 'export'` to next.config.ts when deploying to Vercel.
**Why bad:** Disables image optimization, API routes, and middleware for zero benefit. Vercel handles Next.js natively.
**Instead:** Deploy with default config. Vercel auto-detects and serves static pages from CDN.

### Anti-Pattern 2: Rewriting standalone projects as React components
**What:** Converting the math flashcard game from HTML/JS into a React component.
**Why bad:** Time cost with no user benefit. The game already works. Isolation is a feature.
**Instead:** `public/static/<slug>/` + iframe. Ship it as-is.

### Anti-Pattern 3: CMS or database for project metadata
**What:** Adding Contentlayer, Sanity, or a database to manage project entries.
**Why bad:** Massive complexity increase for a typed array problem. Adds build dependencies and potential failure points.
**Instead:** `lib/projects.ts` — a TypeScript array. Refactor when the friction is actually felt.

### Anti-Pattern 4: Pages Router for greenfield start
**What:** Starting the project with `pages/` instead of `app/`.
**Why bad:** Pages Router is maintenance-only. Any new Next.js feature (PPR, React 19 improvements, etc.) will land in App Router first or exclusively.
**Instead:** App Router from day one.

### Anti-Pattern 5: Client Components by default
**What:** Adding `'use client'` to every component.
**Why bad:** Ships JavaScript to the browser unnecessarily. A personal static site should be mostly HTML.
**Instead:** Default to Server Components. Only add `'use client'` when you need browser APIs, event handlers, or state (e.g., iframe resize observer).

---

## Sources

- Next.js App Router vs Pages Router: https://nextjs.org/docs/app/guides/migrating/app-router-migration
- Next.js `output` config reference: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Vercel Next.js native deployment: https://vercel.com/docs/frameworks/full-stack/nextjs
- Next.js static file serving (public folder): https://nextjs.org/docs/pages/api-reference/file-conventions/public-folder
- Tailwind CSS v4 + Next.js setup: https://tailwindcss.com/docs/guides/nextjs
- Next.js project structure: https://nextjs.org/docs/app/getting-started/project-structure
- Vercel discussion on `output: 'export'` removal: https://github.com/vercel/next.js/discussions/58790
