# Phase 4: Game Shell - Research

**Researched:** 2026-04-16
**Domain:** Next.js App Router route scaffolding, React state machines, SSR guards for browser APIs
**Confidence:** HIGH

## Summary

Phase 4 is intentionally narrow: add a catalog entry, create the `/projects/samus-run` route, wire a three-state game machine (idle / playing / gameover), and render placeholder overlay screens for each state. No canvas drawing, no physics, no sprites. The primary technical challenge is ensuring the page loads cleanly on both server and client — SSR must be suppressed for any component that will eventually touch browser-only APIs (Canvas, requestAnimationFrame, Web Audio).

The existing codebase already establishes all the patterns this phase extends. `lib/projects.ts` holds the catalog array. `app/projects/math-flashcards/page.tsx` is the precedent "use client" project page. The game page follows the same structural pattern with one addition: the inner game component must be wrapped in `next/dynamic` with `ssr: false` to prevent Next.js from attempting to pre-render canvas/browser code on the server.

The overlay screens in this phase are pure React/HTML/CSS — they display text and a button. No canvas element is required yet. The state machine can be a simple `useReducer` or even `useState` enum. This is the scaffolding phase: correctness over complexity.

**Primary recommendation:** Create `app/projects/samus-run/page.tsx` as a thin server-compatible wrapper that dynamically imports a `"use client"` `SamusRunGame` component with `ssr: false`. Inside `SamusRunGame`, use `useState` or `useReducer` with three states (`idle | playing | gameover`) and render a fullscreen div with conditional overlay content for each state.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAT-05 | New catalog entry on landing page links to /projects/samus-run | Add entry to `lib/projects.ts`; landing page renders from that array automatically |
| GAME-04 | Game opens in idle state — Samus bobs in varia suit, waiting for first input | Initial state = `"idle"` in state machine; idle overlay renders placeholder text (sprite art deferred to Phase 5) |
| GAME-06 | Game over screen shows final score and restart option | `gameover` state renders score + restart button that transitions back to `idle`; score stored in state, passed down |
</phase_requirements>

---

## Standard Stack

No new npm packages. All libraries already in `package.json`. [VERIFIED: package.json in codebase]

### Core (already installed)
| Library | Version | Purpose | Role in Phase 4 |
|---------|---------|---------|-----------------|
| Next.js | 15.3.9 | Framework | App Router route, `next/dynamic` SSR guard |
| React | ^19.0.0 | UI runtime | `useState`/`useReducer` for state machine |
| TypeScript | ^5 | Type safety | `GameState` union type |
| Tailwind CSS | ^4 | Styling | Overlay layout, dark palette |

### Supporting
| Pattern | Source | Purpose |
|---------|--------|---------|
| `next/dynamic` with `ssr: false` | Built into Next.js | Prevents SSR of canvas/browser-API component |
| `useReducer` | React built-in | Clean state machine with explicit transitions |
| `"use client"` directive | React/Next.js | Marks component as client-only |

### No new installs required
The roadmap decision is locked: zero new npm packages for v1.1. [ASSUMED — from STATE.md roadmap decision]

---

## Architecture Patterns

### Route Structure (follows existing precedent)
```
app/
├── projects/
│   ├── math-flashcards/
│   │   └── page.tsx          (existing — "use client" page)
│   └── samus-run/
│       └── page.tsx          (new — thin wrapper with dynamic import)
lib/
└── projects.ts               (add samus-run entry)
```

### Pattern 1: SSR Guard via next/dynamic

**What:** A Server Component (or default RSC) page that dynamically imports the client-only game component with `ssr: false`. The page itself renders on the server; the game component is skipped during SSR and only mounted in the browser.

**When to use:** Any time a component will use `window`, `document`, `canvas`, `requestAnimationFrame`, `AudioContext`, or any other browser-only API. Apply this in Phase 4 even though no browser APIs are used yet — it future-proofs Phases 5–7 so no refactor is needed when those APIs land.

**Key constraint from official docs:** `ssr: false` must be called inside a Client Component — it is not allowed in Server Components. [CITED: nextjs.org/docs/app/guides/lazy-loading]

```typescript
// app/projects/samus-run/page.tsx
// Source: nextjs.org/docs/app/guides/lazy-loading (verified 2026-04-16)
import dynamic from "next/dynamic";

const SamusRunGame = dynamic(
  () => import("@/components/samus-run/SamusRunGame"),
  { ssr: false, loading: () => null }
);

export default function SamusRunPage() {
  return <SamusRunGame />;
}
```

**Alternative structure (also valid):** Place the `dynamic()` call inside a `"use client"` wrapper page. Both work. The pattern above is simpler — the page stays a Server Component and the dynamic call is at the top level.

### Pattern 2: Game State Machine with useReducer

**What:** A `GameState` union type drives which overlay is shown. `useReducer` with explicit action types makes transitions auditable and easy to test.

**When to use:** When there are three or more states with distinct transitions. For this phase, even `useState<GameState>` is acceptable given the simplicity — but `useReducer` is the right habit to establish before Phases 6–7 add complex physics state.

```typescript
// Source: React docs / training knowledge [ASSUMED pattern, standard React]
type GameState = "idle" | "playing" | "gameover";

type GameAction =
  | { type: "START" }
  | { type: "GAME_OVER"; score: number }
  | { type: "RESTART" };

interface GameReducerState {
  screen: GameState;
  score: number;
  highScore: number;
}

function gameReducer(state: GameReducerState, action: GameAction): GameReducerState {
  switch (action.type) {
    case "START":
      return { ...state, screen: "playing", score: 0 };
    case "GAME_OVER":
      return {
        screen: "gameover",
        score: action.score,
        highScore: Math.max(state.highScore, action.score),
      };
    case "RESTART":
      return { ...state, screen: "idle" };
    default:
      return state;
  }
}
```

**Note:** `highScore` via localStorage is a Phase 7 requirement (SCORE-03). In Phase 4, initialize it to `0` and add localStorage persistence later without changing the reducer shape.

### Pattern 3: Overlay Screen Layout

**What:** A fullscreen container (`position: fixed` or `relative` filling viewport) with conditional overlay children. Canvas element is a placeholder `<div>` in Phase 4 — replaced with `<canvas>` in Phase 5.

```typescript
// Phase 4: placeholder canvas background + overlays
// No actual canvas drawing required yet
export default function SamusRunGame() {
  const [state, dispatch] = useReducer(gameReducer, {
    screen: "idle",
    score: 0,
    highScore: 0,
  });

  return (
    <div className="relative w-full h-dvh bg-black overflow-hidden">
      {/* Placeholder for canvas (Phase 5 replaces this) */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      {/* Overlay: idle */}
      {state.screen === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <p className="text-[#ededed]/60 text-sm tracking-wide">samus run</p>
          <button
            onClick={() => dispatch({ type: "START" })}
            className="text-[#ededed] text-xs uppercase tracking-widest"
          >
            tap to start
          </button>
        </div>
      )}

      {/* Overlay: playing HUD */}
      {state.screen === "playing" && (
        <div className="absolute top-4 right-4 text-[#ededed]/60 text-xs tabular-nums">
          {state.score}
        </div>
      )}

      {/* Overlay: game over */}
      {state.screen === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <p className="text-[#ededed] text-sm">game over</p>
          <p className="text-[#ededed]/60 text-xs tabular-nums">{state.score}</p>
          <button
            onClick={() => dispatch({ type: "RESTART" })}
            className="text-[#ededed] text-xs uppercase tracking-widest mt-2"
          >
            restart
          </button>
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Catalog Entry Addition

The landing page reads from `lib/projects.ts` and renders all entries automatically. [VERIFIED: app/page.tsx and lib/projects.ts in codebase]

```typescript
// lib/projects.ts — add second entry
export const projects: Project[] = [
  {
    slug: "math-flashcards",
    name: "math flash cards",
    description: "arithmetic practice for kids. addition, subtraction, multiplication.",
    href: "/projects/math-flashcards",
  },
  {
    slug: "samus-run",
    name: "samus run",
    description: "norfair escape. dodge the rock walls.",
    href: "/projects/samus-run",
  },
];
```

### Anti-Patterns to Avoid

- **Canvas element in Phase 4:** Do not add `<canvas>` yet. A plain `<div>` background is correct for this phase. The canvas element and its drawing context land in Phase 5.
- **Physics refs in Phase 4:** Do not declare `useRef` for game loop state. That architecture starts in Phase 6. Phase 4 is state machine + overlays only.
- **"use client" on the page file:** If using a Server Component page that dynamically imports the game component, do NOT add `"use client"` to `page.tsx`. The SSR guard pattern works because the page stays server-rendered.
- **Using `ssr: false` inside a Server Component:** This causes a build error in Next.js 15. The `dynamic()` call with `ssr: false` must be in a Client Component OR at the top level of a file that Next.js treats as a module boundary. [CITED: nextjs.org/docs/app/guides/lazy-loading]
- **Warm colors in overlay text:** Site constraint — cool tones only. Use `#ededed`, `#c8cdd4`, `#9ba3ad` per existing palette.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSR exclusion | Custom `typeof window !== "undefined"` guards everywhere | `next/dynamic` with `ssr: false` | Single declaration, no hydration mismatch, loading state built-in |
| State machine | Custom class or nested boolean flags | `useReducer` with union type | Exhaustive switch, TypeScript discriminated unions, easy to extend |

---

## Common Pitfalls

### Pitfall 1: `ssr: false` in a Server Component

**What goes wrong:** Build error: "`ssr: false` is not allowed with `next/dynamic` in Server Components."
**Why it happens:** Next.js 15 enforces that `ssr: false` is a client-side-only concept and will not compile if detected in an RSC.
**How to avoid:** Either (a) make the page file a Client Component with `"use client"` before calling `dynamic()`, or (b) keep the page as an RSC and call `dynamic()` without `"use client"` — Next.js infers the module boundary correctly when the import target itself is `"use client"`.
**Warning signs:** Build fails with the explicit message above. Happens at `next build` or turbopack dev startup.

### Pitfall 2: Missing `h-dvh` on fullscreen game container

**What goes wrong:** Game container does not fill the viewport on mobile Safari — `100vh` overflows past the browser chrome.
**Why it happens:** iOS Safari's `100vh` includes the address bar height, causing vertical overflow and a scrollbar.
**How to avoid:** Use `h-dvh` (dynamic viewport height, Tailwind v4 built-in). Already used nowhere in the current codebase, but required for the game page.
**Warning signs:** Game panel visibly too tall on iPhone; scroll appears on a page that should be fixed.

### Pitfall 3: Score / state loss on `RESTART` dispatch

**What goes wrong:** Restarting resets score to 0 correctly, but high score is also reset.
**Why it happens:** `RESTART` action naively returns initial state.
**How to avoid:** `RESTART` transitions screen to `idle` but preserves `highScore`. The reducer pattern shown above handles this. Phase 7 will add localStorage persistence on top.

### Pitfall 4: Vercel lint failing on unused imports

**What goes wrong:** `next build` fails on Vercel because ESLint flags unused variables or imports.
**Why it happens:** `eslint-config-next` enables `@typescript-eslint/no-unused-vars`.
**How to avoid:** Don't import hooks, types, or components that aren't used yet. In Phase 4, keep the component lean — only import what renders.

---

## Code Examples

### Adding Catalog Entry
```typescript
// lib/projects.ts — verified against existing interface shape
// Source: codebase (lib/projects.ts, verified 2026-04-16)
{
  slug: "samus-run",
  name: "samus run",
  description: "norfair escape. dodge the rock walls.",
  href: "/projects/samus-run",
}
```

### SSR Guard Page
```typescript
// app/projects/samus-run/page.tsx
// Source: nextjs.org/docs/app/guides/lazy-loading (verified 2026-04-16)
import dynamic from "next/dynamic";

const SamusRunGame = dynamic(
  () => import("@/components/samus-run/SamusRunGame"),
  { ssr: false, loading: () => null }
);

export default function SamusRunPage() {
  return <SamusRunGame />;
}
```

### GameState Type
```typescript
// Source: standard React + TypeScript pattern [ASSUMED]
type GameState = "idle" | "playing" | "gameover";
```

---

## File Layout for This Phase

```
app/
└── projects/
    └── samus-run/
        └── page.tsx              (SSR guard wrapper — new)
components/
└── samus-run/
    └── SamusRunGame.tsx          (state machine + overlays — new)
lib/
└── projects.ts                   (add samus-run entry — modified)
```

**Note on components directory:** The existing codebase has no `components/` directory — all logic is inline in page files. For the game, splitting the "use client" game component into `components/samus-run/` is cleaner because the `dynamic()` import requires a separate module boundary. The math-flashcards page works as a single file because it does not use `next/dynamic`.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is code-only, no new tools, CLIs, or services required beyond the existing Next.js dev environment).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Zero new npm packages locked for v1.1 | Standard Stack | If wrong, planner might need to add a dep; but this is from STATE.md roadmap decision, low risk |
| A2 | `useReducer` is preferred over `useState` for game state | Architecture Patterns | Either works for Phase 4; `useReducer` is the better habit but planner can choose `useState` with no functional difference |
| A3 | `components/samus-run/` is the right module location | File Layout | Could also be `app/projects/samus-run/_components/`; either works, the important thing is the module boundary for `dynamic()` |

---

## Open Questions

1. **Idle screen placeholder art**
   - What we know: Phase 4 success criterion says "Samus is shown waiting for input, not a blank canvas" — but sprites are Phase 5 scope.
   - What's unclear: Does "shown waiting" mean a sprite must exist in Phase 4, or is styled text acceptable?
   - Recommendation: Treat "shown waiting" as styled text placeholder in Phase 4. The success criterion for Phase 4 says idle screen is "visible" — a clearly labeled start screen with instructional text satisfies this without sprites. Phase 5 adds the actual sprite.

2. **Component file location**
   - What we know: No `components/` directory exists yet in the codebase.
   - What's unclear: Owner preference for component co-location vs. shared directory.
   - Recommendation: Create `components/samus-run/SamusRunGame.tsx`. This is conventional Next.js App Router structure and keeps game code isolated.

---

## Sources

### Primary (HIGH confidence)
- [nextjs.org/docs/app/guides/lazy-loading](https://nextjs.org/docs/app/guides/lazy-loading) — `next/dynamic` SSR guard pattern, verified 2026-04-16, docs version 16.2.4
- Codebase: `lib/projects.ts`, `app/page.tsx`, `app/projects/math-flashcards/page.tsx`, `app/layout.tsx`, `app/globals.css`, `package.json` — verified 2026-04-16
- `.planning/STATE.md` — locked architectural decisions (zero npm packages, SSR guard is step zero, physics in useRef)
- `.planning/ROADMAP.md` — phase scope and success criteria

### Tertiary (LOW confidence / ASSUMED)
- `useReducer` state machine pattern — standard React, training knowledge, not verified against current React 19 docs

---

## Metadata

**Confidence breakdown:**
- Catalog entry pattern: HIGH — verified against existing codebase
- SSR guard pattern: HIGH — verified against official Next.js docs
- State machine (useReducer): MEDIUM — standard pattern, React 19 compatible, not verified in this session
- File structure: MEDIUM — conventional, no codebase precedent for components/ directory yet

**Research date:** 2026-04-16
**Valid until:** 2026-07-16 (Next.js stable, no fast-moving surface)
