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

// Horizontal spacing between obstacles in the pool (CSS px multiplier of canvasWidth)
export const OBSTACLE_SPACING_RATIO = 0.6;
