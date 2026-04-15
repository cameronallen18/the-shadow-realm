---
phase: 02-landing-page
reviewed: 2026-04-13T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - app/globals.css
  - app/layout.tsx
  - app/page.tsx
  - app/icon.svg
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-04-13
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files reviewed: the global stylesheet, root layout, home page component, and SVG favicon. No security vulnerabilities and no correctness bugs — the page is a fully static layout with zero user input surface, no API routes, and no dynamic data. One warning for an SVG font portability issue that will cause inconsistent favicon rendering across environments. Two info items: an unused font being loaded unnecessarily, and a deviation from the project's own CLAUDE.md recommendation for dark mode handling.

---

## Warnings

### WR-01: SVG favicon uses a system font (`Georgia`) that is not guaranteed to exist

**File:** `app/icon.svg:3`
**Issue:** The `<text>` element specifies `font-family="Georgia, serif"`. SVG text rendered during favicon rasterization (by browsers, OS icon caches, and social crawlers like Twitter/Slack unfurlers) uses the system font stack at render time — it does not embed fonts. On systems without Georgia (Linux servers, many Android devices, Chromebooks), the "S" glyph will be rasterized using whatever the system's default `serif` font is, which may have dramatically different proportions or stroke weight. The favicon will look inconsistent across environments.

**Fix:** Replace the text element with a path-based glyph so the shape is embedded in the file and renders identically everywhere. Alternatively, use a geometric shape (circle, square, cut corners) that does not rely on text rendering at all. The simplest drop-in fix that preserves the "S" aesthetic is to use an outlined path:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="#0a0a0a"/>
  <!-- Replace <text> with an outlined path of the "S" glyph -->
  <!-- Export the glyph as a path from Figma, Inkscape, or use a tool like -->
  <!-- https://danmarshall.github.io/google-font-to-svg-path/ with Geist -->
  <path d="..." fill="#ededed"/>
</svg>
```

Using the Geist font (already in the project) to generate the path would keep the visual consistent with the heading typography.

---

## Info

### IN-01: `Geist_Mono` is loaded but never applied to any rendered element

**File:** `app/layout.tsx:10-13` (cross-reference: `app/globals.css:12`, `app/page.tsx`)
**Issue:** `Geist_Mono` is imported, instantiated, and its CSS variable (`--font-geist-mono`) is injected into the `<body>` className. The variable is also mapped in `@theme inline` in `globals.css`. However, no element on the page uses `font-mono`, `font-family: var(--font-geist-mono)`, or any Tailwind `font-mono` class. The font subset is fetched and bundled at build time for no current benefit.

**Fix:** Remove `Geist_Mono` from the layout until it is actually needed (e.g., when a code block, terminal snippet, or project card with monospace content is added):

```tsx
// app/layout.tsx — remove these lines until mono is used
// import { Geist, Geist_Mono } from "next/font/google";  →  import { Geist } from "next/font/google";
// const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

<body className={`${geistSans.variable} antialiased`}>
```

Also remove `--font-mono: var(--font-geist-mono);` from the `@theme inline` block in `globals.css` until it has a consumer.

### IN-02: Hardcoded `className="dark"` deviates from CLAUDE.md recommendation without a documented trade-off

**File:** `app/layout.tsx:26`
**Issue:** CLAUDE.md explicitly recommends `next-themes` for dark mode, noting it "sets the `dark` class on `<html>` reliably without hydration mismatch." This phase hardcoded `className="dark"` instead and suppressed the hydration warning via `suppressHydrationWarning`. This works correctly for a static dark-only site with no toggle, but it is a deviation from the project's own documented recommendation with no recorded rationale. If a theme toggle is added later (or system preference is respected), the current structure requires a non-trivial refactor.

**Fix:** Either document the deliberate trade-off in CLAUDE.md (e.g., "next-themes is deferred until a toggle is needed; static dark class is sufficient for a dark-only v1") or install `next-themes` now as the project spec recommends. The latter is two lines:

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
  {children}
</ThemeProvider>
```

`forcedTheme="dark"` locks the theme without a toggle while keeping the door open for one later. This also removes the need for `suppressHydrationWarning`.

---

_Reviewed: 2026-04-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
