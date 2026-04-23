---
phase: 06-physics-and-input
verified: 2026-04-20T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Samus falls under gravity and jumps via all input methods on live game"
    expected: "Samus falls when idle, jumps upward on Space/ArrowUp/click/touch, jump sprite shows while rising, idle sprite while falling"
    why_human: "requestAnimationFrame rendering and sprite transitions require a running browser to observe"
  - test: "Obstacle scroll and randomized gap heights"
    expected: "Rock wall pairs scroll continuously right-to-left with varying gap positions on each recycle"
    why_human: "Gap randomization and visual rendering requires live browser observation"
  - test: "Speed increase after ~10 obstacles"
    expected: "Scroll speed noticeably faster after approximately 10 obstacles have passed"
    why_human: "Perceptual speed increase requires real-time play observation"
  - test: "First input transitions from idle to playing with no extra keypress"
    expected: "Single Space/click/tap starts game AND causes immediate jump (pendingJump=true pattern)"
    why_human: "State transition timing on first input requires live browser interaction"
  - test: "Space key does not scroll page during play"
    expected: "Pressing Space triggers jump only, browser page does not scroll"
    why_human: "preventDefault behavior requires browser observation"
  - test: "Delta-time resilience after tab switch"
    expected: "After switching away for 3+ seconds, Samus does not teleport on return"
    why_human: "dt cap behavior requires tab switching in live browser"
---

# Phase 6: Physics and Input Verification Report

**Phase Goal:** Samus moves under gravity, responds to all three input methods, obstacles scroll and speed up, and the game transitions cleanly between idle and playing states
**Verified:** 2026-04-20T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A pure updateGame function advances Samus position under gravity each frame | VERIFIED | gameLoop.ts line 83: `state.samusVY += PHYSICS.gravity * dt`, line 87: `state.samusY += state.samusVY * dt`. Floor clamp at line 90, ceiling clamp at line 96. No React imports. |
| 2 | Obstacles scroll left and recycle to the right edge with randomized gaps | VERIFIED | gameLoop.ts lines 100-122: speed computed, each obstacle x decremented by `speed * dt`, recycled to `canvasWidth + 50` with fresh `randomGap(canvasHeight)` when fully off-screen |
| 3 | Speed multiplier increases by 0.15 every 10 obstacles cleared | VERIFIED | gameLoop.ts lines 114-119: `obstaclesCleared++` on recycle, `if obstaclesCleared > 0 && obstaclesCleared % 10 === 0` increments `speedMultiplier += PHYSICS.speedIncrement` (0.15), capped at 2.5 |
| 4 | triggerJump sets Samus velocity to fixed upward value (Flappy Bird style) | VERIFIED | gameLoop.ts line 128: `state.samusVY = -PHYSICS.jumpVelocity` — always applied, no mid-air guard |
| 5 | Samus falls under gravity and jumps upward on spacebar, click, or touch | VERIFIED (wiring) | SamusRunGame.tsx: window keydown listener (Space/ArrowUp), canvas click listener, canvas touchstart with `{passive: false}` — all route to `handleInput` which calls `triggerJump(game)` during playing state |

**Score:** 5/5 truths verified (automated)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/samus-run/constants.ts` | PHYSICS object and OBSTACLE_SPACING_RATIO | VERIFIED | Contains `export const PHYSICS` (7 keys: gravity, jumpVelocity, terminalVelocity, baseScrollSpeed, speedIncrement, maxSpeedMultiplier, dtCap) and `export const OBSTACLE_SPACING_RATIO = 0.6`. All pre-existing exports (NORFAIR, SAMUS, GAME) untouched. |
| `components/samus-run/gameLoop.ts` | GamePhysicsState, Obstacle, createInitialGameState, updateGame, triggerJump | VERIFIED | All 5 exports confirmed. File is 130 lines, pure computation, zero React imports. Imports from `./constants` only. |
| `components/samus-run/SamusRunGame.tsx` | rAF game loop, unified input handlers, dynamic drawScene, screen-ref mirror | VERIFIED | requestAnimationFrame loop (Effect B), cancelAnimationFrame cleanup, screenRef mirror (lines 92-99), handleInput useCallback, three input listeners (keydown/click/touchstart), drawScene accepts optional physics param, physics-driven obstacle and Samus rendering. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `gameLoop.ts` | `constants.ts` | `import { PHYSICS, GAME, OBSTACLE_SPACING_RATIO }` | WIRED | Line 1 of gameLoop.ts confirmed. Pattern matches. |
| `SamusRunGame.tsx` | `gameLoop.ts` | `import { GamePhysicsState, createInitialGameState, updateGame, triggerJump }` | WIRED | Line 10 of SamusRunGame.tsx confirmed. |
| `SamusRunGame.tsx rAF loop` | `drawScene` | `drawScene(ctx, "playing", r.width, r.height, game)` | WIRED | Line 165 of SamusRunGame.tsx confirmed — physics state passed to drawScene each frame. |
| `SamusRunGame.tsx input handlers` | `screenRef.current` | reads current screen state from useRef mirror | WIRED | handleInput reads `screenRef.current` (line 184, 187) to avoid stale closure. screenRef synced in dedicated useEffect (lines 97-99). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SamusRunGame.tsx` (playing state) | `physics.obstacles`, `physics.samusY`, `physics.samusVY` | `updateGame()` mutates gameRef.current each frame from physics math in gameLoop.ts | Yes — frame-rate-independent math from PHYSICS constants, no static/hardcoded positions during play | FLOWING |
| `drawScene` obstacle rendering | `obs.x`, `obs.gapTop`, `obs.gapBottom` | randomGap() generates values from canvas dimensions, recycled with new random values | Yes — randomized each recycle via `Math.random()` bounded by playArea | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| gameLoop.ts exports exist | `grep -c "export function updateGame" components/samus-run/gameLoop.ts` | 1 | PASS |
| gameLoop.ts no React imports | `grep -c "React" components/samus-run/gameLoop.ts` | 0 | PASS |
| PHYSICS constants present | `grep -c "export const PHYSICS" components/samus-run/constants.ts` | 1 | PASS |
| rAF loop in SamusRunGame | `grep -c "requestAnimationFrame" components/samus-run/SamusRunGame.tsx` | 2 (start + recursive call) | PASS |
| touchstart passive:false | `grep -c "passive: false" components/samus-run/SamusRunGame.tsx` | 1 | PASS |
| dt cap applied | `grep -c "PHYSICS.dtCap" components/samus-run/SamusRunGame.tsx` | 1 | PASS |
| Commits exist | `git log --oneline` | e68cdb9, be90204, dd1f846 all present | PASS |
| Next.js build passes | `npx next build` | All 8 static pages generated, /projects/samus-run present, no errors | PASS |
| DEBUG_FORCE_JUMP removed | `grep "DEBUG_FORCE_JUMP" SamusRunGame.tsx` | Not found | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| GAME-01 | 06-01, 06-02 | Samus falls under gravity and jumps upward on valid input | SATISFIED | gravity in updateGame line 83; jump in triggerJump line 128; wired via handleInput in SamusRunGame.tsx |
| GAME-02 | 06-01, 06-02 | Rock wall obstacles scroll right-to-left with randomized gap heights | SATISFIED | updateGame lines 100-122; randomGap helper called on each recycle |
| GAME-03 | 06-01, 06-02 | Scroll speed increases after ~10 obstacles cleared | SATISFIED | updateGame lines 114-119; speedMultiplier incremented by PHYSICS.speedIncrement (0.15) every 10 cleared |
| GAME-07 | 06-02 | Game transitions cleanly from idle to playing on first valid input | SATISFIED | handleInput dispatches START on idle; pendingJump=true set at rAF loop init; screenRef pattern avoids stale closure |
| INPUT-01 | 06-02 | Spacebar and ArrowUp keyboard inputs trigger jump | SATISFIED | onKeyDown checks `e.code === "Space" \|\| e.code === "ArrowUp"` with e.preventDefault() |
| INPUT-02 | 06-02 | Mouse click on canvas triggers jump | SATISFIED | canvas.addEventListener("click", onClick) at line 218 |
| INPUT-03 | 06-02 | Touchstart on canvas triggers jump (mobile/iPad) | SATISFIED | canvas.addEventListener("touchstart", onTouchStart, { passive: false }) at line 219; e.preventDefault() in handler |
| INPUT-04 | 06-02 | First valid input (idle screen) transitions to playing | SATISFIED | handleInput reads screenRef.current; if "idle" dispatches START; pendingJump=true ensures immediate jump |

Note: GAME-01 through INPUT-04 are phase-level requirements defined in 06-RESEARCH.md, not in the global REQUIREMENTS.md. This is consistent with prior samus-run phases (4 and 5), which likewise define game-specific IDs (CAT-05, GAME-04, DISPLAY-01, etc.) in phase research docs. The global REQUIREMENTS.md tracks only site-level v1 requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `SamusRunGame.tsx` | 230 | Comment: "DPR-aware canvas background (replaces Phase 4 placeholder div)" | Info | Historical comment, not a stub — canvas is fully functional |

No actionable anti-patterns found. No TODOs, FIXMEs, empty handlers, or stub returns. The comment on line 230 is informational history, not a placeholder.

### Human Verification Required

Six behaviors require live browser observation. All automated checks pass, but game physics and input response cannot be verified without running the application.

#### 1. Gravity and Jump Feel

**Test:** Run `npx next dev`, open http://localhost:3000/projects/samus-run, press Spacebar to start game, observe Samus behavior.
**Expected:** Samus falls downward under gravity when not jumping. Pressing Space/ArrowUp/click/tap causes Samus to move upward. Jump sprite (curled pose) visible while rising; idle sprite while falling or on floor.
**Why human:** requestAnimationFrame rendering and physics feel cannot be verified from static code analysis.

#### 2. Obstacle Scrolling and Gap Randomization

**Test:** After starting game, observe rock wall obstacles over several cycles.
**Expected:** Rock wall pairs scroll continuously right-to-left. When each obstacle exits left edge, it reappears on right with a different gap height. Gaps appear at varying vertical positions each time.
**Why human:** Visual scrolling and gap variation requires live rendering observation.

#### 3. Speed Progression After 10 Obstacles

**Test:** Play through approximately 10+ obstacles, observe scroll speed.
**Expected:** After approximately 10 obstacles have passed, scrolling speed is noticeably faster. Speed continues increasing every 10 obstacles up to the max multiplier.
**Why human:** Perceptual speed increase requires real-time play to feel.

#### 4. First Input Starts Game with Immediate Jump

**Test:** From idle screen, press Spacebar once.
**Expected:** Single input both transitions to playing state AND causes Samus to immediately jump (no second press required). pendingJump=true pattern means the transition input also counts as the first jump.
**Why human:** Timing of state transition and first jump frame requires live browser interaction.

#### 5. Space Key Does Not Scroll Page

**Test:** During active gameplay, press Space key repeatedly.
**Expected:** Page does not scroll. Only Samus jumps. e.preventDefault() blocks default browser Space behavior.
**Why human:** Browser scroll prevention requires live browser observation.

#### 6. Tab Switch Resilience (Delta-Time Cap)

**Test:** Start game, switch to another browser tab for 3+ seconds, switch back.
**Expected:** Samus does not teleport. Physics resume smoothly. dt cap of 0.05s (PHYSICS.dtCap) prevents accumulated time explosion.
**Why human:** Tab switch behavior requires live browser interaction.

### Gaps Summary

No gaps found. All automated verification checks pass:
- gameLoop.ts is substantive (130 lines, all 5 exports, correct physics implementation)
- constants.ts has all required PHYSICS keys and OBSTACLE_SPACING_RATIO
- SamusRunGame.tsx is fully wired (rAF loop, all 3 input methods, screenRef mirror, physics-driven drawScene)
- Data flows from randomGap() → obstacle state → drawScene → canvas
- Build passes cleanly with /projects/samus-run generated as static page
- All 3 commits exist in git history

Six items require human browser verification before the phase can be marked fully passed.

---

_Verified: 2026-04-20T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
