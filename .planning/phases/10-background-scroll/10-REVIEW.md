---
phase: 10-background-scroll
reviewed: 2026-04-27T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - components/samus-run/constants.ts
  - components/samus-run/canvas/drawEnvironment.ts
  - components/samus-run/SamusRunGame.tsx
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-27
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 10 adds a horizontally-scrolling Norfair background tile to the Samus Run canvas game. The three files are clean and well-structured. The tile-loop math in `drawBackground` is correct — the `startX` calculation guarantees no gap at the wrap boundary, and the modulo bounding in the rAF loop prevents floating-point growth. One warning-level logic inconsistency was found in `drawScene`. Three info-level items cover a redundant null-guard, a hardcoded cache-buster string, and an unreachable `cancelled` check in the sprite load path.

No critical issues. No security vulnerabilities. No data-loss or crash risk.

---

## Warnings

### WR-01: `drawScene` passes `bgScrollOffset ?? 0` when the parameter is already defaulted inside `drawEnvironment`

**File:** `components/samus-run/SamusRunGame.tsx:65`

**Issue:** `drawScene` receives `bgScrollOffset?: number` and passes it to `drawEnvironment` as `bgScrollOffset ?? 0`. `drawEnvironment` independently defaults `bgOffset` to `0` via its own `bgOffset ?? 0` on line 52 of `drawEnvironment.ts`. The double-default is harmless in isolation, but it creates a subtle consistency risk: if `drawEnvironment`'s default were ever changed (e.g., to a non-zero initial offset for a cinematic effect), `drawScene`'s hard-coded `?? 0` would silently shadow that change, making the caller's intent invisible.

More concretely, the static render path in Effect A (line 148) passes `undefined` for `bgScrollOffset` and relies on this double-default to produce offset=0. If `drawScene`'s `?? 0` were removed, the `undefined` would flow through to `drawEnvironment`'s own `?? 0` and the behavior would be identical — so the caller's `?? 0` adds no safety.

**Fix:** Remove the `?? 0` in `drawScene` and let `drawEnvironment` own the default. This makes the call site honest about what it actually knows:

```typescript
// SamusRunGame.tsx line 65 — before
drawEnvironment(ctx, width, height, sprites?.bg, bgScrollOffset ?? 0);

// after
drawEnvironment(ctx, width, height, sprites?.bg, bgScrollOffset);
```

`drawEnvironment` already handles `undefined` correctly via `bgOffset ?? 0`.

---

## Info

### IN-01: Cache-buster version string is a magic literal

**File:** `components/samus-run/SamusRunGame.tsx:345`

**Issue:** `img.src = src + "?v=3"` embeds a hardcoded version number. When either sprite asset is updated, this string must be manually incremented to bust browser cache. There is no lint guard or constant to track the version — a developer updating `norfair_upper.png` could easily forget.

**Fix:** Either move the version to a named constant at the top of the file, or use a build-time hash approach. For a personal project with infrequent asset changes, a named constant is sufficient:

```typescript
// Near the top of the file, alongside other constants
const SPRITE_CACHE_VERSION = "v3";

// In Effect D
img.src = src + `?${SPRITE_CACHE_VERSION}`;
```

### IN-02: `cancelled` flag is not checked in the `Promise.all` rejection path

**File:** `components/samus-run/SamusRunGame.tsx:361-364`

**Issue:** The `.catch` handler logs a warning unconditionally. The `cancelled` flag (set in the cleanup function at line 349) is checked in `.then` (line 355) but not in `.catch`. If the component unmounts while the images are still loading, and the load then fails, the `console.warn` fires after unmount.

This is harmless — no state mutation occurs in the catch branch — but it is inconsistent with the `cancelled` guard already applied in `.then`.

**Fix:**

```typescript
.catch((err) => {
  if (cancelled) return;
  console.warn("[Effect D] Sprite load failed:", err);
});
```

### IN-03: `drawBackground` uses a 5-argument `drawImage` that vertically stretches the source image

**File:** `components/samus-run/canvas/drawEnvironment.ts:28`

**Issue:** `ctx.drawImage(bg, Math.floor(x), 0, TILE_WIDTH, tileH)` uses the 5-argument form `(image, dx, dy, dw, dh)`, which draws the full source image scaled to fit the destination rectangle. `tileH = Math.floor(height)` equals the CSS canvas height (e.g., ~900px on a tall viewport), but `norfair_upper.png` is 384px tall. The image is stretched vertically to fill the canvas.

This appears to be intentional (fill the entire canvas height without letterboxing), and the current visual result is acceptable for the cave atmosphere. However, if the intent is ever to draw the image at its natural size and tile/clip vertically, the call would need to change.

No fix required if the stretch-to-fill behavior is intentional. If pixel-perfect vertical tiling is desired later:

```typescript
// 9-argument form: draw from source coords, into destination rect
ctx.drawImage(bg, 0, 0, TILE_WIDTH, bg.naturalHeight, Math.floor(x), 0, TILE_WIDTH, tileH);
```

---

_Reviewed: 2026-04-27_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
