# Domain Pitfalls

**Domain:** Next.js static site / personal hub on Vercel
**Researched:** 2026-04-12
**Confidence:** HIGH (most pitfalls verified against official Next.js docs and Vercel docs)

---

## Critical Pitfalls

Mistakes that cause broken deploys, broken routing, or require a rewrite to fix.

---

### Pitfall 1: Using `next export` (the CLI command) Instead of `output: 'export'` in next.config

**What goes wrong:** In Next.js 13+ App Router, the old `next export` command was deprecated and removed. Running it produces an error. Projects that copy old tutorials will wire up the wrong command in their build script or CI.

**Why it happens:** Most tutorials and Stack Overflow answers written before 2023 reference `next export` as the way to produce a static build. The App Router replaced this with a config flag.

**Consequences:** Build fails. Vercel deploy fails. Confusion when the error message doesn't clearly explain the migration path.

**Prevention:** Set `output: 'export'` in `next.config.js` (or `next.config.ts`) and use `next build` as the only build command. Never add `next export` to any script.

```js
// next.config.js
const nextConfig = {
  output: 'export',
}
module.exports = nextConfig
```

**Detection:** Build log contains `Error: 'next export' is no longer supported...` or similar. Vercel build step exits with a non-zero code immediately.

---

### Pitfall 2: `next/image` Breaks With `output: 'export'` (Default Loader Incompatibility)

**What goes wrong:** The default `next/image` component relies on a server-side image optimization endpoint (`/_next/image`). With `output: 'export'`, there is no server, so this endpoint does not exist. Any page using `<Image>` without disabling optimization will throw a build error.

**Why it happens:** `next/image` is designed for server-rendered or Vercel-hosted deployments. The static export mode cannot generate optimized image variants at request time.

**Consequences:** Build errors on any page that uses `<Image>` without the `unoptimized` prop or a custom loader. Images simply fail to render.

**Prevention:** Add `images: { unoptimized: true }` to `next.config.js` for a static export. For a personal site with a handful of images this is the correct tradeoff — no optimization overhead, no extra dependencies.

```js
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}
module.exports = nextConfig
```

Alternatively, use plain `<img>` tags for simple cases (a personal site logo or graphic does not need `next/image`).

**Detection:** Build output contains `Error: Image Optimization using the default loader is not compatible with next export`.

---

### Pitfall 3: Public-Folder HTML File Name Collides With a Next.js Route

**What goes wrong:** Next.js enforces that no file in `/public` can share a name with a page route. If the math flash card game lives at `/public/flashcards.html` and there is also an `app/flashcards/` route (or vice versa), the build throws a hard error.

**Why it happens:** Both the public file and the Next.js route would resolve to the same URL path. Next.js cannot distinguish which one to serve.

**Consequences:** Build fails with `Error: You cannot define a route with the same name as a public file`. This is a hard stop — no deploy happens.

**Prevention:** Put standalone HTML projects in a named subdirectory that has no corresponding Next.js route. For the math flash card game, use `/public/games/flashcards/index.html` or `/public/games/math/`. The Next.js app would then link to `/games/flashcards/index.html` directly. Never use a flat name in `/public` that matches an existing or planned route.

**Detection:** Build output contains `conflicting-public-file-page` error message.

---

### Pitfall 4: Tailwind CSS v4 Config Format Is Completely Different From v3

**What goes wrong:** Tailwind CSS v4 (released January 2025) replaced `tailwind.config.js` and the `@tailwind` directives with a CSS-first `@import "tailwindcss"` and `@theme` configuration in the CSS file. The old PostCSS plugin `tailwindcss` was replaced by `@tailwindcss/postcss`. Projects initialized from v3 tutorials or created before 2025 will fail to apply styles or fail to build.

**Why it happens:** v4 is a near-total rewrite of the configuration model. Old tutorials, boilerplates, and `create-next-app` templates may still scaffold a v3-style setup.

**Consequences:** Styles silently not applying in production (the classic "works in dev, broken in prod"), or a build failure on the PostCSS plugin step.

**Prevention:**
- Verify installed Tailwind version with `npm ls tailwindcss`.
- For v4: install `@tailwindcss/postcss`, configure `postcss.config.mjs` with `{ plugins: { '@tailwindcss/postcss': {} } }`, and use `@import "tailwindcss";` in the global CSS file. No `tailwind.config.js` needed for basic usage.
- For v3: use `tailwind.config.js` with correct `content` paths (see Pitfall 5).
- Do not mix v3 and v4 patterns — pick one and stay consistent.

**Detection:** No Tailwind classes apply in dev or prod. Missing `@tailwind base/components/utilities` error. PostCSS plugin resolution error at build time.

---

### Pitfall 5: Tailwind CSS Purges All Classes Because `content` Paths Are Too Narrow (v3)

**What goes wrong:** If using Tailwind v3 and the `content` array in `tailwind.config.js` does not include all files that contain class names, those classes get purged in the production build. The site looks correct in development (JIT mode scans files) but all styling breaks in the Vercel deploy.

**Why it happens:** The default `content` from older scaffolds often targets only `./pages/**/*.{js,ts,jsx,tsx}` and misses `./app/**/*`, `./components/**/*`, or the `src/` directory.

**Consequences:** Production build renders completely unstyled. Highly confusing because local dev (`next dev`) looks fine.

**Prevention:** For an App Router project with Tailwind v3, use:
```js
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/**/*.{js,ts,jsx,tsx,mdx}',
],
```
Never construct Tailwind class names dynamically with template literals (e.g., `` `bg-${color}-500` `` — the string `bg-gray-500` will never appear in source and will be purged). Use full class strings in conditionals.

**Detection:** Production site renders plain HTML with no styles. Dev server renders correctly. Run `next build` locally and check the output.

---

## Moderate Pitfalls

---

### Pitfall 6: Dark Mode Hydration Mismatch (Flash of Unstyled/Wrong Theme)

**What goes wrong:** If dark mode is toggled via a class on `<html>` (Tailwind's `darkMode: 'class'` strategy) and the default theme is determined client-side (reading `localStorage` or `prefers-color-scheme`), SSG will render the page without the `dark` class. On hydration the class is added, causing a visible flash from light to dark.

**Why it happens:** The server (and static export) has no access to the user's preference. The first HTML served is always theme-neutral.

**Consequences:** Visible flash on every page load for users whose OS is in dark mode. Hydration mismatch warnings in the console. For a site that is permanently dark this is mostly avoidable.

**Prevention:** Since this site is intentionally always dark — not a toggle — apply the `dark` class directly on `<html>` in `layout.tsx` as a static attribute. Do not use `next-themes` or any dynamic theme provider. Hard-code the design in Tailwind dark-variant classes or just use the base palette directly. No hydration issue arises when the theme never changes.

```tsx
// app/layout.tsx
<html lang="en" className="dark">
```

If a toggle is ever added later, add `suppressHydrationWarning` to `<html>` and initialize with a blocking inline script (next-themes handles this).

**Detection:** Brief flash of light background on page load. Hydration mismatch warning in browser console.

---

### Pitfall 7: Vercel Ignores `output: 'export'` and Runs Node.js Build Anyway

**What goes wrong:** When deploying to Vercel, the platform auto-detects Next.js and uses its own build system, which does not require `output: 'export'` to be set. If someone sets `output: 'export'` but Vercel is configured to use the default Next.js preset, they can get surprising behavior — Vercel may deploy in server mode even when the developer expected a static export.

**Why it happens:** Vercel natively supports Next.js including server-rendered routes. `output: 'export'` tells Next.js to emit a static `out/` directory, but Vercel uses its own Next.js adapter and may not read the static output directory as expected.

**Consequences:** The site deploys and works — Vercel just runs it in server mode (which is fine). The issue is when the developer assumes static-only guarantees (e.g., no API routes, no server functions) but has actually deployed a server-capable app.

**Prevention:** For this project the simplest approach is to let Vercel handle the deployment normally (no `output: 'export'` needed — Vercel serves static pages as static). Only set `output: 'export'` if deploying to a non-Vercel static host. On Vercel, a standard `next build` with the default Next.js preset is correct and handles SSG pages as static without any server running for them.

**Detection:** No obvious error. Check the Vercel deployment logs to confirm whether it deployed as "Static" or "Serverless."

---

### Pitfall 8: DNS Setup — CNAME on Apex Domain, or Including the Domain in the Record Name

**What goes wrong:** Two common DNS mistakes when pointing a custom domain at Vercel:
1. Setting a CNAME record on the apex/root domain (`example.com` not `www.example.com`). Most DNS providers do not allow CNAME on the apex — use an A record pointing to Vercel's IP instead.
2. Writing the full domain name in the DNS record's "Name" field (e.g., writing `www.example.com` instead of just `www`). The registrar appends the domain automatically, resulting in `www.example.com.example.com`.

**Why it happens:** Vercel's DNS setup instructions are clear, but the UI of different domain registrars varies and confuses the distinction between "Name" (relative label) and "Value" (target).

**Consequences:** Domain never resolves. SSL certificate provisioning fails. Vercel dashboard shows "Invalid Configuration."

**Prevention:**
- Apex domain (`example.com`): Add an A record pointing to Vercel's IP (`76.76.21.21`).
- Subdomain (`www.example.com`): Add a CNAME pointing to `cname.vercel-dns.com`.
- In the "Name" field, write only the subdomain label (e.g., `www`), not the full domain.
- After changing records, DNS propagation can take 24–48 hours for nameserver changes. Reduce TTL to 60s before making changes to speed up cutover.

**Detection:** Vercel domain dashboard shows red "Invalid Configuration." `dig example.com` returns no A record or wrong IP.

---

### Pitfall 9: `trailingSlash` + Custom 404 Page = Broken 404 in Static Export

**What goes wrong:** When both `trailingSlash: true` and `output: 'export'` are set, and a custom `not-found` page is defined, Next.js generates `404/index.html` instead of `404.html`. Static hosts (and some CDN configurations) look for `404.html` at the root of the output directory. The custom 404 page is never served; users see a raw host-level 404 instead.

**Why it happens:** `trailingSlash: true` makes Next.js output every page as `[page]/index.html`, and it applies this logic to the 404 page as well, producing the wrong artifact.

**Consequences:** Custom 404 page never appears. Broken user experience on any dead link.

**Prevention:** If using `output: 'export'`, do not set `trailingSlash: true` unless also adding a post-build script that copies `out/404/index.html` to `out/404.html`. For a Vercel-hosted project without `output: 'export'`, this issue does not arise — Vercel handles routing natively. Since this project is recommended to use Vercel's native Next.js hosting, skip `output: 'export'` and skip `trailingSlash`, and let Vercel route 404s automatically.

**Detection:** Navigating to a nonexistent URL returns a generic host error page rather than the app's custom 404 design.

---

## Minor Pitfalls

---

### Pitfall 10: `next/font` Not Working After Vercel Deploy (Works Locally)

**What goes wrong:** `next/font` (Google Fonts integration) sometimes fails silently in Vercel deployments if the font is defined outside of a Server Component, or if the variable is not passed into the `<html>` element's `className`. The result is the fallback system font rendering in production while the custom font works in local dev.

**Why it happens:** `next/font` is designed to only work in Server Components at the layout level. Using it inside a Client Component or calling it conditionally breaks the static font injection.

**Prevention:** Define fonts once in `app/layout.tsx` (a Server Component) and apply via `className` on `<html>`. Never call `next/font` functions inside Client Components or dynamically. For a dark minimal site with a single monospace or sans-serif font, this is straightforward.

```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      {children}
    </html>
  )
}
```

**Detection:** Vercel deploy renders in system font. Locally the custom font appears. Check browser DevTools network tab — if the font file request is missing, the variable was not applied.

---

### Pitfall 11: Standalone HTML File in `/public` Does Not Inherit Site Styles

**What goes wrong:** A standalone HTML game placed in `/public/games/flashcards/index.html` is completely isolated from the Next.js app. It has no access to Tailwind classes, global CSS, or any React context. If the developer tries to make it look like the rest of the site by referencing `/globals.css` or Tailwind CDN inline, it becomes fragile.

**Why it happens:** Files in `/public` are served as raw static assets. They are not processed by Next.js at all.

**Consequences:** The embedded game looks visually inconsistent with the rest of the site unless explicitly styled. This is expected behavior, not a bug — but developers sometimes expect shared styles to "just work."

**Prevention:** Accept isolation as the feature. Style the standalone HTML file independently using an inline `<style>` block or a separate CSS file in the same directory. Match colors using raw hex values (matching the site's dark palette) rather than shared Tailwind variables. The iframe embed approach on the parent page provides a clean frame — no style leakage in either direction.

**Detection:** Game renders with default browser styles (white background, serif font) when embedded.

---

### Pitfall 12: Vercel Hobby Plan Concurrent Build Lock

**What goes wrong:** The Vercel Hobby (free) plan allows only one concurrent build. If a deploy is in progress when another push is made, the second deploy queues and the first may be cancelled or delayed.

**Why it happens:** Free tier resource constraint.

**Consequences:** For a solo developer with a single repo, this is almost never a problem in practice. It only matters if rapid successive pushes trigger multiple deploys simultaneously.

**Prevention:** No action needed for a personal site. Awareness is sufficient. If builds are cancelled unexpectedly, check the Vercel dashboard for queued deploys.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Initial Next.js setup | Tailwind v4 vs v3 config mismatch if using older tutorial | Verify Tailwind version, use correct config format for that version |
| First Vercel deploy | Missing `output: 'export'` vs letting Vercel handle natively — pick one approach and commit | Use Vercel native (no `output: 'export'`) unless targeting non-Vercel hosts |
| Adding next/image | Build failure: default loader incompatible with static export | Add `images: { unoptimized: true }` or use plain `<img>` |
| Custom domain wiring | Apex vs subdomain DNS record type confusion | A record for apex, CNAME for www, do not include domain in Name field |
| Math flash card game integration | Public folder naming collision, style isolation surprise | Use `/public/games/` subdirectory, style the game independently |
| Dark theme implementation | Hydration flash if theme is dynamic | Hard-code `className="dark"` on `<html>` since theme never changes |
| Font selection | Font not applying in production | Define font in Server Component layout only |

---

## Sources

- [Next.js Static Exports — Official Docs](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js Export with Image Optimization API error](https://nextjs.org/docs/messages/export-image-api)
- [Next.js Conflicting Public File and Page File error](https://nextjs.org/docs/messages/conflicting-public-file-page)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Install Tailwind CSS with Next.js — Official Guide](https://tailwindcss.com/docs/guides/nextjs)
- [Vercel Domains — Troubleshooting](https://vercel.com/docs/domains/troubleshooting)
- [Vercel Hobby Plan Limits](https://vercel.com/docs/plans/hobby)
- [next-themes: Next.js dark mode hydration](https://github.com/pacocoursey/next-themes)
- [GitHub Discussion: output export + useParams not supported](https://github.com/vercel/next.js/discussions/64660)
- [GitHub Issue: trailingSlash + custom 404 + next export](https://github.com/vercel/next.js/issues/16528)
- [Debugging Tailwind CSS and Next.js — LogRocket](https://blog.logrocket.com/debugging-tailwind-css-next-js/)
