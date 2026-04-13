# Technology Stack

**Project:** the shadow realm
**Researched:** 2026-04-12
**Confidence:** HIGH

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (15.5 as of April 2026) | Framework | Vercel-native, excellent static export, App Router is the current default. Next.js 16 exists but is a bigger upgrade surface with no benefit for a static site — 15.x is stable and well-documented. |
| React | 19.x | UI runtime | Bundled with Next.js 15 App Router. No reason to pin to React 18 for a greenfield project with no legacy deps. |
| TypeScript | 5.x | Type safety | `create-next-app` generates TS by default. `next.config.ts` is now a first-class citizen. Skip JS — TypeScript catches errors before deploy. |
| Node.js | 18.18+ | Build runtime | Next.js 15 minimum. Vercel's build environment satisfies this automatically. |

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x (4.2.2 as of April 2026) | Utility-first CSS | Zero-config, CSS-first in v4 (no `tailwind.config.js` needed), dark mode via `.dark` class is first-class. Full builds 5x faster than v3. The standard choice for Next.js in 2025/2026 — every portfolio template uses it. |
| next-themes | latest (^0.4.x) | Dark/light mode toggle | 2-line integration for system preference + forced dark, zero flash on SSR. Required even if the site is dark-only, because it sets the `dark` class on `<html>` reliably without hydration mismatch. |

### Fonts

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/font (Geist) | built into Next.js | Typography | Geist is Vercel's own typeface, built into `next/font/google` as of Next.js 15. Zero external network request at runtime, zero layout shift. Matches the dark/minimal aesthetic. No additional install. |

### Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | — | Hosting + CI/CD | Native Next.js platform. GitHub push → automatic preview deploys → one-click production promote. Free Hobby tier handles static sites with no limits that matter. Already decided. |

---

## Supporting Libraries (Conditional)

These are NOT required for v1. Add only if the feature actually needs them.

| Library | Version | Purpose | When to Add |
|---------|---------|---------|-------------|
| `@vercel/og` | latest | Open Graph image generation | If you add OG metadata; ships with Vercel, no install needed |
| `clsx` + `tailwind-merge` | latest | Conditional class merging | Add when component logic requires conditional Tailwind classes; used by shadcn/ui internally |
| `lucide-react` | latest | Icon set | If any icons are needed; tree-shakeable, consistent with Tailwind aesthetic |

---

## Explicitly Not Using

| Category | Rejected Option | Why Not |
|----------|-----------------|---------|
| UI component library | shadcn/ui | Overkill for a landing page. shadcn installs Radix primitives, Lucide, and generates ~20+ component files. This site needs zero interactive components beyond maybe a theme toggle. Plain Tailwind is the right tool. |
| Animation library | Framer Motion | Explicitly out of scope per PROJECT.md. The aesthetic is minimal and static — animations are counter to the vibe. |
| State management | Zustand, Redux, Jotai | There is no state. No auth, no cart, no user data. |
| CMS | Contentlayer, Sanity, Contentful | Out of scope per PROJECT.md. No content pipeline until the site proves it needs one. |
| MDX / blog | next-mdx-remote | No blog content planned. Add later if a writing section emerges. |
| Analytics | Vercel Analytics, Plausible | Out of scope per PROJECT.md. Owner is the only user. |
| Database / ORM | Prisma, Drizzle | No backend. Static/SSG only. |
| Auth | NextAuth, Clerk | No auth requirement. |
| Pages Router | — | Use App Router. Pages Router is in maintenance mode. App Router is the documented default for all new Next.js projects. |
| CSS-in-JS | styled-components, Emotion | Runtime CSS-in-JS conflicts with React Server Components and adds unnecessary JavaScript. Tailwind is the correct choice. |

---

## Rendering Strategy

**Use App Router with static generation (no `output: "export"`).**

Two options exist: Vercel-hosted SSG (default) vs. `output: "export"` (pure static files). Recommendation is to **not** set `output: "export"` and instead let Vercel handle it.

Why:
- Vercel natively serves Next.js App Router output with edge caching — functionally identical to pure static but retains the ability to add a Server Component or API route later without a config change.
- `output: "export"` disables Image Optimization, route handlers, and metadata generation in some edge cases.
- The site will be fully pre-rendered (all pages SSG) without the config flag.

**Confidence:** MEDIUM. This is the standard recommendation from the Next.js docs and Vercel. The only counter-argument for `output: "export"` would be migrating to a non-Vercel host, which is not planned.

---

## Project Embedding Strategy (Math Flash Cards + Future Projects)

The math flash card game is a standalone HTML/JS project. The cleanest integration for a Next.js site hosting standalone HTML/JS projects:

- Host the standalone project at `/public/projects/math-flash-cards/index.html` (served as a static asset by Next.js).
- Link to it from the project catalog, or embed in a Next.js page via an `<iframe>` pointing to `/projects/math-flash-cards/`.

**Why iframe over rewriting in React:** Next.js cannot "mount" into an arbitrary DOM element — it owns the full document. An iframe is the correct microfrontend boundary: separate document, separate JS runtime, no hydration conflicts.

**Confidence:** HIGH. This pattern is confirmed in multiple Next.js discussions.

---

## Installation

```bash
# Bootstrap
npx create-next-app@latest the-shadow-realm \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Tailwind v4 is included by create-next-app when --tailwind is passed
# (as of Next.js 15.x it ships with Tailwind v4 by default)

# Theme support
npm install next-themes

# Optional: conditional class merging (add when needed)
npm install clsx tailwind-merge
```

---

## Configuration Notes

**`next.config.ts`** (TypeScript config — available since Next.js 15):
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // No special config needed for a static personal site
  // Do NOT set output: "export" — let Vercel handle it
};

export default nextConfig;
```

**Dark mode with Tailwind v4** — in `globals.css`:
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

**Theme provider** wraps the root layout with `defaultTheme="dark"` and `attribute="class"` so the site defaults to dark without flash.

---

## Sources

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15) — Official, HIGH confidence
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — Official, HIGH confidence
- [Tailwind CSS Install Guide for Next.js](https://tailwindcss.com/docs/guides/nextjs) — Official, HIGH confidence
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — Official repo, HIGH confidence
- [Next.js Font Optimization Docs](https://nextjs.org/docs/app/getting-started/fonts) — Official, HIGH confidence
- [Next.js Static Exports Guide](https://nextjs.org/docs/pages/guides/static-exports) — Official, MEDIUM confidence (pages router docs, app router behavior equivalent)
- [Next.js embedding discussion](https://github.com/vercel/next.js/discussions/87954) — Community, MEDIUM confidence
- [Tailwind CSS 4.2 ships April 2026](https://www.infoq.com/news/2026/04/tailwind-css-4-2-webpack/) — InfoQ, MEDIUM confidence (version number)
