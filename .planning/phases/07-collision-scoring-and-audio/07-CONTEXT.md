# Phase 7: Collision, Scoring, and Audio - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the game fully winnable and losable: Samus dies on collision with rock walls, scores points when clearing obstacle gaps, high score persists across sessions via localStorage, and three sound effects (jump, score, death) fire on correct events using Web Audio oscillators.

</domain>

<decisions>
## Implementation Decisions

### Sound Design
- **D-01:** Use Web Audio API oscillators only — no audio files, no npm packages. All three sounds generated in JS.
- **D-02:** Minimal/clean sound vibe — jump: short rising tone, score: quick high blip, death: descending tone or short buzz. Simple and non-annoying on loop.
- **D-03:** AudioContext must be unlocked on first user gesture (iOS Safari requirement). First tap/click/keydown is already the game-start input — use that moment to create and unlock the AudioContext.

### Collision Hitbox
- **D-04:** Reduced hitbox — approximately 60-70% of sprite size, centered on Samus. Grazing a wall should not kill the player. Matches standard mobile endless-runner feel.
- **D-05:** Ceiling is a soft boundary — ceiling hit clamps position (current behavior preserved), not lethal. Only rock walls end the game. Floor already clamps safely and stays non-lethal.

### Scoring
- **D-06:** Score increments the moment Samus's X position passes the right edge of an obstacle. Use the existing `scored` flag on each `Obstacle` in `GamePhysicsState` — set it when Samus clears the gap to prevent double-counting.
- **D-07:** Live score counter during play — score updates in real-time as obstacles are cleared, not just on game-over. Implement via a score ref read by the HUD each rAF frame (avoids flooding React state re-renders every frame).

### High Score UX
- **D-08:** localStorage key: `samusRunHighScore`.
- **D-09:** Show a subtle "new best" label on the game-over screen when the current score beats the stored high score. Keep it minimal — no animation, just a text label.
- **D-10:** Load high score from localStorage on component mount; update localStorage whenever the game-over screen is reached and the current score exceeds the stored value.

### Claude's Discretion
- Exact oscillator frequencies and durations for the three sounds — make them distinct and non-irritating, consistent with the minimal vibe.
- Whether to implement audio as a standalone `audioManager.ts` module or inline within `SamusRunGame.tsx` — use best judgment given the three-sound scope.
- Exact hitbox dimensions (the ~60-70% guideline is the constraint, exact pixel math is up to the planner).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game State
- `components/samus-run/gameLoop.ts` — `GamePhysicsState`, `Obstacle` types, `updateGame`, `triggerJump`. The `scored` flag on `Obstacle` is the per-obstacle dedup mechanism for scoring. `gameOver` boolean is currently always false — collision detection wires it to `true`.
- `components/samus-run/constants.ts` — `PHYSICS`, `GAME`, `NORFAIR`, `SAMUS` palettes, `OBSTACLE_SPACING_RATIO`.

### Component
- `components/samus-run/SamusRunGame.tsx` — Main component with `gameReducer`, `GameState` (screen, score, highScore), `drawScene`, rAF loop (Effect B), static render (Effect A), and unified input handler. Score is currently dispatched only on `GAME_OVER` — live counter wiring goes here.

### Phase Goals
- `.planning/ROADMAP.md` §Phase 7 — success criteria (collision, score, high score, audio, iOS unlock).

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Obstacle.scored: boolean` — already on every obstacle in `GamePhysicsState`, ready for per-gap scoring. Currently reset on obstacle recycle but never set to `true`.
- `GamePhysicsState.gameOver: boolean` — field exists, always `false`. Collision detection sets it to `true` to trigger game-over dispatch.
- `gameReducer` — already handles `GAME_OVER` with score payload and `highScore` tracking in memory. Need to add localStorage read on init and write on `GAME_OVER`.
- `triggerJump` in `gameLoop.ts` — called on every input event. AudioContext unlock can piggyback on the first call.

### Established Patterns
- Physics state lives in `useRef` (not `useState`) — score counter during play should follow this pattern (scoreRef, not setState per frame).
- `screenRef` mirrors React state for use inside mount-only event listeners — same pattern applies if audio state needs to be read inside rAF loop.
- Input handlers registered in a mount-only `useEffect` with cleanup — AudioContext unlock hooks into this same effect.

### Integration Points
- `updateGame()` in `gameLoop.ts` — collision detection and per-gap scoring logic go here (pure function, no side effects, returns void mutating state).
- `SamusRunGame.tsx` rAF loop (Effect B) — reads `game.gameOver` to dispatch `GAME_OVER`. Score sync and sound calls happen inside the same loop.
- `gameReducer` initial state `{ screen: "idle", score: 0, highScore: 0 }` — `highScore` init should read from `localStorage.getItem("samusRunHighScore")`.

</code_context>

<specifics>
## Specific Ideas

- "New best" label on game-over screen: minimal, consistent with the site's understated style — no animation, just a small cool-toned text label (matching `text-[#9ba3ad]` palette already in use for score display).
- Sound design: aim for non-irritating sounds a player will hear hundreds of times. Short attack, quick decay. Jump tone rises, score tone is a high clean blip, death tone descends or buzzes briefly.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-collision-scoring-and-audio*
*Context gathered: 2026-04-23*
