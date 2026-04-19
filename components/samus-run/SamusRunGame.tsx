"use client";

/** Set to true to force-display the jump sprite for visual testing (VIS-03). */
const DEBUG_FORCE_JUMP = false;

import Link from "next/link";
import { useReducer, useRef, useEffect } from "react";
import { setupCanvas } from "./canvas/setupCanvas";
import { drawEnvironment } from "./canvas/drawEnvironment";
import { drawSamusIdle, drawSamusJump } from "./canvas/drawSamus";
import { drawRockWall } from "./canvas/drawObstacleShape";
import { GAME } from "./constants";

// ── Types ──────────────────────────────────────────────────────────────────

type GameScreen = "idle" | "playing" | "gameover";

type GameAction =
  | { type: "START" }
  | { type: "GAME_OVER"; score: number }
  | { type: "RESTART" };

interface GameState {
  screen: GameScreen;
  score: number;
  highScore: number;
}

// ── Reducer ────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return { ...state, screen: "playing", score: 0 };
    case "GAME_OVER":
      return {
        screen: "gameover",
        score: action.score,
        highScore: Math.max(state.highScore, action.score),
      };
    case "RESTART":
      return { ...state, screen: "idle" };
    default:
      return state;
  }
}

// ── Scene drawing ──────────────────────────────────────────────────────────

function drawScene(
  ctx: CanvasRenderingContext2D,
  screen: GameScreen,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);

  // Environment: cave background, lava, ceiling
  drawEnvironment(ctx, width, height);

  // Static obstacle placeholder (center-right of screen)
  const obstacleX = width * GAME.obstacleXRatio;
  const floorY = height * GAME.floorRatio;
  drawRockWall(ctx, obstacleX, height * 0.15, height * 0.6, GAME.obstacleWidth, height);

  // Samus -- position on floor, left side of screen
  const samusX = width * GAME.samusXRatio;
  const samusY = floorY; // feet on the floor line

  const useJump = DEBUG_FORCE_JUMP || screen === "playing";
  if (useJump) {
    drawSamusJump(ctx, samusX, samusY, GAME.samusScale);
  } else {
    drawSamusIdle(ctx, samusX, samusY, GAME.samusScale);
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SamusRunGame() {
  const [state, dispatch] = useReducer(gameReducer, {
    screen: "idle",
    score: 0,
    highScore: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function render() {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = setupCanvas(cvs);
      if (!ctx) return;
      const rect = cvs.getBoundingClientRect();
      drawScene(ctx, state.screen, rect.width, rect.height);
    }

    render();

    const parent = canvas.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => {
      render();
    });
    observer.observe(parent);

    return () => observer.disconnect();
  }, [state.screen]);

  return (
    <div className="relative w-full h-dvh bg-black overflow-hidden">
      {/* DPR-aware canvas background (replaces Phase 4 placeholder div) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Back link — matches math-flashcards pattern exactly */}
      <Link
        href="/"
        className="fixed top-4 left-4 text-[#ededed]/40 text-xs hover:text-[#ededed]/70 transition-colors duration-0 z-50"
      >
        ← the shadow realm
      </Link>

      {/* Overlay: idle */}
      {state.screen === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
          <p className="text-[#ededed]/60 text-sm">samus run</p>
          <button
            onClick={() => dispatch({ type: "START" })}
            className="text-[#ededed] text-xs uppercase tracking-widest py-3 px-4"
          >
            tap to start
          </button>
          <p className="text-[#9ba3ad] text-xs font-mono tabular-nums">
            best: {state.highScore}
          </p>
        </div>
      )}

      {/* Overlay: playing HUD */}
      {state.screen === "playing" && (
        <div className="absolute top-4 right-4 text-[#9ba3ad] text-xs font-mono tabular-nums z-10">
          {state.score}
        </div>
      )}

      {/* Overlay: game over */}
      {state.screen === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <p className="text-[#ededed] text-sm">game over</p>
          <p className="text-[#9ba3ad] text-xs font-mono tabular-nums">{state.score}</p>
          <p className="text-[#9ba3ad] text-xs font-mono tabular-nums">
            best: {state.highScore}
          </p>
          <button
            onClick={() => dispatch({ type: "RESTART" })}
            className="text-[#ededed] text-xs uppercase tracking-widest py-3 px-4 mt-2"
          >
            restart
          </button>
        </div>
      )}
    </div>
  );
}
