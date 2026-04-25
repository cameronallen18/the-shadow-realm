# Phase 9: Sprite Animation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 09-sprite-animation
**Areas discussed:** Screw attack trigger, Sprite draw in idle/gameover screens, Jump direction facing, Hitbox update method

---

## Screw Attack Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Re-jump while airborne | If Samus is already in the air and the player jumps again, switch to screw attack frames | ✓ |
| After N seconds airborne | Automatically escalate to screw attack frames after a time threshold | |
| Random / cosmetic only | Pick screw attack frames randomly on some jumps as pure visual variety | |

**User's choice:** Re-jump while airborne

---

## Screw Attack Physics

| Option | Description | Selected |
|--------|-------------|----------|
| Visual only — no physics change | Re-jump while airborne just swaps to screw attack frames; physics unchanged | ✓ |
| Same physics, same visual toggle | No distinction; screw attack frames play randomly or not at all | |

**User's choice:** Visual only — no physics change

---

## Sprite Draw in Idle/Gameover Screens

| Option | Description | Selected |
|--------|-------------|----------|
| Replace on all screens | Once loaded, use real idle frame on idle screen, gameover screen, and during play | ✓ |
| Play only | Shape Samus stays on idle and gameover; real sprites only during active play | |

**User's choice:** Replace on all screens

---

## Jump Direction Facing

| Option | Description | Selected |
|--------|-------------|----------|
| Always right-facing | Use spinJumpR and screwAttackR exclusively; no direction tracking | ✓ |
| Mirror automatically | Store only right-facing, use ctx.scale(-1,1) to mirror when needed | |

**User's choice:** Always right-facing

---

## Hitbox Update Method (QUAL-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Debug overlay during dev, then bake constants | Add DEBUG_HITBOX flag, tune visually, bake final values | ✓ |
| Measure from sprite sheet directly | Open PNG in image editor, measure non-transparent body pixels, hardcode | |

**User's choice:** Debug overlay during dev, then bake constants

---

## Claude's Discretion

- Frame advance rate for spin jump / screw attack animation
- Whether idle frame is static or animated (it's 1 frame in SPRITE_LAYOUT — static)
- Exact drawImage call signature and source rect calculations

## Deferred Ideas

- Left-facing jump frames — available in SPRITE_LAYOUT but no use case in current game
- Obstacle column texturing — cosmetic, out of scope until v1.3+
- Idle breathing animation — not in ROM data, out of scope
