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
