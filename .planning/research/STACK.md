# Technology Stack

**Project:** the shadow realm
**Researched:** 2026-04-12 (v1 baseline) / 2026-04-23 (v1.2 sprite addendum)
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

## v1.2 Addendum: Sprite and Background Rendering

**Zero new npm packages. All techniques are native Browser Canvas 2D APIs.**

This section documents the specific browser APIs and patterns needed to add Super Metroid sprite animation and tiled level backgrounds to the existing rAF game loop. The existing `SamusRunGame.tsx` loop, `drawSamus.ts`, and `drawEnvironment.ts` are the integration points.

---

### Canvas 2D APIs Required

#### 1. `drawImage()` — 9-argument sprite-clipping form (HIGH confidence)

This is the core primitive for both sprite sheets and tiled backgrounds. The 9-argument signature extracts a source rectangle from a loaded image and renders it to a destination rectangle on the canvas, with independent scaling.

```typescript
ctx.drawImage(
  image,           // HTMLImageElement — the loaded sprite sheet PNG
  sx, sy,          // source top-left in the PNG (which frame to clip)
  sWidth, sHeight, // source frame dimensions in the PNG
  dx, dy,          // destination top-left on the canvas
  dWidth, dHeight  // destination size (allows scaling up from SNES native)
);
```

**Why 9-argument:** The 3-argument form cannot clip a frame from a sheet. The 5-argument form cannot scale. The 9-argument form handles both. It is the only correct form for sprite sheet animation.

**Source:** [MDN drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage) — Baseline widely available since July 2015. HIGH confidence.

---

#### 2. `imageSmoothingEnabled = false` — Pixel art nearest-neighbor scaling (HIGH confidence)

SNES sprites are 35x43 px native. Rendered at 2-4x scale on modern canvas without this property, they blur. Setting `ctx.imageSmoothingEnabled = false` forces nearest-neighbor interpolation — pixels stay crisp.

```typescript
ctx.imageSmoothingEnabled = false;
// Then drawImage — every subsequent draw call uses nearest-neighbor until reset
```

Additionally, the canvas element already has `style={{ imageRendering: "pixelated" }}` in `SamusRunGame.tsx` — this CSS property handles CSS-level scaling. The `imageSmoothingEnabled` flag handles internal canvas scaling via `drawImage`. Both are needed: CSS property covers the canvas element being scaled by the browser, the canvas property covers drawImage scaling within the 2D context.

**Source:** [MDN imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) — Baseline widely available since April 2017. HIGH confidence.

---

#### 3. `HTMLImageElement` + `onload` — Image preloading pattern (HIGH confidence)

Sprite sheet PNGs must be fully loaded before the first `drawImage` call. The standard pattern creates an `Image` object, attaches an `onload` handler, then sets `src`. The game loop should not start drawing sprite frames until the image is ready.

```typescript
const img = new Image();
img.onload = () => {
  // image is safe to use in drawImage
  spriteSheetReady = true;
};
img.src = "/sprites/samus.png"; // served from Next.js public/sprites/
```

For multiple sheets (Samus + background tiles), use `Promise.all` over an array of image URLs to gate the loop start:

```typescript
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const [samusSheet, bgSheet] = await Promise.all([
  loadImage("/sprites/samus.png"),
  loadImage("/sprites/norfair-tiles.png"),
]);
```

The `HTMLImageElement.naturalWidth` and `naturalHeight` properties give true source dimensions regardless of CSS sizing — use these (not `width`/`height`) to calculate frame coordinates.

**Source:** [MDN drawImage — HTMLImageElement notes](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage) — HIGH confidence.

---

#### 4. Frame-based animation timing — elapsed-time accumulator pattern (HIGH confidence)

The existing rAF loop already tracks `dt` (delta-time in seconds). Frame advancement for sprite animation uses the same `dt` to accumulate elapsed time and switch frames when a threshold is crossed. This integrates directly into the existing `loop(ts: number)` function in `SamusRunGame.tsx`.

```typescript
// Animation state — lives in a ref alongside gameRef
interface AnimState {
  frameIndex: number;
  elapsed: number;        // seconds since last frame advance
  frameDuration: number;  // seconds per frame (e.g., 0.1 = 10fps animation)
}

// Inside the rAF loop, after dt is computed:
animState.elapsed += dt;
if (animState.elapsed >= animState.frameDuration) {
  animState.elapsed -= animState.frameDuration;  // carry over remainder, don't zero out
  animState.frameIndex = (animState.frameIndex + 1) % TOTAL_FRAMES;
}

// Then drawImage uses frameIndex to compute sx:
const sx = animState.frameIndex * FRAME_WIDTH;
ctx.drawImage(samusSheet, sx, 0, FRAME_WIDTH, FRAME_HEIGHT, dx, dy, dWidth, dHeight);
```

**Why subtract rather than zero:** Zeroing `elapsed` causes drift over time at non-integer fps. Subtracting the threshold carries the overshoot into the next frame interval, keeping animation timing stable.

**Integration point:** The existing `loop(ts)` in `SamusRunGame.tsx` (line ~162) already has `const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, PHYSICS.dtCap)`. The animation accumulator uses this same `dt`. No additional rAF registration or timing infrastructure is needed.

---

#### 5. `createPattern()` + `CanvasPattern.setTransform()` — Scrolling tiled background (MEDIUM confidence)

For a scrolling Norfair tile texture, two approaches exist. `createPattern` is the cleaner API; manual `drawImage` tiling is more explicit.

**Approach A — `createPattern` with offset (simpler):**

```typescript
const pattern = ctx.createPattern(bgTileImage, "repeat");
// pattern is created once; reused every frame

// Each frame, shift the pattern origin by scrollX:
pattern.setTransform(new DOMMatrix().translateSelf(-scrollX % tileWidth, 0));
ctx.fillStyle = pattern;
ctx.fillRect(0, bgTop, width, bgHeight);
```

`scrollX` increments by `speed * dt` each frame (same scroll speed as obstacles). The `% tileWidth` modulo makes the offset wrap so the pattern tiles infinitely without floating-point blowup.

**Approach B — Manual double-draw tiling (more transparent):**

```typescript
// Draw the tile image repeatedly across the canvas, offset by scroll position
const offsetX = -(scrollX % tileWidth);
for (let x = offsetX; x < width; x += tileWidth) {
  ctx.drawImage(bgTileImage, x, bgTop, tileWidth, bgHeight);
}
```

**Recommendation:** Use Approach B (manual tiling). `CanvasPattern.setTransform` with `DOMMatrix` is widely supported (Baseline widely available) but adds an API surface that is less transparent when debugging. Manual looped `drawImage` is explicit, easier to reason about, and directly reuses the 9-argument form already understood by the team.

**Source:** [MDN createPattern](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createPattern), [MDN Square tilemaps scrolling](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps/Square_tilemaps_implementation:_Scrolling_maps) — MEDIUM confidence (pattern offset via setTransform is correct API but less commonly demonstrated in game contexts).

---

### Sprite Asset Strategy

**Source for rips:** [The Spriters Resource — Super Metroid](https://www.spriters-resource.com/snes/smetroid/) hosts PNG sprite sheets ripped from the SNES ROM. This is the canonical community archive for SNES sprite rips. The site requires manual download (the download page is behind a human check), but the PNG files are freely available for non-commercial fan use.

**Key sheets to download:**
- Samus Aran (complete): [asset/182270](https://www.spriters-resource.com/snes/smetroid/asset/182270/) — comprehensive re-rip with all animation states
- Norfair background tiles: [asset/159298](https://www.spriters-resource.com/snes/smetroid/sheet/159298/) — Norfair environment sheet
- Background tiles (general): [asset/1718](https://www.spriters-resource.com/snes/smetroid/asset/1718/) — tileset for environment textures

**Known sprite dimensions (MEDIUM confidence — from community sources):**
- Samus run cycle: 35x43 px per frame, 10 frames
- Samus in-suit height reference: 48 px
- Screw attack ball: approximately 30x30 px
- Idle/breathing: frame count not confirmed in available sources — assume 4-6 frames at ~10fps; verify from downloaded sheet

**Sprite sheet layout convention:** The Spriters Resource sheets arrange frames left-to-right in rows. Each row is typically a single animation. Frame width is uniform within a row. Measure with an image editor (or read naturalWidth/naturalHeight divided by frame count) before hardcoding constants.

**Where to put PNGs in the repo:**

```
public/
  sprites/
    samus.png         ← full Samus sprite sheet
    norfair-tiles.png ← Norfair background tile strip
```

Files under `public/` in Next.js are served at the root path (`/sprites/samus.png`) with no build step required. They are served with `Cache-Control: public, max-age=31536000, immutable` by Vercel automatically. Do not put sprite PNGs in `src/assets/` — those go through webpack bundling unnecessarily for images used directly in canvas code.

---

### Animation State Architecture

The existing `GamePhysicsState` in `gameLoop.ts` tracks physics. Animation state is separate — it is a render concern, not a physics concern. Add a parallel `AnimState` object, stored in a ref in `SamusRunGame.tsx` alongside `gameRef`.

```typescript
interface AnimState {
  idleFrame: number;
  idleElapsed: number;
  jumpFrame: number;
  jumpElapsed: number;
  screwFrame: number;
  screwElapsed: number;
}
```

The rAF loop decides which animation to advance based on physics state (`samusVY`, game mode), then draws the appropriate frame from the sprite sheet.

**State machine:**
- `samusVY === 0` and on floor → idle/breathing animation
- `samusVY < 0` → jump animation (rising)
- `samusVY > 0` → jump animation (falling, or same frames reversed)
- Screw attack — if implemented, triggered by a separate flag in physics state

**Rollback on game over:** Reset `animState.idleFrame = 0` and `elapsed = 0` when the game transitions from playing to gameover/idle. This prevents the sprite from restarting mid-animation on the static screens.

---

### Integration with Existing rAF Loop

The existing loop in `SamusRunGame.tsx` (Effect B, ~line 141) already:
1. Computes `dt` with a `dtCap`
2. Calls `updateGame(game, dt, ...)` for physics
3. Calls `drawScene(ctx, ...)` for rendering

The sprite system plugs in at step 3. `drawScene` currently calls `drawSamusIdle` or `drawSamusJump` (procedural canvas drawing). These are replaced by a `drawSamusSprite(ctx, samusSheet, animState, x, y, scale)` function that uses `drawImage` with the current frame index.

`drawEnvironment` is similarly replaced by a `drawNorfairBackground(ctx, bgSheet, scrollX, width, height)` function. The `scrollX` value is derived from the same scroll physics already tracked in `gameLoop.ts` (obstacle `x` positions). Either pass it through or add a `cameraX` accumulator to `GamePhysicsState`.

**No changes to the rAF registration, no new `useEffect`, no additional timing logic** — the existing loop structure is sufficient.

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
| UI component library | shadcn/ui | Overkill for a landing page. Plain Tailwind is the right tool. |
| Animation library | Framer Motion | Explicitly out of scope. The aesthetic is minimal and static. |
| State management | Zustand, Redux, Jotai | There is no state beyond the game loop. |
| CMS | Contentlayer, Sanity, Contentful | Out of scope. |
| MDX / blog | next-mdx-remote | No blog content planned. |
| Analytics | Vercel Analytics, Plausible | Owner is the only user. |
| Database / ORM | Prisma, Drizzle | No backend. Static/SSG only. |
| Auth | NextAuth, Clerk | No auth requirement. |
| Pages Router | — | Use App Router. Pages Router is in maintenance mode. |
| CSS-in-JS | styled-components, Emotion | Conflicts with React Server Components. |
| Sprite/game library | PixiJS, Phaser, Konva | Zero-npm-package constraint. All needed APIs exist natively in Canvas 2D. A sprite loop for a flappy-bird-style game does not justify a framework dependency. |
| WebGL | — | Canvas 2D is sufficient. WebGL is appropriate when batching thousands of draw calls; this game has <10 draw calls per frame. |
| OffscreenCanvas | — | Adds worker threading complexity. The existing main-thread rAF loop has no performance problem at this scale. |

---

## Rendering Strategy

**Use App Router with static generation (no `output: "export"`).**

Vercel natively serves Next.js App Router output with edge caching — functionally identical to pure static but retains the ability to add a Server Component or API route later without a config change. `output: "export"` disables Image Optimization and some metadata generation in edge cases.

**Confidence:** MEDIUM. Standard recommendation from Next.js docs and Vercel.

---

## Project Embedding Strategy (Math Flash Cards + Future Projects)

- Host standalone projects at `/public/projects/[name]/index.html` (served as static asset by Next.js).
- Link from project catalog, or embed via `<iframe>` pointing to `/projects/[name]/`.
- The Samus Run game is a Next.js App Router page, not an iframe embed — it lives at `app/projects/samus-run/page.tsx`.

---

## Installation

```bash
# Bootstrap (already done)
npx create-next-app@latest the-shadow-realm \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --import-alias "@/*"

# Theme support (already installed)
npm install next-themes

# v1.2: No new packages — sprite animation uses native Canvas 2D APIs only
# Only action: download PNG sprite sheets from The Spriters Resource
# and place them in public/sprites/
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

---

## Sources

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15) — Official, HIGH confidence
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — Official, HIGH confidence
- [Tailwind CSS Install Guide for Next.js](https://tailwindcss.com/docs/guides/nextjs) — Official, HIGH confidence
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) — Official repo, HIGH confidence
- [Next.js Font Optimization Docs](https://nextjs.org/docs/app/getting-started/fonts) — Official, HIGH confidence
- [Next.js Static Exports Guide](https://nextjs.org/docs/pages/guides/static-exports) — Official, MEDIUM confidence
- [Next.js embedding discussion](https://github.com/vercel/next.js/discussions/87954) — Community, MEDIUM confidence
- [Tailwind CSS 4.2 ships April 2026](https://www.infoq.com/news/2026/04/tailwind-css-4-2-webpack/) — InfoQ, MEDIUM confidence
- [MDN drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage) — Official, HIGH confidence
- [MDN imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) — Official, HIGH confidence
- [MDN createPattern](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createPattern) — Official, HIGH confidence
- [MDN Square tilemaps scrolling](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps/Square_tilemaps_implementation:_Scrolling_maps) — Official MDN game dev guide, MEDIUM confidence
- [The Spriters Resource — Super Metroid](https://www.spriters-resource.com/snes/smetroid/) — Community archive, MEDIUM confidence (fan rips, non-commercial use)
- [Super Metroid run cycle dimensions](https://www.tumblr.com/desandro/113218736476/super-metroid-samus-run-cycle-10-frames-16) — Community, MEDIUM confidence (35x43 px, 10 frames)
