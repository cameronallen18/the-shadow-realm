---
quick_id: 260501-ayo
slug: fix-idle-animation-regression-in-samusru
description: Fix idle animation regression in SamusRunGame.tsx
date: 2026-05-01
status: in_progress
must_haves:
  truths:
    - Idle and gameover screens show a static Samus (frame 0, no RAF loop)
    - In-game ground running animation remains intact (Effect B unchanged)
    - Playwright test asserts idle=static (not idle=animated)
  artifacts:
    - components/samus-run/SamusRunGame.tsx (Effect A replaced)
    - tests/samus-run.spec.ts (animation test replaced)
---

# Quick Plan 260501-ayo: Fix idle animation regression in SamusRunGame.tsx

## Context

Effect A in SamusRunGame.tsx was modified during sprite animation work to run a RAF loop animating `runRight` frames on idle/gameover screens. This is wrong — the user wants a static standing pose on non-gameplay screens. The Playwright test "running animation advances frames" passes but tests the wrong behavior (idle animation, not in-game running). Effect B (in-game loop) is correct and must not change.

## Tasks

### Task 1: Revert Effect A to static render + ResizeObserver

**Files:** `components/samus-run/SamusRunGame.tsx`

**Action:** Replace Effect A (lines 121-158) — the RAF loop that animates `runRight` frames on idle/gameover — with a static single-render + ResizeObserver. Draw frame 0, `isScrewAttack: false`, no animation loop.

**Replace:**
```tsx
// Effect A: rAF loop for idle and gameover states — animates Samus running in place
useEffect(() => {
  if (state.screen === "playing") return;
  // ... RAF loop with FRAME_DURATION, animState.frame cycling ...
}, [state.screen, spritesLoaded]);
```

**With:**
```tsx
// Effect A: static render for idle and gameover states
useEffect(() => {
  if (state.screen === "playing") return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const staticAnimState = { frame: 0, accumulator: 0, isScrewAttack: false };

  function render() {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = setupCanvas(cvs);
    if (!ctx) return;
    const rect = cvs.getBoundingClientRect();
    canvasWidthRef.current = rect.width;
    canvasHeightRef.current = rect.height;
    drawScene(ctx, state.screen, rect.width, rect.height, undefined, spritesRef.current, staticAnimState);
  }

  render();

  const ro = new ResizeObserver(render);
  ro.observe(canvas);
  return () => ro.disconnect();
}, [state.screen, spritesLoaded]);
```

**Verify:** Effect A has no `requestAnimationFrame` call, no `cancelAnimationFrame`, no `FRAME_DURATION`. Effect B unchanged.

**Done:** `git log --oneline -1` shows a commit for this task.

---

### Task 2: Fix the Playwright test

**Files:** `tests/samus-run.spec.ts`

**Action:** Replace test `"running animation advances frames (Samus not static on idle)"` (lines 124-144) — which currently tests that idle IS animated (wrong) — with a test that asserts idle is STATIC.

**Replace the test with:**
```ts
test("Samus is static on idle screen (no frame animation)", async ({ page }) => {
  // Idle screen must show a static standing pose — no RAF loop cycling frames.
  // Two screenshots 600ms apart should have near-identical pixels in Samus region.
  const region = { x: 230, y: 550, width: 80, height: 65 };
  const snap1 = await page.screenshot({ type: "png" });
  await page.waitForTimeout(600);
  const snap2 = await page.screenshot({ type: "png" });

  const sr = toSharpRegion(region);
  const [p1, p2] = await Promise.all([
    sharp(snap1).extract(sr).raw().toBuffer(),
    sharp(snap2).extract(sr).raw().toBuffer(),
  ]);

  let diffCount = 0;
  for (let i = 0; i < p1.length; i++) {
    if (Math.abs(p1[i] - p2[i]) > 5) diffCount++;
  }
  // Static render — minimal pixel change between snapshots (< 10 pixels)
  expect(diffCount).toBeLessThan(10);
});
```

**Verify:** Test name updated, assertion is `toBeLessThan(10)` (static) not `toBeGreaterThan(20)` (animated).

**Done:** `git log --oneline -1` shows a commit for this task.
