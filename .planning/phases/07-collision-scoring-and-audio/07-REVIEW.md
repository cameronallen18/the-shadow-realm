---
phase: 07-collision-scoring-and-audio
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - components/samus-run/constants.ts
  - components/samus-run/gameLoop.ts
  - components/samus-run/SamusRunGame.tsx
  - components/samus-run/audioManager.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files reviewed covering the collision detection, scoring, and audio systems added in phase 07. The physics and hitbox math are correct — the centered reduced hitbox implementation traces cleanly. Scoring logic fires reliably before obstacle recycling. No critical security or crash-level issues were found.

Three warnings stand out: a side effect inside a React reducer (localStorage write), an AudioContext that is never closed on component unmount, and a "new best" display condition that triggers on a tied score rather than only on a new record. Two info-level items cover a misleading variable name and the ceiling clamp not accounting for the sprite's half-height.

---

## Warnings

### WR-01: Side effect (localStorage write) inside React reducer

**File:** `components/samus-run/SamusRunGame.tsx:36-37`
**Issue:** `localStorage.setItem(...)` is called directly inside the `gameReducer` function body. React treats reducers as pure functions and may invoke them more than once for the same action in Strict Mode or during concurrent rendering. This can cause localStorage to be written at unexpected times or multiple times per game-over event. In production builds with React 19's concurrent features enabled, this can silently corrupt state or fire redundant writes.
**Fix:** Move the localStorage write to a `useEffect` that watches `state.highScore`:

```typescript
// In the component body, replacing the in-reducer write:
useEffect(() => {
  if (typeof window !== "undefined" && state.highScore > 0) {
    localStorage.setItem("samusRunHighScore", String(state.highScore));
  }
}, [state.highScore]);

// In the reducer, remove the localStorage call:
case "GAME_OVER": {
  const newHigh = Math.max(state.highScore, action.score);
  return {
    screen: "gameover",
    score: action.score,
    highScore: newHigh,
  };
}
```

---

### WR-02: AudioContext is never closed — resource leak on unmount

**File:** `components/samus-run/audioManager.ts:8`
**Issue:** `new AudioContext()` allocates a browser audio context. Browsers cap the number of simultaneous AudioContext instances (typically 6-10). The `AudioManager` interface exposes no `close()` method, and `SamusRunGame.tsx` never calls `audioContext.close()` when the component unmounts. If the user navigates away and back (e.g., SPA navigation), each visit creates a new unreleased AudioContext. After enough navigations, the browser will start refusing new contexts or silently failing.
**Fix:** Expose a `close()` method on the interface and call it in the component's cleanup:

```typescript
// audioManager.ts
export interface AudioManager {
  playJump: () => void;
  playScore: () => void;
  playDeath: () => void;
  close: () => void;
}

// inside createAudioManager(), add to the returned object:
close() {
  ctx.close();
},
```

```typescript
// SamusRunGame.tsx — add a cleanup effect:
useEffect(() => {
  return () => {
    audioRef.current?.close();
    audioRef.current = null;
  };
}, []); // mount-only cleanup
```

---

### WR-03: "New best" banner shows on tied score, not only on new record

**File:** `components/samus-run/SamusRunGame.tsx:308`
**Issue:** The condition `state.score > 0 && state.score >= state.highScore` displays "new best" when the current score equals the stored high score. At the time this JSX renders, `state.highScore` has already been updated to `Math.max(previousHigh, score)` by the reducer. So when a player matches their personal best exactly (score === previousHigh), `state.score >= state.highScore` is `true` and "new best" appears — even though no record was broken.
**Fix:** Change `>=` to `>`. However, since `state.highScore` is already updated, you need to compare against the previous value. The simplest approach is to store whether it was a new record in the reducer state:

```typescript
// Minimal fix — track whether the session set a new record:
// In GameState, add: isNewBest: boolean
// In GAME_OVER case: isNewBest: action.score > state.highScore (before updating highScore)

// Or, simplest one-line approach if you accept a minor redundancy:
// Pass the previous highScore as part of the GAME_OVER action:
| { type: "GAME_OVER"; score: number; previousHighScore: number }

// Then in JSX:
{state.score > 0 && state.score > /* previousHighScore stored in state */ && (
  <p className="text-[#9ba3ad] text-xs">new best</p>
)}
```

The cleanest minimal fix is adding `isNewBest: boolean` to `GameState` and setting it in the reducer before updating `highScore`:

```typescript
case "GAME_OVER": {
  const isNewBest = action.score > state.highScore;
  const newHigh = Math.max(state.highScore, action.score);
  return { screen: "gameover", score: action.score, highScore: newHigh, isNewBest };
}

// JSX:
{state.isNewBest && <p className="text-[#9ba3ad] text-xs">new best</p>}
```

---

## Info

### IN-01: Variable name `hw` and `hh` suggest half-width/half-height but hold full dimensions

**File:** `components/samus-run/gameLoop.ts:104-105`
**Issue:** `hw` and `hh` conventionally mean "half-width" and "half-height" in game code, but here they hold the full reduced hitbox width and height (`COLLISION.samusWidth * COLLISION.hitboxScale = 18.2` and `36 * 0.65 = 23.4`). The math downstream is correct — `sRight = sLeft + hw` uses `hw` as a full width. The naming creates a false expectation that could mislead anyone reading the collision calculation.
**Fix:** Rename to `hitW` and `hitH` (or `reducedW` / `reducedH`):

```typescript
const hitW = COLLISION.samusWidth * COLLISION.hitboxScale;
const hitH = COLLISION.samusHeight * COLLISION.hitboxScale;
const offsetX = (COLLISION.samusWidth - hitW) / 2;
const offsetY = (COLLISION.samusHeight - hitH) / 2;

const sLeft = samusX - COLLISION.samusWidth / 2 + offsetX;
const sRight = sLeft + hitW;
const sTop = state.samusY - COLLISION.samusHeight / 2 + offsetY;
const sBottom = sTop + hitH;
```

---

### IN-02: Ceiling clamp uses samusY directly — clamp boundary doesn't account for sprite half-height

**File:** `components/samus-run/gameLoop.ts:96-99`
**Issue:** The ceiling clamp triggers when `state.samusY <= 0` and zeroes velocity. But `samusY` is the sprite anchor (vertical center), and the sprite's top edge is `samusY - COLLISION.samusHeight / 2 = samusY - 18`. This means Samus can visually clip 18px above the canvas top before the clamp fires. Hitting the ceiling is not a game-over condition (by design), but the effective ceiling boundary is 18px above the visible canvas edge rather than at it. If the gap layout ever allows a gap top near `y = 0`, Samus could appear to clip through the top of the frame while safely traversing the gap.

This is not a crash or logic error — `randomGap` ensures `playAreaTop = canvasHeight * 0.1`, so gaps never start at the very top. Flagged as info for awareness.
**Fix:** If pixel-perfect ceiling alignment is desired, clamp to `samusY <= COLLISION.samusHeight / 2` (i.e., `<= 18`):

```typescript
if (state.samusY <= COLLISION.samusHeight / 2) {
  state.samusY = COLLISION.samusHeight / 2;
  state.samusVY = 0;
}
```

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
