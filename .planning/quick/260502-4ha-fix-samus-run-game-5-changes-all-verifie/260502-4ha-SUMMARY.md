---
quick_id: 260502-4ha
slug: fix-samus-run-game-5-changes-all-verifie
status: complete
completed: "2026-05-02"
duration: "~3.5 minutes"
tasks_completed: 4
files_modified: 4
commits:
  - 70246c4
  - 7b27210
  - 9a36566
key_decisions:
  - "runRight sy fixed to 1200 (was 1152, inside section 09 label bar at y=1168-1187)"
  - "spinJump (section 19) added for early-game airborne; screwAttackL kept for late-game (>= 15 gaps)"
  - "obstaclesSpawned initialized to 2 (two initial obstacles) so difficulty curve starts at n=3 on first recycle"
---

# Quick Task 260502-4ha: Fix Samus-Run Game — Summary

**One-liner:** Applied 5 pixel-verified fixes: runRight banner bleed corrected (sy 1152→1200), spinJump section added, pillar width reduced 40→30px, gap difficulty curve added (n<=5 max, n<=15 half-range, n>15 full), late-jump animation switching at gap 15.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix runRight + add spinJump + narrow pillars | 70246c4 | `constants.ts` |
| 2 | Gap difficulty curve | 7b27210 | `gameLoop.ts` |
| 3 | useLateJump animation switch | 9a36566 | `drawSamus.ts`, `SamusRunGame.tsx` |
| 4 | Playwright visual verification | (no commit — read-only) | — |

## Changes Made

### constants.ts
- `runRight.sy`: 1152 → 1200 (was drawing from inside the section 09 label bar at y=1168-1187; cells start at y=1200)
- `runRight.sh`: 100 → 53 (pixel-measured: last sprite row ends at y=1268, sy_draw=1217, footRow=51)
- `runRight.footRow`: 99 → 51
- Added `spinJump`: `{ sy: 3248, frames: 9, sh: 46, footRow: 44 }` (section 19, pixel-verified)
- `GAME.obstacleWidth`: 40 → 30 (25% narrower pillars)

### gameLoop.ts
- Added `obstaclesSpawned: number` to `GamePhysicsState`
- Replaced `randomGap()` with `gapForObstacle(n, canvasHeight)`:
  - n <= 5: always `maxGap` (easiest — learning phase)
  - 6 <= n <= 15: `minGap + random * (maxGap - minGap) / 2` (half-range ramp)
  - n > 15: full-range random (current max challenge)
- Initial obstacles use `gapForObstacle(1)` and `gapForObstacle(2)`; `obstaclesSpawned` initialized to 2
- Recycle: increments `state.obstaclesSpawned` BEFORE calling `gapForObstacle`

### drawSamus.ts
- Added `useLateJump?: boolean` to `AnimState` interface
- Destructures `spinJump` from `SPRITE_LAYOUT` alongside existing imports
- Airborne section: `animState?.useLateJump ? screwAttackL : spinJump` (was always `screwAttackL`)

### SamusRunGame.tsx
- `animState` init includes `useLateJump: false`
- Per-frame: `animState.useLateJump = game.obstaclesCleared >= 15`
- Frame advance uses correct section for each animation state
- Updated `drawScene` signature to include `useLateJump?` in animState type

## Visual Verification

Playwright screenshots confirmed:
- Idle state: Samus sprite clean, no banner/label text visible above sprite
- Playing state: Pillar visibly narrower (~30px), game runs without errors
- TypeScript: 0 errors across all 4 changed files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated drawScene animState type signature**
- **Found during:** Task 3
- **Issue:** `drawScene` function had inline type `{ frame: number; accumulator: number; isScrewAttack: boolean }` missing the new `useLateJump?` field — would cause a type mismatch when passing the extended animState
- **Fix:** Added `useLateJump?: boolean` to the `drawScene` animState parameter type
- **Files modified:** `SamusRunGame.tsx`
- **Commit:** 9a36566

**2. [Rule 2 - Missing Critical] Fixed frame-advance section reference for spinJump**
- **Found during:** Task 3
- **Issue:** The frame-advance block in Effect B still referenced `SPRITE_LAYOUT.screwAttackL` for the airborne section even after adding spinJump. For n=9 frames both sections match, but correctness requires using the actual active section.
- **Fix:** Changed frame-advance to use `animState.useLateJump ? screwAttackL : spinJump` for the airborne section
- **Files modified:** `SamusRunGame.tsx`
- **Commit:** 9a36566

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `components/samus-run/constants.ts` — modified, committed in 70246c4
- `components/samus-run/gameLoop.ts` — modified, committed in 7b27210
- `components/samus-run/canvas/drawSamus.ts` — modified, committed in 9a36566
- `components/samus-run/SamusRunGame.tsx` — modified, committed in 9a36566
- All 3 commits verified in git log
