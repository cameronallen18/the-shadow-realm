---
status: approved
phase: 10-background-scroll
source: [10-VERIFICATION.md]
started: 2026-04-28T03:20:00.000Z
updated: 2026-04-28T03:30:00.000Z
---

## Current Test

User approved 2026-04-28

## Tests

### 1. Visual tile scroll / no seam
expected: Navigate to /projects/samus-run, start the game, observe background for any blank gap or color discontinuity at the 512px tile wrap boundary — continuous scroll with no seam visible
result: approved

### 2. Speed independence
expected: Play past obstacles 10, 20, 30 to trigger speedMultiplier increases — obstacle columns speed up while background scroll rate stays visually constant
result: approved

### 3. Closure reset on restart
expected: Play for 10+ seconds, die, restart — background resets to offset 0 position on the new run (Effect B re-declares `let bgScrollOffset = 0`)
result: approved

### 4. Null-image fallback
expected: Rename norfair_upper.png temporarily, start the game — solid-fill sky/lava environment renders with no JS error, gameplay continues
result: approved

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
