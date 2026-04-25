---
phase: 9
plan: "09-02"
subsystem: collision
tags: [hitbox, constants, qual-02]
key-files:
  modified:
    - components/samus-run/constants.ts
    - components/samus-run/canvas/drawSamus.ts
metrics:
  samusWidth_old: 28
  samusWidth_new: 40
  samusHeight_old: 36
  samusHeight_new: 60
---

## Summary

Updated `COLLISION.samusWidth` and `COLLISION.samusHeight` to match the real sprite body dimensions. Pixel analysis of `public/sprites/samus.png` at the idle frame region (content offset 17,66 — 81×81px) found the visible Samus body spans ~55px wide × 73px tall within the 81px content area. Values were set to 40×60 to create a fair hitbox that hugs the torso while excluding the arm cannon extension and transparent padding margins.

`DEBUG_HITBOX = false` confirmed in committed state — flag was never set to `true` in any commit.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | (no change) | DEBUG_HITBOX infrastructure verified present from 09-01 |
| 2 | checkpoint | Hitbox values determined via pixel analysis of sprite sheet |
| 3 | 7722f7f | feat(09-02): tune COLLISION hitbox constants to real sprite dimensions |

## Deviations

**Visual tuning replaced by pixel analysis:** The plan specified a visual DEBUG_HITBOX tuning workflow (flip flag, run dev server, observe, adjust). User delegated this to the executor. Pixel analysis of `samus.png` using Node.js + sharp gave direct measurements: body bounding box is 55×73px within the 81px content area. Values tuned to 40×60 to provide a fair hitbox (excludes arm cannon, slight inward trim on all sides). The `DEBUG_HITBOX = false` constraint is satisfied — flag was never flipped in a commit.

## Self-Check: PASSED

- `grep "DEBUG_HITBOX = false" components/samus-run/canvas/drawSamus.ts` → 1 match ✓
- `grep "DEBUG_HITBOX = true" components/samus-run/canvas/drawSamus.ts` → 0 matches ✓
- `samusWidth: 40` (NOT 28) ✓
- `samusHeight: 60` (NOT 36) ✓
- `npx tsc --noEmit` → exit 0 ✓
- QUAL-02: COLLISION constants updated to reflect real sprite body ✓
