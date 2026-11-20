---
quick_id: 261120-spn
slug: fix-samus-run-pillar-spawn-and-gameover-frame
status: complete
completed: "2026-11-20"
branch: fix/samus-run-spawn-and-gameover
tasks_completed: 3
files_modified: 3
note: "Done in a Claude chat session (no GSD commands available there); logged here to keep planning artifacts in sync."
key_decisions:
  - "Obstacles are a growable list: spawn while the rightmost pillar is left of the right edge, drop pillars once fully off the left edge"
  - "First pillar spawns FIRST_OBSTACLE_LEAD_PX (420) ahead of Samus instead of past the right edge, so lead-in time is the same on every screen width"
  - "Game loop still stops before drawing the death frame (WR-03); Effect A redraws it from gameRef + lastFrameRef on the gameover screen"
---

# Quick Task 261120-spn: Pillar spawning on wide screens + game-over frame

**One-liner:** Pillars now spawn off-screen at any width (no mid-screen pop-in on desktop) and the game-over screen shows the frozen frame where Samus died instead of the idle scene.

## Problems

1. Only 2 obstacles existed, recycled 480px apart. On screens wider than ~960px the right side of the screen was empty and recycled pillars appeared mid-screen (x≈1300 on 1920px). The first pillar started at `canvasWidth + 100`, giving ~7s of empty runway on 1080p.
2. On death the loop stopped before drawing, then Effect A redrew the idle scene (Samus standing next to the demo pillar) behind "game over", so the player never saw what they hit.

## Changes

### constants.ts
- Added `FIRST_OBSTACLE_LEAD_PX = 420`

### gameLoop.ts
- `createInitialGameState`: first pillar at `samusX + FIRST_OBSTACLE_LEAD_PX`, then fills ahead past the right edge
- New `spawnObstacle` / `fillObstaclesAhead` helpers; `obstaclesSpawned` now counts every spawn (difficulty curve unchanged)
- Scrolling: filter out off-screen pillars, then top up on the right (replaces 2-pillar recycling)

### SamusRunGame.tsx
- `lastFrameRef` stores anim pose, bg scroll offset, and theme each frame
- Effect A draws the final game frame on the gameover screen (also on resize)
- Gameover overlay gets `bg-black/50` so text stays readable over the busier scene

## Verification

Headless Chrome with a bot player against a local production build:
- 390×844, 1280×720, 1920×1080: bot cleared 45+ pillars on each; ~60 pillars spawned per run with zero mid-game on-screen spawns
- Gameover screen shows the death frame on phone and desktop; restart → idle → start works across repeated runs, no page errors
