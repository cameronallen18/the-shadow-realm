// Norfair palette — dark reddish-browns as thematic exception inside canvas.
// Page UI surrounding the game remains cool-toned per CLAUDE.md.
export const NORFAIR = {
  sky: "#0d0608",
  midground: "#1a0c0e",
  lavaGlow: "#3d1010",
  lavaHighlight: "#7a2020",
  rock: "#2e1a1a",
  rockEdge: "#4a2828",
  groundLine: "#5c3030",
} as const;

// Samus varia suit palette — cool tones (silver/grey/teal)
export const SAMUS = {
  body: "#5a7a8a",
  highlight: "#8aacbc",
  shadow: "#2a4a5a",
  visor: "#c8e0e8",
  legs: "#4a6a7a",
} as const;

// Logical game dimensions (used for positioning ratios, not pixel counts)
export const GAME = {
  floorRatio: 0.85,        // floor Y = height * 0.85
  samusXRatio: 0.2,        // samus X = width * 0.2
  obstacleXRatio: 0.65,    // static obstacle X = width * 0.65
  obstacleWidth: 40,       // rock wall column width in CSS pixels
  samusScale: 1,           // sprite scale multiplier
} as const;

// Physics tuning — all values in CSS pixels or CSS pixels/second
export const PHYSICS = {
  gravity: 1200,            // CSS px/s^2 — downward acceleration
  jumpVelocity: 520,        // CSS px/s — upward velocity applied on tap (Flappy Bird style)
  terminalVelocity: 900,    // CSS px/s — max downward speed
  baseScrollSpeed: 220,     // CSS px/s — obstacle scroll speed at multiplier=1
  speedIncrement: 0.15,     // added to speedMultiplier every 10 obstacles cleared
  maxSpeedMultiplier: 2.5,  // cap — game becomes unplayable beyond ~2.5x
  dtCap: 0.05,              // max delta-time in seconds (prevents teleport on tab-switch)
} as const;

// Horizontal spacing between obstacles — fixed px so gap stays consistent across screen widths.
// Wide screens see more of the level ahead rather than larger gaps.
export const OBSTACLE_SPACING_PX = 480;

// Collision hitbox — reduced to ~65% of sprite size per D-04 (60-70% range)
export const COLLISION = {
  hitboxScale: 0.65,   // 65% of sprite size per D-04 (~60-70% range)
  samusWidth: 28,      // approximate sprite width in CSS pixels (from drawSamus dimensions)
  samusHeight: 36,     // approximate sprite height in CSS pixels (from drawSamus dimensions)
} as const;

// Sprite sheet layout — measured from samus.png (6496×4384px, 96×96 cell grid).
// Each cell has a 1px black border; content occupies ~94×94 with the sprite
// data starting at offset (17, 17) within the cell at 81×81 px.
// Section IDs match the sheet's internal section numbering.
export const SPRITE_LAYOUT = {
  cellSize: 96,         // px — full cell including 1px border
  contentSize: 81,      // px — visible sprite content within the cell
  contentOffset: 17,    // px — x and y offset from cell origin to sprite content

  // Section row Y-origins in the sprite sheet (absolute px from top of PNG)
  idle:         { sy: 49,   frames: 1 },  // section 00 — standing idle (1 frame)
  spinJumpR:    { sy: 3249, frames: 9 },  // section 19 — spin jump right (9 frames)
  spinJumpL:    { sy: 3377, frames: 9 },  // section 1A — spin jump left  (9 frames)
  screwAttackR: { sy: 3505, frames: 9 },  // section 1B — screw attack right (9 frames)
  screwAttackL: { sy: 3633, frames: 9 },  // section 1C — screw attack left  (9 frames)
} as const;
