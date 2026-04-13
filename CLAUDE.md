<!-- GSD:project-start source:PROJECT.md -->
## Project

**the shadow realm**

A personal landing page and project hub deployed at a custom domain via GitHub + Vercel. The vibe is minimal and dark — a low-key placeholder that says "this is where my stuff lives" and grows a project catalog over time as things get built and shipped.

**Core Value:** A live, publicly accessible home base that deploys cleanly from GitHub and can absorb new projects without turning into a mess.

### Constraints

- **Design**: Dark theme, cool tones only — nothing warm, nothing bright, nothing loud
- **Complexity**: Keep it simple; this is a landing page, not an app
- **Stack**: Next.js — already decided, don't revisit
- **Deploy target**: Vercel — must wire up GitHub auto-deploy as part of v1
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
## Supporting Libraries (Conditional)
| Library | Version | Purpose | When to Add |
|---------|---------|---------|-------------|
| `@vercel/og` | latest | Open Graph image generation | If you add OG metadata; ships with Vercel, no install needed |
| `clsx` + `tailwind-merge` | latest | Conditional class merging | Add when component logic requires conditional Tailwind classes; used by shadcn/ui internally |
| `lucide-react` | latest | Icon set | If any icons are needed; tree-shakeable, consistent with Tailwind aesthetic |
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
## Rendering Strategy
- Vercel natively serves Next.js App Router output with edge caching — functionally identical to pure static but retains the ability to add a Server Component or API route later without a config change.
- `output: "export"` disables Image Optimization, route handlers, and metadata generation in some edge cases.
- The site will be fully pre-rendered (all pages SSG) without the config flag.
## Project Embedding Strategy (Math Flash Cards + Future Projects)
- Host the standalone project at `/public/projects/math-flash-cards/index.html` (served as a static asset by Next.js).
- Link to it from the project catalog, or embed in a Next.js page via an `<iframe>` pointing to `/projects/math-flash-cards/`.
## Installation
# Bootstrap
# Tailwind v4 is included by create-next-app when --tailwind is passed
# (as of Next.js 15.x it ships with Tailwind v4 by default)
# Theme support
# Optional: conditional class merging (add when needed)
## Configuration Notes
## Sources
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15) — Official, HIGH confidence
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — Official, HIGH confidence
- [Tailwind CSS Install Guide for Next.js](https://tailwindcss.com/docs/guides/nextjs) — Official, HIGH confidence
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — Official repo, HIGH confidence
- [Next.js Font Optimization Docs](https://nextjs.org/docs/app/getting-started/fonts) — Official, HIGH confidence
- [Next.js Static Exports Guide](https://nextjs.org/docs/pages/guides/static-exports) — Official, MEDIUM confidence (pages router docs, app router behavior equivalent)
- [Next.js embedding discussion](https://github.com/vercel/next.js/discussions/87954) — Community, MEDIUM confidence
- [Tailwind CSS 4.2 ships April 2026](https://www.infoq.com/news/2026/04/tailwind-css-4-2-webpack/) — InfoQ, MEDIUM confidence (version number)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
