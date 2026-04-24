# Pitfalls Research

**Domain:** Adding sprite sheet animation and level backgrounds to an existing rAF-based canvas game
**Researched:** 2026-04-24
**Confidence:** HIGH (pitfalls verified against MDN, web.dev, WebKit bug tracker, and direct analysis of the existing codebase)

---

## Critical Pitfalls

### Pitfall 1: Drawing a Sprite Before Its Image Has Loaded

**What goes wrong:**
`drawImage()` is called on the first rAF frame before the browser has finished decoding the `Image` object. The call silently no-ops — no error, no visible crash, no console warning. Samus is invisible. The loop continues running at 60fps doing nothing useful. Developers waste time suspecting DPR bugs or coordinate math.

**Why it happens:**
The existing rAF loop starts immediately when the `playing` screen mounts (Effect B in `SamusRunGame.tsx`). There is currently no image asset in that loop — everything is drawn programmatically. Adding a `new Image()` call and assuming it is ready by the first frame is the natural but wrong approach.

**How to avoid:**
Create `Image` objects outside the loop. Use `img.decode()` (returns a Promise) or an `onload` handler and only start or ungate the draw calls once loading completes. A clean pattern for this codebase:

```ts
// Preloader called before Effect B runs — result stored in useRef
export async function loadSprites(): Promise<{ samus: HTMLImageElement; bg: HTMLImageElement }> {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  const [samus, bg] = await Promise.all([
    load("/sprites/samus.png"),
    load("/sprites/bg.png"),
  ]);
  return { samus, bg };
}
```

Store resolved images in a `useRef`. Gate the rAF loop start on a `spritesLoaded` boolean ref — not React state (which would cause a re-render and race).

**Warning signs:**
- Samus is invisible on the first few frames or intermittently on cold loads
- Canvas renders the environment but shows nothing where Samus should be
- No error in console — this is the tell; a real bug would throw

**Phase to address:**
Phase 8 (sprite animation system) — the very first step, before any animation logic is written.

---

### Pitfall 2: `setupCanvas` Called Every rAF Frame Breaks Pixel Alignment When `drawImage` Is Added

**What goes wrong:**
`setupCanvas` in this codebase calls `canvas.width = ...` and `canvas.height = ...` every frame. Setting `canvas.width` resets the entire context: transforms, `imageSmoothingEnabled`, and the DPR scale. The existing code re-applies `ctx.scale(dpr, dpr)` and `ctx.imageSmoothingEnabled = false` each time, so it currently works for vector drawing.

When `drawImage` is added, fractional sub-pixel coordinates become a problem. Frame index arithmetic frequently produces floats (e.g., `frameCol * 16.666...`). If the DPR scale is re-applied every frame and any `drawImage` argument is a float, sprites render on half-pixels and appear blurry or shimmer at 120fps on ProMotion displays, even with `imageSmoothingEnabled = false`.

**Why it happens:**
`setupCanvas` was designed for resize events (correct) but was also placed inside the rAF loop as a convenience. This was safe when everything was drawn with `fillRect` (which tolerates sub-pixel rounding). `drawImage` with sprite sheet slicing maps a source rect in a bitmap image to a destination rect on canvas — any fractional value in either rect causes bilinear blending in some browser/OS combinations regardless of the smoothing flag.

**How to avoid:**
Two changes, in order:
1. Move `setupCanvas` out of the per-frame loop. Call it only from the ResizeObserver (Effect A already does this correctly). Cache the `ctx` in a `useRef` and reuse it across frames.
2. Floor all sprite coordinates: `Math.floor(frameCol * frameW)`, `Math.floor(destX)`, etc. Never pass floats to any argument of `drawImage`.

**Warning signs:**
- Sprite appears slightly blurry or fuzzy compared to the source PNG
- Blurriness gets worse when the window is resized (exposing DPR recalculation)
- Artifact disappears when you force DPR=1 in DevTools

**Phase to address:**
Phase 8 (sprite animation system) — refactor `setupCanvas` call site before adding `drawImage`.

---

### Pitfall 3: Sprite Frame Advancement Coupled to rAF Cadence, Not Elapsed Time

**What goes wrong:**
The frame index is incremented on every `requestAnimationFrame` callback: `frameIndex = (frameIndex + 1) % totalFrames`. On a 60Hz display Samus cycles through frames at 60fps — far too fast (the Super Metroid breathing cycle is ~6fps). On a 120Hz ProMotion display it runs at 120fps, making the animation twice as fast. The animation is both wrong and device-dependent.

**Why it happens:**
The existing game loop already uses `dt` correctly for physics (velocity, obstacle scrolling). Developers assume they can reuse "increment per frame" for animation frames because it's simpler than a time accumulator.

**How to avoid:**
Use a time accumulator for sprite frames, separate from physics `dt`:

```ts
const FRAME_DURATION = 1 / 6; // 6fps for idle breathing
let frameAccumulator = 0;

function loop(ts: number) {
  const dt = Math.min((ts - lastTs) / 1000, PHYSICS.dtCap);
  frameAccumulator += dt;
  if (frameAccumulator >= FRAME_DURATION) {
    frameAccumulator -= FRAME_DURATION; // subtract, not reset — preserves sub-frame time
    frameIndex = (frameIndex + 1) % totalFrames;
  }
  // ... rest of loop
}
```

Different animations (idle/jump/screw attack) can have different `FRAME_DURATION` values without affecting physics speed.

**Warning signs:**
- Samus breathing animation looks like a strobe light on 60Hz
- Animation is noticeably faster when you connect an external 120Hz monitor
- Throttling DevTools to 30fps also slows down the animation (it should not)

**Phase to address:**
Phase 8 (sprite animation system) — frame advancement logic must use the accumulator from day one.

---

### Pitfall 4: Background Scroll Speed Coupled to `speedMultiplier`

**What goes wrong:**
The background tile offset is incremented by `speed * dt` where `speed = baseScrollSpeed * state.speedMultiplier`. As the player clears obstacles, `speedMultiplier` climbs to 2.5x. The background also scrolls 2.5x faster. At high speed the environment becomes a blur and loses its identity as a Super Metroid level. Parallax layers that should move slower than the foreground instead move identically to obstacle columns.

**Why it happens:**
The existing obstacle scroll is `obs.x -= speed * dt`. Adding a background offset that reuses `speed` is the path of least resistance. The coupling is invisible at game start and only breaks at high multipliers after extended play.

**How to avoid:**
Give each background layer its own fixed speed constant, independent of `speedMultiplier`:

```ts
// constants.ts
export const BACKGROUND = {
  farLayerSpeed: 30,   // CSS px/s — always fixed
  midLayerSpeed: 80,   // CSS px/s — always fixed
} as const;
```

Pass a separate `bgOffset` value to `drawEnvironment` computed from wallclock time elapsed, not game speed. The background communicates "you are in Norfair" — it must remain visually coherent even when obstacles are flying.

**Warning signs:**
- Background looks fine at game start, becomes a smear after 20+ obstacles cleared
- Midground cave layer moves at the same speed as obstacle columns (they should be slower)
- Temporarily zeroing `speedMultiplier` in the draw call makes it look correct instantly

**Phase to address:**
Phase 9 (level background) — background draw function must accept its own offset state on day one.

---

### Pitfall 5: CORS-Tainted Canvas From External Sprite URLs

**What goes wrong:**
Sprite sheets loaded from any non-Vercel origin without `crossOrigin="anonymous"` taint the canvas. The game renders visually fine, but the canvas becomes read-protected. Any future call to `canvas.toDataURL()` or `ctx.getImageData()` throws a `SecurityError` with no symptom during normal play. Additionally, if the external CDN does not send `Access-Control-Allow-Origin`, the request can fail entirely — but only on Chromium, not older Safari — making it appear to be a browser bug.

**Why it happens:**
Developers set `img.src = "https://cdn.spriterips.com/..."` without setting `img.crossOrigin = "anonymous"` because the game renders correctly at first. The taint only surfaces if pixel data is ever read back.

**How to avoid:**
For this project: serve all sprite sheets as static assets under `/public/sprites/` on Vercel. Same-origin assets have no CORS concern, no taint risk, and no CDN dependency. If an external URL must be used during prototyping:

```ts
img.crossOrigin = "anonymous"; // MUST be set before .src
img.src = "https://external-host.com/samus.png";
```

**Warning signs:**
- Console: `SecurityError: The canvas has been tainted by cross-origin data`
- Sprite renders fine in Chrome, fails silently in Safari (or vice versa)
- Loads on localhost (same-origin dev server), fails in Vercel preview (different origin if CDN is external)

**Phase to address:**
Phase 8 (sprite animation system) — sprite sourcing strategy (local vs. external URL) must be decided before any `Image` loading code is written.

---

### Pitfall 6: Hitbox Dimensions No Longer Match After Switching from Programmatic Shapes to Sprite Images

**What goes wrong:**
The existing hitbox in `constants.ts` is `{ samusWidth: 28, samusHeight: 36 }` — tuned to match the programmatic `drawSamusIdle` geometry. The real Super Metroid sprite PNG will have different pixel dimensions and, critically, transparent padding around the visible character. The collision system measures from `samusX - samusWidth/2` to `samusX + samusWidth/2`. If `samusWidth` is now wrong (still reads 28 but the visible sprite is narrower), Samus collides with gaps she visually clears, or clips through obstacles she appears to miss.

**Why it happens:**
Hitbox dimensions are hardcoded numbers describing programmatic shapes. Sprite sheets have their own coordinate system. The AABB is not automatically derived from the image — the developer must manually reconcile both.

**How to avoid:**
When the real sprite is locked in:
1. Measure the actual visible pixel bounds of the sprite frame (excluding transparent padding) in an image editor
2. Compute the CSS-pixel dimensions at the intended render scale
3. Update `COLLISION.samusWidth` and `COLLISION.samusHeight` to match the visible body, not the full image rect
4. The existing `hitboxScale: 0.65` factor is retained for the forgiving hitbox feel

Temporarily draw the hitbox rect in red during development to verify alignment visually before removing the debug overlay.

**Warning signs:**
- Players collide with obstacles without visually touching them
- Players pass through obstacles that visually clip the sprite
- Debug hitbox rect does not align with the visible sprite body

**Phase to address:**
Phase 8 (sprite animation system) — hitbox audit is a required step after the first sprite is drawn, not deferred to later.

---

### Pitfall 7: Canvas State Pollution Between Draw Calls When Mixing Sprite and Vector Drawing

**What goes wrong:**
The existing `drawSamusJump` in `drawSamus.ts` uses `ctx.save()` / `ctx.translate()` / `ctx.rotate()` / `ctx.restore()`. If any new sprite draw function uses `ctx.scale(-1, 1)` for horizontal flipping (a common sprite technique) and omits `ctx.restore()`, the transform accumulates. The next call to `drawRockWall` draws the obstacle mirrored and offset. This is currently low risk with pure vector drawing. Adding `drawImage` transforms multiplies the risk.

**Why it happens:**
Canvas context state is global and shared by every draw function via the same `ctx`. A missing `restore()` silently carries forward into every subsequent draw call in the same frame. No warning is thrown.

**How to avoid:**
Every draw function that mutates context state (transforms, `globalAlpha`, `fillStyle`) must wrap its body in `ctx.save()` / `ctx.restore()`. This discipline already exists in `drawSamusJump` — enforce it in every new sprite draw function. Never rely on the calling function to clean up state after a draw call. Code review should check for every `ctx.translate/rotate/scale` that it is enclosed in a matching save/restore pair.

**Warning signs:**
- Rock walls appear rotated or offset after Samus reaches certain animation states
- Environment gradually drifts across frames
- Bug disappears when the sprite draw call is removed from the frame

**Phase to address:**
Phase 8 (sprite animation system) — enforce save/restore on every new draw function before merging.

---

### Pitfall 8: iOS Safari Canvas Memory Budget Exceeded — Canvas Goes Black Silently

**What goes wrong:**
iOS Safari (all versions as of 2026) enforces two hard limits:
1. **Per-canvas area limit:** `width * height > 16,777,216` physical pixels causes context allocation failure
2. **Total canvas memory budget:** ~224–384MB across all live canvas elements; exceeding it causes the canvas to go entirely black with no JavaScript exception thrown

At DPR=3 (iPhone 15 Pro), a viewport-filling canvas at 390×844 CSS pixels becomes 1,170×2,532 physical pixels = ~2.96M physical pixels — well within the per-canvas limit. The budget risk comes from creating off-screen canvases for sprite caching: a 512×512 source sprite sheet pre-rendered to an `OffscreenCanvas` at DPR=3 consumes 512×512×3×3×4 bytes (~9MB per sheet). Multiple sheets plus the main canvas can exhaust the budget on older iPhones.

**Why it happens:**
The common optimization for sprite-heavy games is to pre-render each frame to an off-screen canvas once, then `drawImage(offscreenCanvas, ...)` per frame to avoid repeated sprite-sheet slicing math. This optimization is valid on desktop but dangerous on iOS due to the memory budget.

**How to avoid:**
- Do not use off-screen canvas for sprite caching in this project. The sprite count is small (idle: ~4 frames, jump: ~3 frames, screw: ~8 frames). Direct sprite-sheet slicing with `drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)` is fast enough.
- The main canvas is not destroyed and recreated on restart (existing code is correct — the canvas element persists across game states).
- If off-screen canvases are ever added, dispose explicitly: set `offscreen.width = 0; offscreen.height = 0` before releasing the reference.

**Warning signs:**
- Canvas goes completely black with no error in JavaScript console
- iOS Safari console shows: `Total canvas memory use exceeds the maximum limit`
- Works on desktop and Android, fails only on iPhone/iPad
- Failure happens after multiple game restarts or after loading multiple sprite sheets, not on first page load

**Phase to address:**
Phase 8 (sprite animation system) — sprite preloading strategy must avoid off-screen canvas inflation. Phase 9 (background) — background tile caching must not add canvas elements.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Calling `setupCanvas` (which resets `canvas.width`) every rAF frame | Single source of DPR truth, simpler code | Sub-pixel rendering bugs with `drawImage`, unnecessary GPU uploads, full context reset every frame | Never — refactor before adding `drawImage` |
| Frame counter `frameIndex++` instead of time accumulator | 5 fewer lines of code | Animation speed is device-dependent; wrong on 120Hz displays, wrong when frame rate drops | Never for any user-visible animation |
| Loading sprites from external CDN URL | Avoids copying sprite files to repo | CORS taint risk, CDN availability dependency, no control over asset format or compression | Acceptable only during prototyping; must move to `/public/sprites/` before shipping |
| Coupling background scroll to game `speedMultiplier` | Reuses existing speed math | Background becomes unreadable at high game speed; breaks environment identity | Never |
| Skipping hitbox audit after sprite swap | Faster first pass | Players experience invisible collision walls; game feels broken | Never — hitbox audit is a required delivery condition |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `Image` loading in rAF loop | Calling `new Image()` inside `loop()` on every frame | Create once outside the loop; await `onload`/`img.decode()` before starting draw calls |
| `drawImage` with DPR scaling | Passing float coordinates from frame index arithmetic | `Math.floor()` all eight `drawImage` arguments: `sx`, `sy`, `sw`, `sh`, `dx`, `dy`, `dw`, `dh` |
| Sprite horizontal flip (facing left) | Flipping the `<img>` element with CSS — has no effect on canvas | `ctx.save(); ctx.scale(-1, 1); ctx.translate(-destX * 2 - destW, 0); drawImage(...); ctx.restore()` |
| `imageSmoothingEnabled` after context reset | Setting `canvas.width` resets it; new sprite appears blurry | Already re-applied in `setupCanvas` — maintain this; if `setupCanvas` is refactored out of loop, re-apply `imageSmoothingEnabled = false` in the draw functions that call `drawImage` |
| Background tile offset wrapping | Offset accumulates indefinitely, overflows float precision after hours | Wrap offset modulo tile width: `bgOffset = bgOffset % tileWidth` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Calling `setupCanvas` (sets `canvas.width`) every rAF frame | Full context reset, blurry sprites, unnecessary GPU texture re-upload | Move to ResizeObserver only; cache `ctx` in `useRef` | Immediately visible with `drawImage`; invisible with pure `fillRect` |
| Overdraw from multiple opaque background layers | GPU fill rate pressure on mid-range iPhones | Limit background layers to 2–3 max; avoid `globalAlpha` per-frame | 3+ full-screen layers at 60fps on iPhone 12 or older |
| Off-screen canvas per sprite frame for pre-rendering optimization | Works on desktop; canvas goes black on iOS | Skip off-screen canvas; direct `drawImage` slice is fast enough for under 20 frames | iOS Safari memory budget, ~224MB total |
| Large uncompressed PNG sprite sheet | Slow initial load; visible frame drop on first game start | Compress to indexed PNG or WebP; keep total sprite assets under 200KB | On 3G or slow WiFi; also on cold cache loads in Vercel preview |

---

## "Looks Done But Isn't" Checklist

- [ ] **Sprite loading:** Image appears in game on cache-hit — verify it also appears on first frame after a hard-refresh (cache cleared) on the first ever load
- [ ] **Frame rate independence:** Animation plays correctly at 60fps — verify by throttling DevTools to 30fps and confirming animation speed is unchanged
- [ ] **DPR correctness:** Sprites look sharp in DevTools — verify on an actual iPhone at DPR=3, not just DevTools device emulation (emulation often uses DPR=2)
- [ ] **Hitbox alignment:** No phantom collisions — verify with a red debug rect overlay that hitbox tracks visible sprite body, not full image rect including transparent padding
- [ ] **Background at speed:** Environment looks like Norfair after 30+ obstacles — verify background is still readable at `speedMultiplier` 2.0+
- [ ] **CORS:** Sprite loads on localhost — verify also on Vercel preview deploy to catch same-origin vs. cross-origin differences
- [ ] **iOS canvas:** Game renders on iPhone — verify on real Safari on iOS, not Chrome on iOS (Chrome on iOS uses WebKit, but Safari has stricter canvas memory enforcement)
- [ ] **Canvas state:** Environment and obstacles render correctly after all animation states — verify rock walls are not rotated or offset after screw attack animation runs

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Sprite draw silently fails (image not loaded) | LOW | Add `onload`/`decode()` gate; no logic changes required |
| Blurry sprites from float coordinates | LOW | Add `Math.floor()` to all `drawImage` args; ~10-minute fix, isolated to draw functions |
| Wrong animation speed on 120Hz | LOW | Replace frame counter with time accumulator; change is isolated to animation frame advancement logic |
| Background coupled to game speed | LOW | Extract background speed to constant; pass separate offset param to `drawEnvironment` |
| CORS-tainted canvas | LOW if caught early | Move assets to `/public/sprites/`; update all `img.src` paths to relative URLs |
| Hitbox mismatch after sprite swap | MEDIUM | Measure sprite visible bounds in image editor; update `COLLISION` constants; re-test all collision scenarios manually |
| Canvas state pollution | MEDIUM | Audit every draw function for unmatched save/restore; add debug rect overlays to isolate which function leaks state |
| iOS canvas memory budget exceeded | HIGH if off-screen canvases proliferate | Audit all `OffscreenCanvas`/`new HTMLCanvasElement` calls; replace with direct `drawImage` slicing; may require rearchitecting sprite caching |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Image not loaded before rAF draw | Phase 8 — sprite animation | First-frame render test with hard-refresh (cache cleared) |
| `setupCanvas` every frame + float `drawImage` coords | Phase 8 — sprite animation | Visual sharpness on DPR=3 device; no per-frame context reset in profiler |
| Frame rate coupled to rAF cadence | Phase 8 — sprite animation | Animation speed identical at 30fps, 60fps, 120fps in DevTools |
| Background speed coupled to `speedMultiplier` | Phase 9 — level background | Background legible and correct speed after 30+ obstacles cleared |
| CORS-tainted canvas | Phase 8 — sprite animation (asset sourcing) | Sprites load correctly on Vercel preview deploy, not just localhost |
| Hitbox mismatch after sprite swap | Phase 8 — sprite animation (post-first-sprite audit) | Red debug rect aligns with visible sprite body; no phantom collisions |
| Canvas state pollution from transforms | Phase 8 — sprite animation | Rock walls and environment undistorted during all animation states |
| iOS canvas memory budget | Phase 8 — sprite animation (preload strategy) | Game renders correctly on iPhone after 5+ game restarts; no canvas blackout |

---

## Sources

- [MDN: Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) — HIGH confidence (official)
- [web.dev: High DPI Canvas](https://web.dev/articles/canvas-hidipi) — HIGH confidence (official Google)
- [MDN: CORS enabled images in canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image) — HIGH confidence (official)
- [MDN: imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) — HIGH confidence (official)
- [MDN: Crisp pixel art look with image-rendering](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look) — HIGH confidence (official)
- [WebKit bug 195325: Total canvas memory use exceeds the maximum limit](https://bugs.webkit.org/show_bug.cgi?id=195325) — HIGH confidence (official WebKit tracker)
- [PQINA: Canvas Area Exceeds The Maximum Limit](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/) — MEDIUM confidence (well-documented community post with WebKit bug references)
- [PQINA: Total Canvas Memory Use Exceeds The Maximum Limit](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/) — MEDIUM confidence
- [Spicy Yoghurt: Images and Sprite Animations](https://spicyyoghurt.com/tutorials/html5-javascript-game-development/images-and-sprite-animations) — MEDIUM confidence (tutorial, corroborated by MDN)
- [Kirupa: Canvas High DPI / Retina](https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm) — MEDIUM confidence (tutorial)
- [Corsfix: Tainted Canvas explained](https://corsfix.com/blog/tainted-canvas) — MEDIUM confidence (focused technical article)
- Existing codebase: `SamusRunGame.tsx`, `setupCanvas.ts`, `gameLoop.ts`, `constants.ts` — HIGH confidence (direct analysis of the system being modified)

---
*Pitfalls research for: sprite sheet animation and level backgrounds added to existing rAF canvas game*
*Researched: 2026-04-24*
