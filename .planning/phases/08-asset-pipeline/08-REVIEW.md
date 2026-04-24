---
phase: 08-asset-pipeline
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - components/samus-run/constants.ts
  - components/samus-run/SamusRunGame.tsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Both files are well-structured and follow clear conventions. `constants.ts` is clean and well-commented. `SamusRunGame.tsx` handles the game loop, sprite loading, and audio correctly in most respects, but has three meaningful issues: a stale-closure risk in the rAF loop's game-over check, a `spritesRef` that is loaded but never consumed by draw calls, and an `AudioManager` method called on a potentially null reference. Three informational items cover dead code and a minor correctness note.

Cross-referencing with `gameLoop.ts`, `drawSamus.ts`, `drawEnvironment.ts`, and `audioManager.ts` confirmed all import targets exist and type boundaries align.

---

## Warnings

### WR-01: `spritesRef` loaded but never passed to draw calls — sprite sheet has no effect

**File:** `components/samus-run/SamusRunGame.tsx:112-333`

**Issue:** Effect D loads `samus.png` (with magenta-to-alpha conversion) and `norfair_upper.png` into `spritesRef.current`, but `spritesRef` is never referenced again anywhere in the component. `drawScene` calls `drawSamusIdle` / `drawSamusJump` and `drawEnvironment`, both of which use procedurally drawn shapes — they accept no sprite argument. The sprite load work is entirely orphaned. This is the central deliverable of the asset pipeline phase and it currently has zero effect on rendered output.

**Fix:** Pass `spritesRef.current` into `drawScene` (and on into `drawSamusIdle`/`drawSamusJump` and `drawEnvironment`) so the loaded canvases are actually used for rendering. Add a sprite parameter to each draw function, fall back to the shape renderer when `samus` or `bg` is `null`:

```ts
// drawScene signature change
function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  width: number,
  height: number,
  physics?: GamePhysicsState,
  sprites?: { samus: HTMLCanvasElement | null; bg: HTMLImageElement | null }
): void

// call site (inside rAF loop)
drawScene(ctx, "playing", r.width, r.height, game, spritesRef.current);
```

---

### WR-02: `audioRef.current.playJump()` called without null guard after lazy creation

**File:** `components/samus-run/SamusRunGame.tsx:231`

**Issue:** In `handleInput`, when `screenRef.current === "playing"`, the code calls `triggerJump(game)` then `audioRef.current.playJump()` (line 231). `audioRef.current` was just set to `createAudioManager()` at line 221 if it was null, so it should be non-null by line 231 — but TypeScript types `audioRef` as `AudioManager | null`, and the guard `if (!audioRef.current)` only initializes; the reference is re-read two branches later without a null check. TypeScript won't catch a race between the guard and the call in this pattern. More practically: if `createAudioManager()` itself throws (e.g., `AudioContext` is blocked by a browser policy), `audioRef.current` stays null and line 231 throws an uncaught `TypeError`.

**Fix:** Use optional chaining consistently, matching the pattern already used on lines 189, 205:

```ts
audioRef.current?.playJump();
```

---

### WR-03: Game-over check occurs after `drawScene` — one frame of post-death rendering

**File:** `components/samus-run/SamusRunGame.tsx:193-207`

**Issue:** The rAF loop calls `drawScene` (line 199) before checking `game.gameOver` (line 204). When a collision is detected inside `updateGame`, `game.gameOver` is set to `true` and the function returns early (stopping obstacle scroll and further updates). The frame then renders Samus at the collision position before the `dispatch({ type: "GAME_OVER" })` fires on the next conditional check. This produces one visually incorrect "dead" frame where Samus appears to phase through the wall.

**Fix:** Check `game.gameOver` immediately after `updateGame`, before `drawScene`:

```ts
updateGame(game, dt, canvasWidthRef.current, canvasHeightRef.current);

if (game.gameOver) {
  audioRef.current?.playDeath();
  dispatch({ type: "GAME_OVER", score: game.obstaclesCleared });
  return;
}

// Score sync + DOM display update
scoreRef.current = game.obstaclesCleared;
// ... rest of loop
```

---

## Info

### IN-01: `console.warn` left in production path

**File:** `components/samus-run/SamusRunGame.tsx:327`

**Issue:** The catch block for sprite loading emits `console.warn("[Effect D] Sprite load failed:", err)`. Per the comment, this is intentional for debugging — but it will appear in production browser consoles for any user whose browser fails to fetch the sprites. The comment acknowledges this; once the pipeline is stabilized, this should be removed or gated behind a dev-only flag.

**Fix:** Either remove before shipping or wrap in a dev guard:

```ts
if (process.env.NODE_ENV !== "production") {
  console.warn("[Effect D] Sprite load failed:", err);
}
```

---

### IN-02: `SPRITE_LAYOUT` in `constants.ts` is defined but not imported anywhere

**File:** `components/samus-run/constants.ts:53-68`

**Issue:** `SPRITE_LAYOUT` documents the sprite sheet's cell grid (96px cells, 81px content, section row origins). No file in `components/samus-run/` currently imports it. It's clearly forward-looking scaffolding for Phase 9 sprite rendering. No action required until Phase 9 draw calls consume it — noted here so it is not missed.

**Fix:** No immediate fix needed. Ensure Phase 9 draw functions import and use `SPRITE_LAYOUT` rather than hardcoding cell coordinates.

---

### IN-03: Idle start button dispatches `START` directly, bypassing `handleInput`

**File:** `components/samus-run/SamusRunGame.tsx:357-361`

**Issue:** The idle screen "tap to start" button `onClick` calls `dispatch({ type: "START" })` directly. The unified `handleInput` path also dispatches `START`, but additionally initializes `audioRef` (AudioContext unlock) and would set `pendingJump`. Clicking the button skips AudioContext unlock and the first frame won't produce jump sound if the user taps the button then immediately taps canvas. This is a minor inconsistency rather than a crash, but it bypasses the iOS AudioContext unlock flow documented in the comment on line 219.

**Fix:** Replace the inline `dispatch` with `handleInput`:

```tsx
<button onClick={handleInput} className="...">
  tap to start
</button>
```

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
