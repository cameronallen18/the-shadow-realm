"use client";

import Link from "next/link";
import { useReducer, useRef, useEffect, useCallback, useState } from "react";
import { setupCanvas } from "./canvas/setupCanvas";
import { drawEnvironment } from "./canvas/drawEnvironment";
import { drawSamusIdle, drawSamusJump, drawSamusSprite } from "./canvas/drawSamus";
import { drawRockWall } from "./canvas/drawObstacleShape";
import { PHYSICS, GAME, SPRITE_LAYOUT } from "./constants";
import { GamePhysicsState, createInitialGameState, updateGame, triggerJump } from "./gameLoop";
import { AudioManager, createAudioManager } from "./audioManager";

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
    case "GAME_OVER": {
      const newHigh = Math.max(state.highScore, action.score);
      if (typeof window !== "undefined" && newHigh > state.highScore) {
        localStorage.setItem("samusRunHighScore", String(newHigh));
      }
      return {
        screen: "gameover",
        score: action.score,
        highScore: newHigh,
      };
    }
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
  physics?: GamePhysicsState,
  sprites?: { samus: HTMLImageElement | null; bg: HTMLImageElement | null },
  animState?: { frame: number; accumulator: number; isScrewAttack: boolean }
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
    const isAirborne = physics.samusY < height * GAME.floorRatio - 1;
    if (sprites?.samus && isAirborne) {
      drawSamusSprite(ctx, sprites.samus, samusX, physics.samusY, GAME.samusScale, animState, isAirborne);
    } else if (isAirborne) {
      drawSamusJump(ctx, samusX, physics.samusY, GAME.samusScale);
    } else {
      drawSamusIdle(ctx, samusX, physics.samusY, GAME.samusScale);
    }
  } else {
    // Static idle/gameover scene (shape fallback preserved)
    const obstacleX = width * GAME.obstacleXRatio;
    drawRockWall(ctx, obstacleX, height * 0.15, height * 0.6, GAME.obstacleWidth, height);
    const samusX = width * GAME.samusXRatio;
    const samusY = height * GAME.floorRatio;
    drawSamusIdle(ctx, samusX, samusY, GAME.samusScale);
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SamusRunGame() {
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    let stored = 0;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("samusRunHighScore");
      if (raw !== null) stored = parseInt(raw, 10) || 0;
    }
    return { screen: "idle" as GameScreen, score: 0, highScore: stored };
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GamePhysicsState | null>(null);
  const screenRef = useRef<GameScreen>(state.screen);
  const canvasWidthRef = useRef(0);
  const canvasHeightRef = useRef(0);
  const scoreRef = useRef(0);
  const scoreDisplayRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioManager | null>(null);

  // spritesRef — loaded once on mount by Effect D.
  // samus.png is pre-converted RGBA (background stripped at build time via sharp).
  // Both start null; Phase 9 draw calls must gate on samus !== null.
  const spritesRef = useRef<{
    samus: HTMLImageElement | null;
    bg: HTMLImageElement | null;
  }>({ samus: null, bg: null });

  // Triggers Effect A re-render once sprites finish loading on the idle screen.
  const [spritesLoaded, setSpritesLoaded] = useState(false);

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
      drawScene(ctx, state.screen, rect.width, rect.height, undefined, spritesRef.current, undefined);
    }

    render();

    const parent = canvas.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(() => render());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [state.screen, spritesLoaded]);

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
    let lastScore = 0;

    // AnimState lives in Effect B closure per D-10 — auto-resets on game restart
    const animState = {
      frame: 0,
      accumulator: 0,
      isScrewAttack: false,
    };

    const SPIN_FPS = 10;
    const FRAME_DURATION = 1 / SPIN_FPS; // 0.1s per frame

    function loop(ts: number) {
      const game = gameRef.current;
      if (!game) return;

      const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, PHYSICS.dtCap);
      lastTs = ts;

      updateGame(game, dt, canvasWidthRef.current, canvasHeightRef.current);

      // Sync live score ref and DOM display (avoids React re-render per frame)
      scoreRef.current = game.obstaclesCleared;
      if (scoreDisplayRef.current) {
        scoreDisplayRef.current.textContent = String(game.obstaclesCleared);
      }

      // Score sound — fires when obstaclesCleared increments
      if (game.obstaclesCleared > lastScore) {
        lastScore = game.obstaclesCleared;
        audioRef.current?.playScore();
      }

      // AnimState: airborne detection
      const isAirborne = game.samusY < canvasHeightRef.current * GAME.floorRatio - 1;
      const isOnFloor = !isAirborne;

      // Consume pendingScrewAttack flag from physics state (set by handleInput when mid-air jump fires)
      if (game.pendingScrewAttack) {
        animState.isScrewAttack = true;
        animState.frame = 0;
        animState.accumulator = 0;
        game.pendingScrewAttack = false;
      }

      // Reset animation on landing
      if (isOnFloor) {
        animState.isScrewAttack = false;
        animState.frame = 0;
        animState.accumulator = 0;
      }

      // Advance frames only while airborne
      if (isAirborne) {
        animState.accumulator += dt;
        if (animState.accumulator >= FRAME_DURATION) {
          animState.accumulator -= FRAME_DURATION; // subtract, not reset — preserves leftover for 120Hz accuracy
          const section = animState.isScrewAttack ? SPRITE_LAYOUT.screwAttackR : SPRITE_LAYOUT.spinJump;
          animState.frame = (animState.frame + 1) % section.frames;
        }
      }

      // WR-03 fix: check game over BEFORE drawing the final frame
      if (game.gameOver) {
        audioRef.current?.playDeath();
        dispatch({ type: "GAME_OVER", score: game.obstaclesCleared });
        return; // stop loop
      }

      const cvs = canvasRef.current;
      if (cvs) {
        const ctx = setupCanvas(cvs);
        if (ctx) {
          const r = cvs.getBoundingClientRect();
          canvasWidthRef.current = r.width;
          canvasHeightRef.current = r.height;
          drawScene(ctx, "playing", r.width, r.height, game, spritesRef.current, animState);
        }
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [state.screen]);

  // Unified input handler — reads screenRef to avoid stale closure
  const handleInput = useCallback(() => {
    // Lazily create AudioManager on first user gesture (iOS AudioContext unlock per D-03)
    if (!audioRef.current) {
      audioRef.current = createAudioManager();
    }

    if (screenRef.current === "idle") {
      dispatch({ type: "START" });
      // pendingJump is set in the rAF effect when it initializes gameRef
    } else if (screenRef.current === "playing") {
      const game = gameRef.current;
      if (game) {
        if (game.samusVY !== 0) {
          game.pendingScrewAttack = true; // mid-air jump — signal Effect B to enter screw attack mode
        }
        triggerJump(game);
        audioRef.current?.playJump(); // WR-02 fix: optional chaining null guard
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

  // Effect D: Load sprite PNGs once on mount.
  // samus.png is pre-converted RGBA (background stripped via sharp at build time).
  // Both are same-origin assets in public/sprites/ — no CORS issue.
  useEffect(() => {
    function loadImage(src: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
        img.src = src + "?v=3";
      });
    }

    let cancelled = false;

    Promise.all([
      loadImage("/sprites/samus.png"),
      loadImage("/sprites/norfair_upper.png"),
    ])
      .then(([samusImg, bgImg]) => {
        if (cancelled) return;
        spritesRef.current.samus = samusImg;
        spritesRef.current.bg = bgImg;
        setSpritesLoaded(true);
      })
      .catch((err) => {
        // Non-fatal: shape fallback Samus continues to render.
        console.warn("[Effect D] Sprite load failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []); // Empty deps = mount-only. Sprites are global assets, load once per session.

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
            onClick={handleInput}
            className="text-[#ededed] text-xs uppercase tracking-widest py-3 px-4"
          >
            tap to start
          </button>
          <p className="text-[#9ba3ad] text-xs font-mono tabular-nums">
            best: {state.highScore}
          </p>
        </div>
      )}

      {/* Overlay: playing HUD — score updated via DOM ref each rAF frame */}
      {state.screen === "playing" && (
        <div
          ref={scoreDisplayRef}
          className="absolute top-4 right-4 text-[#9ba3ad] text-xs font-mono tabular-nums z-10"
        >
          0
        </div>
      )}

      {/* Overlay: game over */}
      {state.screen === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <p className="text-[#ededed] text-sm">game over</p>
          <p className="text-[#9ba3ad] text-xs font-mono tabular-nums">{state.score}</p>
          {state.score > 0 && state.score >= state.highScore && (
            <p className="text-[#9ba3ad] text-xs">new best</p>
          )}
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
