import { PHYSICS, GAME, OBSTACLE_SPACING_PX, COLLISION } from "./constants";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Obstacle {
  x: number;          // left edge, CSS pixels
  gapTop: number;     // y where gap starts (CSS px from top)
  gapBottom: number;  // y where gap ends (CSS px from top)
  scored: boolean;    // true once Samus has passed this obstacle (prevents double-count)
}

export interface GamePhysicsState {
  samusY: number;           // CSS px from top of canvas (0 = ceiling)
  samusVY: number;          // CSS px/s, positive = downward
  obstacles: Obstacle[];
  obstaclesCleared: number;
  obstaclesSpawned: number; // total obstacles created (including initial 2); used for difficulty curve
  speedMultiplier: number;
  gameOver: boolean;
  pendingJump: boolean;     // set true on first input; consumed by first loop frame
  pendingScrewAttack: boolean; // set true when mid-air jump fires; consumed by Effect B loop
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Difficulty curve for gap size based on obstacle number n (1-indexed).
 * n <= 10:   always max gap (learning phase)
 * 11-25:     upper 60% of range only (never near minimum)
 * n > 25:    full range but sqrt-biased toward larger — hard gaps are rare
 */
function gapForObstacle(n: number, canvasHeight: number): { gapTop: number; gapBottom: number } {
  const playAreaTop = canvasHeight * 0.1;
  const playAreaBottom = canvasHeight * GAME.floorRatio;
  const playHeight = playAreaBottom - playAreaTop;

  const minGap = playHeight * 0.28;
  const maxGap = playHeight * 0.45;

  let gapSize: number;
  if (n <= 10) {
    gapSize = maxGap;
  } else if (n <= 25) {
    gapSize = minGap + (maxGap - minGap) * (0.4 + Math.random() * 0.6);
  } else {
    gapSize = minGap + (maxGap - minGap) * Math.sqrt(Math.random());
  }

  const minCenter = playAreaTop + gapSize / 2;
  const maxCenter = playAreaBottom - gapSize / 2;
  const gapCenter = minCenter + Math.random() * (maxCenter - minCenter);

  return { gapTop: gapCenter - gapSize / 2, gapBottom: gapCenter + gapSize / 2 };
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createInitialGameState(
  canvasWidth: number,
  canvasHeight: number
): GamePhysicsState {
  return {
    samusY: canvasHeight * GAME.floorRatio,
    samusVY: 0,
    obstacles: [
      {
        x: canvasWidth + 100,
        ...gapForObstacle(1, canvasHeight),
        scored: false,
      },
      {
        x: canvasWidth + 100 + OBSTACLE_SPACING_PX,
        ...gapForObstacle(2, canvasHeight),
        scored: false,
      },
    ],
    obstaclesCleared: 0,
    obstaclesSpawned: 2,
    speedMultiplier: 1,
    gameOver: false,
    pendingJump: false,
    pendingScrewAttack: false,
  };
}

// ── Update ─────────────────────────────────────────────────────────────────

export function updateGame(
  state: GamePhysicsState,
  dt: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  // a. Pending jump
  if (state.pendingJump) {
    state.samusVY = -PHYSICS.jumpVelocity;
    state.pendingJump = false;
  }

  // b. Gravity
  state.samusVY += PHYSICS.gravity * dt;
  state.samusVY = Math.min(state.samusVY, PHYSICS.terminalVelocity);

  // c. Position
  state.samusY += state.samusVY * dt;

  // d. Floor clamp
  if (state.samusY >= canvasHeight * GAME.floorRatio) {
    state.samusY = canvasHeight * GAME.floorRatio;
    state.samusVY = 0;
  }

  // e. Ceiling clamp — keep sprite in frame (samusY is feet/bottom, sprite height ~70px)
  if (state.samusY <= COLLISION.samusHeight) {
    state.samusY = COLLISION.samusHeight;
    state.samusVY = 0;
  }

  // f. Collision detection and per-gap scoring (between clamp and scroll per D-04/D-06)
  {
    const samusX = canvasWidth * GAME.samusXRatio;
    const hw = COLLISION.samusWidth * COLLISION.hitboxScale;
    const hh = COLLISION.samusHeight * COLLISION.hitboxScale;
    const offsetX = (COLLISION.samusWidth - hw) / 2;
    const offsetY = (COLLISION.samusHeight - hh) / 2;

    // Samus hitbox (reduced, bottom-anchored: samusY is feet/floor level)
    const sLeft = samusX - COLLISION.samusWidth / 2 + offsetX;
    const sRight = sLeft + hw;
    const sTop = state.samusY - COLLISION.samusHeight + offsetY;
    const sBottom = sTop + hh;

    for (const obs of state.obstacles) {
      const oLeft = obs.x;
      const oRight = obs.x + GAME.obstacleWidth;

      // Horizontal overlap check
      if (sRight > oLeft && sLeft < oRight) {
        // Samus overlaps obstacle column — check if inside gap
        if (sTop < obs.gapTop || sBottom > obs.gapBottom) {
          state.gameOver = true;
          return; // stop processing — game is over
        }
      }

      // Scoring: Samus has fully passed the obstacle's right edge (per D-06)
      if (!obs.scored && sLeft > oRight) {
        obs.scored = true;
        state.obstaclesCleared++;
        // Speed progression check moved here (increments on actual gaps cleared)
        if (state.obstaclesCleared > 0 && state.obstaclesCleared % 15 === 0) {
          state.speedMultiplier = Math.min(
            state.speedMultiplier + PHYSICS.speedIncrement,
            PHYSICS.maxSpeedMultiplier
          );
        }
      }
    }
  }

  // g. Obstacle scrolling
  const speed = PHYSICS.baseScrollSpeed * state.speedMultiplier;
  for (const obs of state.obstacles) {
    obs.x -= speed * dt;

    if (obs.x + GAME.obstacleWidth < 0) {
      // Recycle obstacle to the right — place it OBSTACLE_SPACING_PX ahead of
      // the furthest obstacle still on screen so spacing stays consistent.
      const otherObs = state.obstacles.find((o) => o !== obs);
      const leadX = otherObs ? otherObs.x : canvasWidth;
      obs.x = leadX + OBSTACLE_SPACING_PX;
      state.obstaclesSpawned++;
      const gap = gapForObstacle(state.obstaclesSpawned, canvasHeight);
      obs.gapTop = gap.gapTop;
      obs.gapBottom = gap.gapBottom;
      obs.scored = false;
      // NOTE: obstaclesCleared is incremented in the scoring block above (when Samus passes),
      // not here on recycle — prevents double-counting and aligns score with player action.
    }
  }
}

// ── Jump ───────────────────────────────────────────────────────────────────

export function triggerJump(state: GamePhysicsState): void {
  state.samusVY = -PHYSICS.jumpVelocity; // Flappy Bird style — always apply, even mid-air
}
