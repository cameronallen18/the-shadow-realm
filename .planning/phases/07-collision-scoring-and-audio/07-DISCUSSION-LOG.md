# Phase 7: Collision, Scoring, and Audio - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 07-collision-scoring-and-audio
**Areas discussed:** Sound design, Collision hitbox, Scoring moment, High score UX

---

## Sound Design

| Option | Description | Selected |
|--------|-------------|----------|
| Web Audio oscillators | Synth tones in JS — no files, no npm packages, works offline | ✓ |
| Real .mp3 / .ogg files | Actual audio samples in /public/sounds/ | |
| Mix: oscillators + one file | Oscillators for most SFX, one file for key sound | |

**User's choice:** Web Audio oscillators

---

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal / clean | Jump: short rising tone. Score: quick high blip. Death: descending tone or buzz. | ✓ |
| Retro / chiptune | NES-style square wave swoop, coin blip, Metroid alarm. | |
| You decide | Leave sound design to Claude. | |

**User's choice:** Minimal / clean
**Notes:** Simple, non-annoying sounds for a game heard on loop.

---

## Collision Hitbox

| Option | Description | Selected |
|--------|-------------|----------|
| Reduced hitbox | ~60-70% of sprite size, centered. Grazing a wall doesn't kill. | ✓ |
| Tight bounding box | Hitbox matches visible sprite bounds. Unforgiving. | |
| You decide | Leave hitbox tuning to Claude. | |

**User's choice:** Reduced hitbox

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ceiling = death | Hitting the top kills Samus. Matches Flappy Bird behavior. | |
| Ceiling = bounce/clamp | Ceiling is soft — clamp position, no penalty. | ✓ |
| Floor = death too | Both ceiling and floor are lethal. | |

**User's choice:** Ceiling = bounce/clamp
**Notes:** Only rock walls are lethal. Ceiling and floor remain safe boundaries.

---

## Scoring Moment

| Option | Description | Selected |
|--------|-------------|----------|
| When Samus passes the gap | Score increments when Samus's X crosses right edge of obstacle. | ✓ |
| When obstacle exits screen | Keep current obstaclesCleared behavior — score updates after the obstacle scrolls off. | |

**User's choice:** When Samus passes the gap
**Notes:** Uses existing `scored` flag on `Obstacle` to prevent double-counting.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, live score counter | Score updates in real-time via ref, HUD reads each rAF frame. | ✓ |
| No, final score only on game-over | HUD stays at 0 during play. | |

**User's choice:** Yes, live score counter

---

## High Score UX

| Option | Description | Selected |
|--------|-------------|----------|
| Silent persist | High score saves and shows on screens — no fanfare. | |
| New best indicator | Subtle "new best" label on game-over screen when score beats stored high score. | ✓ |

**User's choice:** New best indicator
**Notes:** Minimal — no animation, just a text label. Consistent with the understated site vibe.

---

## Claude's Discretion

- Exact oscillator frequencies and durations for the three sounds
- Whether audio logic lives in a standalone module or inline in SamusRunGame.tsx
- Exact hitbox pixel dimensions (within the ~60-70% guideline)

## Deferred Ideas

None.
