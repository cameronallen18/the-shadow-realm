---
phase: 10-background-scroll
verified: 2026-04-28T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Start the game in dev — observe Norfair tiles filling the canvas and scrolling left continuously"
    expected: "Background tiles scroll smoothly leftward, no blank gap or visible seam at the 512px wrap boundary"
    why_human: "Canvas tile rendering and visual seam presence cannot be verified programmatically from source alone"
  - test: "Play past obstacles 10, 20, 30 to trigger speedMultiplier increases — observe background scroll speed"
    expected: "Obstacle scroll speed increases while the background scroll speed remains constant (no perceived change in background movement rate)"
    why_human: "Speed independence is structurally enforced in code but the perceptual result requires visual confirmation"
  - test: "Die and restart — observe whether the background 'jumps' back to offset 0"
    expected: "Background position resets on restart (closure re-declared when Effect B re-runs). The jump may be imperceptible at 70 px/s but the restart boundary should be clean"
    why_human: "Closure variable lifetime behavior requires running the game to confirm the Effect B re-run actually resets the offset"
  - test: "Disable norfair_upper.png (e.g. temporarily rename public/sprites/norfair_upper.png) and start the game"
    expected: "Game renders solid-fill sky (#0d0608), midground band (#1a0c0e), lava floor (#3d1010), shimmer line, ceiling stalactites — identical to Phase 9 fallback. No JS error."
    why_human: "Null-image fallback path is code-verified but must be confirmed not to throw at runtime"
---

# Phase 10: Background Scroll Verification Report

**Phase Goal:** The Norfair background tiles scroll seamlessly in a loop at a fixed speed that is fully independent of game speed, and the solid-fill fallback is preserved
**Verified:** 2026-04-28
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Norfair background tiles horizontally and scrolls continuously — no blank gap or visible seam at the wrap boundary | ✓ VERIFIED | `drawBackground` loop starts at `x = -Math.floor(offset)` ∈ `[-511, 0]`, steps by `TILE_WIDTH` (512) until `x >= width`. `bgScrollOffset` is bounded to `[0, 512)` via `% TILE_WIDTH`, ensuring the leftmost tile always covers `x=0`. Tiling math is correct by construction. |
| 2 | Background scroll speed stays constant (70 CSS px/s) when the obstacle speed multiplier increases — BG_SCROLL_SPEED is independent of speedMultiplier | ✓ VERIFIED | `BG_SCROLL_SPEED = 70` is a standalone `export const` in `constants.ts` (line 50). Advance formula is `bgScrollOffset = (bgScrollOffset + BG_SCROLL_SPEED * dt) % TILE_WIDTH` — no `speedMultiplier` reference on this line or anywhere BG_SCROLL_SPEED is used. Grep confirms zero coupling. |
| 3 | bgScrollOffset resets to 0 on game restart without page reload — closure variable lifetime tied to Effect B remount | ✓ VERIFIED | `let bgScrollOffset = 0` declared at line 194 inside Effect B's closure body. Effect B depends on `[state.screen]` — it re-runs (and re-declares the variable at 0) every time `state.screen` transitions to `"playing"`. |
| 4 | When spritesRef.current.bg is null, drawEnvironment renders the existing solid-fill sky/midground/lava environment as in Phase 9 — no regression | ✓ VERIFIED | `drawEnvironment` has an `if (bg)` branch: when truthy, calls `drawBackground`; when falsy, falls through to `NORFAIR.sky` + `NORFAIR.midground` fills. Lava floor, shimmer line, ground line, and ceiling stalactites draw unconditionally on top in both branches. |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/samus-run/constants.ts` | BG_SCROLL_SPEED = 70 and TILE_WIDTH = 512 standalone exports | ✓ VERIFIED | Both present as top-level `export const` declarations at lines 50 and 56. Ordered: OBSTACLE_SPACING_PX (44) → BG_SCROLL_SPEED (50) → TILE_WIDTH (56) → COLLISION (59). Matches plan ordering contract exactly. |
| `components/samus-run/canvas/drawEnvironment.ts` | drawBackground helper + drawEnvironment with optional bg/bgOffset params | ✓ VERIFIED | `function drawBackground(` at line 14 (private, not exported). `export function drawEnvironment(` signature includes `bg?: HTMLImageElement \| null` and `bgOffset?: number`. Import updated to `{ NORFAIR, TILE_WIDTH }`. |
| `components/samus-run/SamusRunGame.tsx` | drawScene threads bgScrollOffset; Effect B advances offset each frame | ✓ VERIFIED | Import extended with BG_SCROLL_SPEED and TILE_WIDTH (line 9). `drawScene` signature has `bgScrollOffset?: number` (line 62). `drawEnvironment(ctx, width, height, sprites?.bg, bgScrollOffset ?? 0)` at line 65. `let bgScrollOffset = 0` at line 194. Advance at line 254. Effect B drawScene call at line 270 passes `bgScrollOffset`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| SamusRunGame.tsx (Effect B rAF loop) | drawEnvironment.ts (drawBackground) | drawScene → drawEnvironment(ctx, width, height, sprites?.bg, bgScrollOffset) | ✓ WIRED | Line 65: `drawEnvironment(ctx, width, height, sprites?.bg, bgScrollOffset ?? 0);` — drawScene body passes bg and offset to drawEnvironment, which dispatches to drawBackground when bg is truthy |
| SamusRunGame.tsx (Effect B closure) | constants.ts (BG_SCROLL_SPEED, TILE_WIDTH) | import { PHYSICS, GAME, SPRITE_LAYOUT, BG_SCROLL_SPEED, TILE_WIDTH } from "./constants" | ✓ WIRED | Line 9: import verified; both constants consumed at line 254 (`bgScrollOffset = (bgScrollOffset + BG_SCROLL_SPEED * dt) % TILE_WIDTH`) |
| drawEnvironment.ts (drawBackground) | constants.ts (TILE_WIDTH) | import { NORFAIR, TILE_WIDTH } from "../constants" | ✓ WIRED | Line 1: import verified; TILE_WIDTH consumed at line 27 (`x += TILE_WIDTH`) and loop declaration |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SamusRunGame.tsx` | `bgScrollOffset` | `let bgScrollOffset = 0` → advanced by `BG_SCROLL_SPEED * dt` each rAF frame | Yes — real dt-driven arithmetic, not static | ✓ FLOWING |
| `SamusRunGame.tsx` | `spritesRef.current.bg` | Effect D loads `/sprites/norfair_upper.png` (75,696 bytes, confirmed on disk) into `spritesRef.current.bg` | Yes — real PNG asset loaded at mount | ✓ FLOWING |
| `drawEnvironment.ts` | `bg` param + `bgOffset` param | Received from drawScene → from Effect B rAF loop | Yes — flows from real-dt advance to tile loop | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles cleanly | `npx tsc --noEmit` | Exit 0, no output | ✓ PASS |
| Production build succeeds | `npx next build` | 8/8 static pages, no errors, /projects/samus-run 1.28 kB | ✓ PASS |
| BG_SCROLL_SPEED constant correct | `grep -c "^export const BG_SCROLL_SPEED = 70;$" constants.ts` | 1 | ✓ PASS |
| TILE_WIDTH constant correct | `grep -c "^export const TILE_WIDTH = 512;$" constants.ts` | 1 | ✓ PASS |
| drawBackground is private (not exported) | `grep -c "^export function drawBackground" drawEnvironment.ts` | 0 | ✓ PASS |
| Effect A static-render call unchanged | `grep -c "drawScene(ctx, state.screen, ... undefined)"` | 1 (no bgScrollOffset arg) | ✓ PASS |
| BG_SCROLL_SPEED not coupled to speedMultiplier | `grep -E "BG_SCROLL_SPEED \* speedMultiplier"` across all source files | NONE | ✓ PASS |
| norfair_upper.png asset present | `ls -la public/sprites/norfair_upper.png` | 75,696 bytes | ✓ PASS |
| Commit hashes in SUMMARY exist | `git log --oneline` | 4e63a61, 48bb532, 11e4b51 all present | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ENV-01 | 10-01-PLAN.md | Norfair background tiles horizontally scroll at a fixed speed independent of obstacle speed multiplier | ✓ SATISFIED | `BG_SCROLL_SPEED = 70` standalone constant; advance formula has no speedMultiplier reference; drawEnvironment receives bg + offset and calls drawBackground when image is loaded |
| ENV-02 | 10-01-PLAN.md | Background scroll is seamless (no visible seam at tile wrap boundary) | ✓ SATISFIED (code) / ? NEEDS HUMAN (visual) | Tiling math: start at `x = -Math.floor(offset)` ∈ `[-511, 0]`, step by 512 — leftmost tile always covers x=0. Modulo wrap bounds offset to `[0, 512)`. Correctness established analytically; pixel-level seam absence requires visual confirmation. |

No orphaned requirements: REQUIREMENTS.md maps only ENV-01 and ENV-02 to Phase 10. Both accounted for.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODOs, FIXMEs, placeholders, empty return values, or hardcoded stub data found in any of the three modified files. The fallback solid-fill path in `drawEnvironment` is a legitimate null-safety branch (not a stub), as `spritesRef.current.bg` is a real asset that starts null during the load window.

---

### Human Verification Required

#### 1. Visual tile scroll — no seam

**Test:** Start the dev server (`npm run dev`), navigate to `/projects/samus-run`, tap to start the game, and observe the background during active play.
**Expected:** Norfair background image tiles horizontally across the full canvas and scrolls leftward continuously. No blank black stripe visible at any point. No visible seam or color discontinuity at the 512px tile wrap boundary.
**Why human:** Canvas 2D tile rendering and pixel-level seam presence cannot be verified from static source analysis. The tiling math is analytically correct, but GPU rounding behavior and sub-pixel offsets at the wrap boundary need visual confirmation.

#### 2. Speed independence — perceptual test

**Test:** Play past obstacles 10, 20, and 30 (which trigger speedMultiplier increases of +0.15 each). Observe background scroll rate at multiplier 1.0 vs. multiplier 1.45+.
**Expected:** Obstacle columns scroll noticeably faster as multiplier increases. Background scroll speed is perceptually constant throughout — the background does not speed up with the obstacles.
**Why human:** Structural independence is code-verified (no speedMultiplier reference near BG_SCROLL_SPEED), but the perceptual distinction between "constant background speed" and "subtly coupled" requires a live play test.

#### 3. Closure reset on restart

**Test:** Start the game, play for 10+ seconds to accumulate a non-zero bgScrollOffset, then die. After the gameover screen appears, click Restart and start a new game.
**Expected:** On the new game, the background position resets to its starting position (offset 0). The "jump" may be imperceptible given 70 px/s speed and 512px tile width, but the new run starts from a fresh closure with `let bgScrollOffset = 0`.
**Why human:** Verifying that Effect B re-runs and re-declares the variable requires exercising the live React effect lifecycle, which cannot be simulated statically.

#### 4. Null-image fallback — no regression

**Test:** Temporarily rename `public/sprites/norfair_upper.png` to `norfair_upper.png.bak`, start dev server, navigate to game, and tap to start.
**Expected:** Game renders the solid-fill Norfair environment (dark sky, midground band, lava floor with shimmer line, ceiling stalactites). No JavaScript error in console. Gameplay continues normally with shape-drawn Samus. Restore the file afterward.
**Why human:** The fallback else-branch is code-verified, but runtime behavior when the image fails to load (Effect D error path) needs confirmation that the null guard propagates cleanly to drawEnvironment.

---

### Gaps Summary

No gaps found. All four observable truths are verified at all levels (exists, substantive, wired, data flowing). TypeScript compiles clean. Production build succeeds. No anti-patterns detected. No deferred items — Phase 10 is the final phase of the v1.2 milestone.

Human verification is required before the phase can be marked fully passed, due to the visual nature of the scroll rendering (tile seam, speed perception) and the runtime behavior of the Effect B lifecycle.

---

_Verified: 2026-04-28_
_Verifier: Claude (gsd-verifier)_
