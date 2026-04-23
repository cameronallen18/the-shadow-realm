import { PHYSICS, GAME, OBSTACLE_SPACING_RATIO } from "./constants";

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
  speedMultiplier: number;
  gameOver: boolean;
  pendingJump: boolean;     // set true on first input; consumed by first loop frame
}

// ── Helpers ────────────────────────────────────────────────────────────────

function randomGap(canvasHeight: number): { gapTop: number; gapBottom: number } {
  const playAreaTop = canvasHeight * 0.1;
  const playAreaBottom = canvasHeight * GAME.floorRatio;
  const playHeight = playAreaBottom - playAreaTop;

  const minGap = playHeight * 0.28;
  const maxGap = playHeight * 0.45;
  const gapSize = minGap + Math.random() * (maxGap - minGap);

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
        ...randomGap(canvasHeight),
        scored: false,
      },
      {
        x: canvasWidth + 100 + canvasWidth * OBSTACLE_SPACING_RATIO,
        ...randomGap(canvasHeight),
        scored: false,
      },
    ],
    obstaclesCleared: 0,
    speedMultiplier: 1,
    gameOver: false,
    pendingJump: false,
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

  // e. Ceiling clamp
  if (state.samusY <= 0) {
    state.samusY = 0;
  }

  // f. Obstacle scrolling
  const speed = PHYSICS.baseScrollSpeed * state.speedMultiplier;
  for (const obs of state.obstacles) {
    obs.x -= speed * dt;

    if (obs.x + GAME.obstacleWidth < 0) {
      // Recycle obstacle to the right
      obs.x = canvasWidth + 50;
      const gap = randomGap(canvasHeight);
      obs.gapTop = gap.gapTop;
      obs.gapBottom = gap.gapBottom;
      obs.scored = false;

      // Count and update speed
      state.obstaclesCleared++;
      if (state.obstaclesCleared > 0 && state.obstaclesCleared % 10 === 0) {
        state.speedMultiplier = Math.min(
          state.speedMultiplier + PHYSICS.speedIncrement,
          PHYSICS.maxSpeedMultiplier
        );
      }
    }
  }
}

// ── Jump ───────────────────────────────────────────────────────────────────

export function triggerJump(state: GamePhysicsState): void {
  state.samusVY = -PHYSICS.jumpVelocity; // Flappy Bird style — always apply, even mid-air
}
