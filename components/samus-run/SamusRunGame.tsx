"use client";

import Link from "next/link";
import { useReducer, useRef, useEffect } from "react";
import { setupCanvas } from "./canvas/setupCanvas";

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
      // Temporary: fill with Norfair sky color to prove canvas works
      ctx.fillStyle = "#0d0608";
      ctx.fillRect(0, 0, rect.width, rect.height);
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
