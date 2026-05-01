---
quick_id: 260501-ayo
status: complete
date: 2026-05-01
commits:
  - 3fe0879
  - 27e424c
---

# Quick Task 260501-ayo: Fix idle animation regression in SamusRunGame.tsx

## What was done

Reverted Effect A in `SamusRunGame.tsx` from a RAF animation loop back to a static render + ResizeObserver. Idle and gameover screens now display Samus in a static standing pose (frame 0) instead of cycling through `runRight` frames. Effect B (in-game loop) was not touched.

Fixed the Playwright test that was asserting the wrong behavior — replaced "running animation advances frames" (expected diffCount > 20) with "Samus is static on idle screen" (expected diffCount < 10).

## Results

- 7/7 Playwright tests pass
- Idle screen: static Samus standing pose (no RAF loop)
- Gameover screen: static Samus standing pose (no RAF loop)
- In-game: running/spin animation unchanged (Effect B intact)

## Commits

- `3fe0879` — fix(samus-run): revert idle screen to static render — no RAF loop
- `27e424c` — test(samus-run): fix animation test to assert idle=static
