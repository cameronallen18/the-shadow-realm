"use client";

import Link from "next/link";
import { useReducer, useRef, useEffect, useCallback } from "react";
import { setupCanvas } from "./canvas/setupCanvas";
import { drawEnvironment } from "./canvas/drawEnvironment";
import { drawSamusIdle, drawSamusJump } from "./canvas/drawSamus";
import { drawRockWall } from "./canvas/drawObstacleShape";
import { PHYSICS, GAME } from "./constants";
import { GamePhysicsState, createInitialGameState, updateGame, triggerJump } from "./gameLoop";

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
  height: number,
  physics?: GamePhysicsState
): void {
  ctx.clearRect(0, 0, width, height);
  drawEnvironment(ctx, width, height);

  if (physics && screen === "playing") {
    // Dynamic obstacle positions from physics state
    for (const obs of physics.obstacles) {
      drawRockWall(ctx, obs.x, obs.gapTop, obs.gapBottom, GAME.obstacleWidth, height);
    }
    // Samus at physics-driven position
    const samusX = width * GAME.samusXRatio;
    const useJump = physics.samusVY < 0; // moving upward = jump sprite
    if (useJump) {
      drawSamusJump(ctx, samusX, physics.samusY, GAME.samusScale);
    } else {
      drawSamusIdle(ctx, samusX, physics.samusY, GAME.samusScale);
    }
  } else {
    // Static idle/gameover scene (Phase 5 behavior preserved)
    const obstacleX = width * GAME.obstacleXRatio;
    drawRockWall(ctx, obstacleX, height * 0.15, height * 0.6, GAME.obstacleWidth, height);
    const samusX = width * GAME.samusXRatio;
    const samusY = height * GAME.floorRatio;
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
  const gameRef = useRef<GamePhysicsState | null>(null);
  const screenRef = useRef<GameScreen>(state.screen);
  const canvasWidthRef = useRef(0);
  const canvasHeightRef = useRef(0);

  // Screen-ref mirror — keeps screenRef in sync without stale closure issues
  useEffect(() => {
    screenRef.current = state.screen;
  }, [state.screen]);

  // Effect A: Static render + ResizeObserver (idle and gameover states)
  useEffect(() => {
    if (state.screen === "playing") return; // rAF loop handles rendering during play

    const canvas = canvasRef.current;
    if (!canvas) return;

    function render() {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = setupCanvas(cvs);
      if (!ctx) return;
      const rect = cvs.getBoundingClientRect();
      canvasWidthRef.current = rect.width;
      canvasHeightRef.current = rect.height;
      drawScene(ctx, state.screen, rect.width, rect.height);
    }

    render();

    const parent = canvas.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(() => render());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [state.screen]);

  // Effect B: rAF game loop (playing state only)
  useEffect(() => {
    if (state.screen !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize fresh game state
    const rect = canvas.getBoundingClientRect();
    canvasWidthRef.current = rect.width;
    canvasHeightRef.current = rect.height;
    gameRef.current = createInitialGameState(rect.width, rect.height);

    // If the first input flagged a pending jump, apply it
    if (gameRef.current) {
      gameRef.current.pendingJump = true;
    }

    let rafId: number;
    let lastTs: number | null = null;

    function loop(ts: number) {
      const game = gameRef.current;
      if (!game) return;

      const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, PHYSICS.dtCap);
      lastTs = ts;

      updateGame(game, dt, canvasWidthRef.current, canvasHeightRef.current);

      const cvs = canvasRef.current;
      if (cvs) {
        const ctx = setupCanvas(cvs);
        if (ctx) {
          const r = cvs.getBoundingClientRect();
          canvasWidthRef.current = r.width;
          canvasHeightRef.current = r.height;
          drawScene(ctx, "playing", r.width, r.height, game);
        }
      }

      // Check game over (floor fall-through or future collision)
      if (game.gameOver) {
        dispatch({ type: "GAME_OVER", score: game.obstaclesCleared });
        return; // stop loop
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [state.screen]);

  // Unified input handler — reads screenRef to avoid stale closure
  const handleInput = useCallback(() => {
    if (screenRef.current === "idle") {
      dispatch({ type: "START" });
      // pendingJump is set in the rAF effect when it initializes gameRef
    } else if (screenRef.current === "playing") {
      const game = gameRef.current;
      if (game) {
        triggerJump(game);
      }
    }
    // gameover: do nothing — restart button handles it
  }, []);

  // Input listener registration (mount-only)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault(); // prevent page scroll on Space
        handleInput();
      }
    }

    function onClick() {
      handleInput();
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault(); // prevent scroll, double-tap zoom
      handleInput();
    }

    window.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouchStart);
    };
  }, [handleInput]);

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
