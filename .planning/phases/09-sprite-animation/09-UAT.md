---
status: testing
phase: 09-sprite-animation
source: 09-01-SUMMARY.md, 09-02-SUMMARY.md
started: 2026-04-26T00:00:00Z
updated: 2026-04-26T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Idle Sprite Renders from Sheet
expected: |
  On the idle/start screen, Samus should be drawn from the real sprite PNG — a recognizable
  pixel-art Samus standing on the floor. You should NOT see a colored geometric shape (the old
  placeholder). The sprite edges should be crisp and blocky, not blurry or anti-aliased.
awaiting: user response

## Tests

### 1. Idle Sprite Renders from Sheet
expected: On the idle/start screen, Samus is drawn from the real sprite PNG — a recognizable pixel-art Samus standing on the floor. No colored geometric shape visible. Sprite edges are crisp (nearest-neighbor), not blurry.
result: [pending]

### 2. Spin Jump Animation Loops While Airborne
expected: When Samus jumps, a looping multi-frame animation plays while she's in the air — the sprite visibly cycles through frames at a steady pace (10fps, ~9 frames). It does not freeze on one frame or play too fast/slow.
result: [pending]

### 3. Screw Attack Is Visually Distinct
expected: Jumping again while already airborne triggers a different animation state. The sprite frames change (different region of the sheet) AND a blue glow/overlay appears on Samus. This is clearly distinguishable from a normal spin jump.
result: [pending]

### 4. Game-Over Screen Shows Idle Sprite
expected: After hitting an obstacle and reaching the game-over screen, Samus is shown in the idle standing pose from the sprite sheet — same as the start screen. No geometric placeholder shape.
result: [pending]

### 5. Tap to Start Works (IN-03 fix)
expected: On the idle/start screen, tapping or clicking (or pressing Space/arrow) actually starts the game and transitions to the playing state. A single input is enough — no need to press twice.
result: [pending]

### 6. Hitbox Feels Accurate
expected: When Samus barely clips an obstacle's edge, the game ends. When she clearly passes through a gap, she survives. The collision area feels like it hugs the visible sprite body — not too large (unfair early death) and not too small (passing through obvious hits).
result: [pending]

### 7. No Visual Glitch on Death (WR-03 fix)
expected: When Samus hits an obstacle, the game-over screen appears cleanly without a brief flash of the playing scene or an extra frame rendering after the collision.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps

[none yet]
