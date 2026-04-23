---
status: partial
phase: 06-physics-and-input
source: [06-VERIFICATION.md]
started: 2026-04-23T00:00:00Z
updated: 2026-04-23T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Gravity and jump feel
expected: Samus falls under gravity; sprite switches between idle and jump poses when velocity changes direction
result: [pending]

### 2. Obstacle scrolling and gap randomization
expected: Rock wall pairs scroll right-to-left; each recycle produces a different gap height
result: [pending]

### 3. Speed progression
expected: Noticeable scroll speed increase after approximately every 10 obstacles cleared
result: [pending]

### 4. First input starts with immediate jump
expected: Single Space/tap both starts game AND causes Samus to jump immediately (pendingJump pattern)
result: [pending]

### 5. Space key no page scroll
expected: Pressing Space during play does NOT scroll the browser page
result: [pending]

### 6. Tab switch resilience
expected: Switching away for 3+ seconds then back does not cause Samus to teleport (dt cap working)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
