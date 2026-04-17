---
phase: 04-game-shell
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - app/projects/samus-run/page.tsx
  - components/samus-run/SamusRunGame.tsx
  - lib/projects.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-16
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the Samus Run page shell, the game state component, and the shared projects registry. No security vulnerabilities or data loss risks. Two logic/quality warnings found in `SamusRunGame.tsx` that will affect Phase 5 game integration if left unaddressed: the live score HUD is wired to a state field that is never incremented, and a Tailwind class pair produces a no-op CSS transition. `lib/projects.ts` and `app/projects/samus-run/page.tsx` are clean.

## Warnings

### WR-01: Live score HUD always displays 0

**File:** `components/samus-run/SamusRunGame.tsx:81`
**Issue:** The playing HUD renders `{state.score}`, but `state.score` is set to `0` on `START` and is never updated during gameplay. The only action that carries a score value is `GAME_OVER`. This means the in-game score counter will always show `0` while playing. When Phase 5 wires up the canvas game loop, it will need a dedicated score-update mechanism in the reducer, or the HUD should read from a ref/local value rather than from reducer state.
**Fix:** Add a `TICK` or `SET_SCORE` action to the reducer, and dispatch it from the game loop in Phase 5:

```typescript
// Add to GameAction union:
| { type: "SET_SCORE"; score: number }

// Add to gameReducer:
case "SET_SCORE":
  return { ...state, score: action.score };
```

Alternatively, manage the live score in a `useRef` to avoid reducer overhead on every frame, and only push the final score into the reducer on `GAME_OVER`.

---

### WR-02: RESTART does not reset score field

**File:** `components/samus-run/SamusRunGame.tsx:34`
**Issue:** The `RESTART` case spreads `state` without zeroing `score`. After a game ends and the user restarts, `state.score` retains the previous run's score until a new `GAME_OVER` dispatches again. If Phase 5 reads `state.score` anywhere during the idle screen or early in a new run, it will see a stale value.
**Fix:**

```typescript
case "RESTART":
  return { ...state, screen: "idle", score: 0 };
```

---

## Info

### IN-01: Contradictory Tailwind transition classes on back link

**File:** `components/samus-run/SamusRunGame.tsx:57`
**Issue:** The back link uses `transition-colors duration-0`. `duration-0` sets the CSS transition duration to `0ms`, which makes `transition-colors` a no-op — no animated transition occurs. If the intent is "no transition," the correct approach is to remove both classes or use `transition-none`. If the intent is to have a snappy-but-instant color shift, the hover change still works without any transition class at all.
**Fix:** Remove `transition-colors duration-0` entirely, or replace with `transition-none` if you want to be explicit:

```tsx
className="fixed top-4 left-4 text-[#ededed]/40 text-xs hover:text-[#ededed]/70 transition-none z-50"
```

---

### IN-02: Unnecessary "use client" on page shell

**File:** `app/projects/samus-run/page.tsx:1`
**Issue:** The page component is a thin wrapper that renders a dynamically imported client component. In Next.js App Router, `dynamic(..., { ssr: false })` does not require the parent page to be a client component — the dynamic import boundary itself handles it. The `"use client"` directive forces the entire page module into the client bundle unnecessarily.
**Fix:** Remove `"use client"` from `page.tsx`. The dynamic import with `ssr: false` is sufficient and the page will still render correctly as a Server Component shell.

```tsx
// Remove this line:
"use client";

import dynamic from "next/dynamic";
// ...rest unchanged
```

---

_Reviewed: 2026-04-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
