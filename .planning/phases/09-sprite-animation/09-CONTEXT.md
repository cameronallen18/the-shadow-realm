# Phase 9: Sprite Animation - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace procedural shape-Samus with real Super Metroid sprite sheet draws. Delivers:
- Idle frame from sprite sheet on all screens (idle, gameover, playing)
- Looping spin jump animation while airborne (frame-rate independent via dt accumulator)
- Screw attack visual state triggered by re-jumping while airborne
- Pixel-perfect nearest-neighbor scaling enforced
- Hitbox constants updated to match real sprite body dimensions (QUAL-02)
- Shape-Samus fallback preserved when spritesRef.current.samus === null

Background scroll (Phase 10) is out of scope.

</domain>

<decisions>
## Implementation Decisions

### Screw Attack Trigger
- **D-01:** Screw attack frames play when the player jumps again while already airborne (`samusVY !== 0` at jump time). This mirrors Super Metroid's space jump mechanic semantically.
- **D-02:** Screw attack is **visual only** — no physics change. `triggerJump()` already applies velocity on every jump (Flappy Bird style); no change to that behavior.
- **D-03:** AnimState closure tracks a boolean `isScrewAttack`. Flips `true` when a jump fires while airborne. Resets to `false` when Samus lands (samusY reaches floor).

### Sprite Draw Scope
- **D-04:** Real sprite replaces shape-Samus on **all screens** — idle, gameover, and playing — once `spritesRef.current.samus` is loaded. No mixed shape/sprite states.
- **D-05:** When `spritesRef.current.samus === null` (loading), shape-Samus fallback renders on all screens. No error thrown.

### Jump Direction
- **D-06:** Always use **right-facing frames** (`spinJumpR`, `screwAttackR`). Left-facing sections (`spinJumpL`, `screwAttackL`) are not used — Samus always runs right, no direction tracking needed.

### Hitbox Update Method (QUAL-02)
- **D-07:** Add a `DEBUG_HITBOX` flag to `drawScene` that renders a visible debug rect using current `COLLISION.samusWidth` / `COLLISION.samusHeight`. Tune values visually until the rect hugs the real sprite body, then bake the final constants and remove the flag.

### Pixel-Perfect Scaling
- **D-08:** `imageSmoothingEnabled = false` enforced on every draw call that uses the sprite sheet. Already established as a constraint in STATE.md — no change, just enforcement.
- **D-09:** All 8 `drawImage` arguments passed through `Math.floor()` — fractional pixel coords silently blur pixel art. Already established in STATE.md.

### Animation State Structure
- **D-10:** `AnimState` lives in the **rAF closure** (not `useRef`), consistent with the v1.2 roadmap decision. Auto-resets on game restart without explicit reset logic.
- **D-11:** AnimState shape: `{ frame: number; accumulator: number; isScrewAttack: boolean }`. `frame` indexes into the current section's frames array. `accumulator` tracks dt for frame-rate-independent advancement.

### Claude's Discretion
- Frame advance rate (fps) for spin jump / screw attack animation — pick a value that looks good at 60/120Hz (8-12fps is typical for Super Metroid spin jump)
- Whether idle frame animates at 1fps or is completely static (single frame section, 1 frame in SPRITE_LAYOUT — static is correct)
- Exact `drawImage` call signature and source rect calculations — use `SPRITE_LAYOUT` constants already in `constants.ts`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game Component
- `components/samus-run/SamusRunGame.tsx` — Main component. `spritesRef`, Effect D (image loader), `drawScene()`, rAF loop (Effect B), static render (Effect A). Phase 9 modifies `drawScene` and adds AnimState to Effect B closure.

### Drawing Modules
- `components/samus-run/canvas/drawSamus.ts` — Procedural shape fallback (`drawSamusIdle`, `drawSamusJump`). Phase 9 adds a new sprite-sheet draw function alongside these; fallback functions are preserved.

### Constants
- `components/samus-run/constants.ts` — `SPRITE_LAYOUT` (cellSize=96, contentSize=81, contentOffset=17, section origins), `COLLISION` (samusWidth/samusHeight — will be updated by D-07), `GAME.samusScale`, `GAME.samusXRatio`, `GAME.floorRatio`

### Game Loop
- `components/samus-run/gameLoop.ts` — `GamePhysicsState` type (samusY, samusVY, obstaclesCleared). AnimState reads `samusY` and `samusVY` to determine which section to draw.

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `spritesRef.current.samus`: offscreen `HTMLCanvasElement` — ready to pass directly to `drawImage`. Magenta already converted to alpha. Source-of-truth for all sprite draws.
- `SPRITE_LAYOUT`: all section origins and frame counts already measured and committed. Phase 9 consumes these — no re-measurement needed.
- `drawSamusIdle` / `drawSamusJump`: shape fallback functions in `drawSamus.ts`. Phase 9 calls these when `spritesRef.current.samus === null`.

### Established Patterns
- `drawScene()` receives `(ctx, screen, width, height, physics?)` — sprite draw function will be called from within this function, receiving the same arguments
- `GAME.samusScale` multiplier already plumbed into shape draw calls — sprite draw should respect it
- `samusY` is "bottom of sprite" semantics (floor position) in the existing code — sprite draw must anchor consistently
- No `useRef` for animation state — AnimState belongs in the rAF closure per D-10

### Integration Points
- Effect B (rAF loop) in SamusRunGame.tsx — AnimState is declared inside this effect, alongside `lastScore` and `lastTs`. Phase 9 adds `animState` here.
- `drawScene()` needs access to `spritesRef` and `animState` — pass as additional arguments or close over them
- `handleInput` callback calls `triggerJump(game)` — AnimState's `isScrewAttack` flag must be set here when Samus is already airborne at input time

</code_context>

<specifics>
## Specific Ideas

- Screw attack trigger mirrors Super Metroid space jump mechanic — semantically correct, not arbitrary
- Debug hitbox overlay (D-07) should be gated behind a constant flag (`DEBUG_HITBOX = false`) so it can be flipped on locally without code archaeology

</specifics>

<deferred>
## Deferred Ideas

- Left-facing jump frames (`spinJumpL`, `screwAttackL`) — sections measured and in SPRITE_LAYOUT but unused in this game. Available if a future phase adds directional movement.
- Obstacle column texturing with Norfair rock sprites — cosmetic only, explicitly out of scope per REQUIREMENTS.md (defer to v1.3+)
- Idle breathing animation — not present in Super Metroid ROM data per REQUIREMENTS.md out-of-scope

</deferred>

---

*Phase: 09-sprite-animation*
*Context gathered: 2026-04-24*
