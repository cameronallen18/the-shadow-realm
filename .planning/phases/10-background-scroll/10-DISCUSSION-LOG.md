# Phase 10: Background Scroll - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 10-background-scroll
**Areas discussed:** Background coverage, norfair_lower.png, Idle/gameover scroll

---

## Background coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Full canvas | Image tiles horizontally to fill the entire canvas height. Lava floor drawn on top. | ✓ |
| Sky/midground band only | Image covers only the top ~85% (above lava). Keeps lava procedural. | |
| Custom coverage | User-specified area | |

**User's choice:** Full canvas
**Notes:** Simplest approach — one draw pass, no zone splitting.

---

## norfair_lower.png

| Option | Description | Selected |
|--------|-------------|----------|
| Skip it | Use only norfair_upper.png. norfair_lower stays in public/sprites/ for future. | ✓ |
| Use it for the lower zone | Load both PNGs in Effect D; tile lower in the bottom zone. | |
| Use it as a second horizontal layer | Overlay at partial opacity for parallax/depth. | |

**User's choice:** Skip it
**Notes:** Keep Phase 10 focused; norfair_lower deferred to future.

---

## Idle/gameover scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Static on idle/gameover | offset=0 on static screens; scroll only during Effect B rAF. | ✓ |
| Scroll on all screens | Second rAF in Effect A for ambient movement. | |
| Idle scrolls, gameover static | Split behavior between screens. | |

**User's choice:** Static on idle/gameover
**Notes:** Clean separation — still world on idle/gameover, moving world during play.

---

## Claude's Discretion

- BG_SCROLL_SPEED value
- Whether to add a drawBackground helper or draw inline
- Tile loop implementation details

## Deferred Ideas

- norfair_lower.png for zone layering — future phase
- Parallax scroll — BG_SCROLL_SPEED already decoupled, easy to add later
- Ambient scroll on idle screen — requires second rAF, not worth it for v1.2
