# Technology Stack

**Project:** the shadow realm
**Researched:** 2026-04-12 (updated 2026-04-16 for Flappy Bird milestone)
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

## Flappy Bird Game: New Stack Additions

This section documents additions required for the Flappy Bird milestone only. All core stack decisions above are unchanged.

### Canvas vs. Game Library Decision

**Use the Canvas 2D API directly. Do not add Phaser or any game library.**

Rationale:

Flappy Bird has exactly four moving parts: a bird, vertical pipes, a score counter, and a background. The complete game logic fits in ~200-300 lines of TypeScript. Phaser 3 (v3.90) weighs ~345 KB gzipped; Phaser 4 (v4.0.0, released April 10 2026) is a ground-up WebGL rebuild focused on complex rendering pipelines and is also large. For a single-screen 2D game with no physics engine, no tilemap, no scene management, and no particle system, either version of Phaser ships a truck to carry a backpack.

The Canvas 2D API provides exactly what Flappy Bird needs: `drawImage`/`fillRect` for rendering, `requestAnimationFrame` for the game loop, collision as AABB rectangle math (4 lines), and `localStorage` for high score. No install required, no bundle impact, no SSR complications.

The integration pattern into Next.js App Router is also simpler with vanilla Canvas: one `'use client'` component, `useEffect` for loop initialization, `useRef` for the canvas element, and `cancelAnimationFrame` in the cleanup function. No dynamic import workaround, no EventBus bridge, no framework-level SSR exclusion required (though the component must be a Client Component because it touches the DOM).

**Verdict:** Canvas 2D API, zero new npm dependencies for game rendering.

**Confidence:** HIGH. Corroborated by multiple Flappy Bird vanilla canvas tutorials, npm bundle size data for Phaser, and direct inspection of what game features are actually required.

### Game Implementation Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Canvas 2D API | browser built-in | Game rendering | `fillRect`, `drawImage`, AABB collision — everything Flappy Bird needs. No install. |
| `requestAnimationFrame` | browser built-in | Game loop | Ties frame rate to display refresh, automatically pauses in background tabs, no install. |
| `localStorage` | browser built-in | High score persistence | Simple key/value, survives page reload, no backend. |
| Web Audio API | browser built-in | Sound effects | Programmatic beep/blip sounds for flap, score, death. No audio file assets needed (see note below). |

All four are browser built-ins. Zero new npm packages required for the game itself.

### Sound Implementation Note

**Use Web Audio API with programmatically generated tones, not audio file assets.**

Reasons:
1. No need to host `.mp3`/`.ogg` files or manage asset loading.
2. Synthesized bleeps fit the retro game aesthetic.
3. Avoids the async audio file loading complexity in a game loop.

The one real gotcha with Web Audio in any browser context (React or not) is the **autoplay policy**: browsers suspend `AudioContext` until the user has interacted with the page. For a game this is a non-issue — the first tap/click that starts the game counts as a user gesture and resumes the context automatically. The correct implementation:

```typescript
// Create once, lazily, on first user interaction
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}
```

**SSR safety:** `AudioContext` is `undefined` on the server. Because the game component uses `'use client'` and the audio context is created inside an event handler (not at module or render time), there is no SSR collision. No `typeof window` guard needed beyond the `'use client'` directive already required for canvas access.

**Confidence:** HIGH. MDN and Chrome developer docs confirm the user gesture requirement and the `resume()` pattern. The SSR safety of lazy initialization inside event handlers is standard React practice.

### Next.js Integration Pattern for the Game Page

The game lives at `app/projects/flappy-bird/page.tsx`. The page is a Server Component that renders a thin shell. The canvas game is extracted into `FlappyBirdGame.tsx` which is a Client Component.

```typescript
// app/projects/flappy-bird/page.tsx (Server Component — no 'use client')
import FlappyBirdGame from '@/components/FlappyBirdGame';

export default function FlappyBirdPage() {
  return <FlappyBirdGame />;
}

// components/FlappyBirdGame.tsx
'use client';

import { useEffect, useRef } from 'react';

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // initialize game loop
    const rafId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} />;
}
```

The `'use client'` directive on the component file is sufficient — Next.js 15 App Router does not require `next/dynamic` with `ssr: false` for a Client Component. The component simply does not render on the server (the server renders nothing for `useEffect` bodies). No Phaser-style EventBus, no dynamic import wrapper.

**Confidence:** HIGH. This is the documented App Router pattern for canvas/DOM-heavy client components.

---

## Why Not Phaser (Detailed)

| Concern | Phaser 3 (3.90.0) | Phaser 4 (4.0.0) | Canvas 2D |
|---------|-------------------|-------------------|-----------|
| Bundle size (min+gz) | ~345 KB | ~345 KB (estimated, similar scale) | 0 KB |
| Next.js App Router integration | Requires `'use client'` + dynamic import workaround for SSR; official template uses Pages Router | No official Next.js template yet as of April 2026 | Standard `'use client'` Client Component |
| Flappy Bird feature coverage needed | ~5% of what Phaser provides | ~5% | 100% |
| Physics engine | Arcade + Matter.js (unused) | Built-in (unused) | AABB math, 4 lines |
| Scene management | Full scene graph (unused) | Full scene graph (unused) | Single game loop |
| TypeScript support | Good, types bundled | Good, types bundled | Native (browser types) |
| Time to first render | Bundle parse + Phaser init | Bundle parse + Phaser init | Immediate |

Phaser 4 was released April 10, 2026 and is a ground-up WebGL renderer rebuild. Its new capabilities (node-based rendering pipeline, 100x faster sprite batching, unified filter system) are entirely irrelevant for a 2D side-scroller with 3 sprites. Adopting a brand-new major release of a large framework to get features the game doesn't use is the wrong trade.

**Confidence:** HIGH.

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
| Game engine | Phaser 3 / Phaser 4 | ~345 KB for a game that needs ~300 lines of canvas code. See "Why Not Phaser" section above. |
| Game loop library | `raf-loop`, `mainloop.js` | requestAnimationFrame + delta time is 10 lines of code. These libraries add zero value for a single-loop game. |
| Asset loader | any | No external asset files. Sprites drawn programmatically with Canvas 2D shapes and colors. |
| Physics library | matter-js, planck | Not needed. Gravity is one variable incremented per frame. Collision is `rectA.x < rectB.x + rectB.width && ...`. |

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

**Flappy Bird does NOT use the iframe pattern** — it is built natively as a Next.js Client Component at `app/projects/flappy-bird/page.tsx`. It is not a standalone HTML file. The iframe pattern is for importing pre-existing standalone HTML projects (like the math flash cards). New games built for this site are React Client Components.

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

# Flappy Bird milestone: NO additional installs required.
# Canvas 2D, requestAnimationFrame, Web Audio API, and localStorage
# are all browser built-ins available in any 'use client' component.
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
- [Phaser v4.0.0 released April 10 2026](https://phaser.io/download/release/v4.0.0) — Official Phaser, HIGH confidence
- [Phaser vs Kaplay vs Excalibur comparison April 2026](https://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework) — Official Phaser, HIGH confidence
- [Phaser Next.js template (official)](https://github.com/phaserjs/template-nextjs) — Official Phaser, HIGH confidence (uses Pages Router, not App Router)
- [Phaser bundle size via bundlephobia](https://bundlephobia.com/package/phaser) — bundlephobia, MEDIUM confidence
- [Web Audio API autoplay guide — MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — Official MDN, HIGH confidence
- [Web Audio API best practices — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — Official MDN, HIGH confidence
- [Web Audio autoplay policy for games — Chrome Developers](https://developer.chrome.com/blog/web-audio-autoplay) — Official Chrome, HIGH confidence
- [requestAnimationFrame with React hooks — CSS-Tricks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) — Community, MEDIUM confidence
- [Flappy Bird vanilla Canvas tutorial — DEV Community 2024](https://dev.to/codehuntersharath/create-a-flappy-bird-game-with-html-css-canvas-and-javascript-complete-tutorial-4h30) — Community, MEDIUM confidence
