"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Operation = "multiply" | "divide" | "add" | "subtract";
type Screen = "start" | "quiz" | "results";
type QuestionCount = 5 | 10 | 15 | 20 | "endless";

interface Question {
  a: number;
  b: number;
  op: Operation;
  symbol: string;
  answer: number;
}

interface ResultEntry {
  q: Question;
  userAnswer: number;
  correct: boolean;
  time: number;
}

interface ScoreTrackerProps {
  correct: number;
  total: number;
  onSave?: (correct: number, total: number) => void; // future auth hook
}

// ── Constants ──────────────────────────────────────────────────────────────

const OP_SYMBOLS: Record<Operation, string> = {
  multiply: "×",
  divide: "÷",
  add: "+",
  subtract: "−",
};

const RING_CIRC = 163;
const TIMER_DRAIN_SECS = 15;

// ── Pure helpers ───────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  if (max < min) {
    const t = min;
    min = max;
    max = t;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(
  selectedOps: Set<Operation>,
  rangeMin: number,
  rangeMax: number
): Question {
  const ops = [...selectedOps] as Operation[];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const min = Math.max(0, rangeMin);
  const max = Math.max(min + 1, rangeMax);
  const symbol = OP_SYMBOLS[op];
  let a: number, b: number, answer: number;

  if (op === "multiply") {
    a = randInt(min, max);
    b = randInt(min, max);
    answer = a * b;
  } else if (op === "add") {
    a = randInt(min, max);
    b = randInt(min, max);
    answer = a + b;
  } else if (op === "subtract") {
    a = randInt(min, max);
    b = randInt(min, max);
    if (b > a) {
      const t = a;
      a = b;
      b = t;
    }
    answer = a - b;
  } else {
    // divide — generate clean whole-number answer
    b = randInt(Math.max(1, min), Math.max(1, max));
    answer = randInt(min, max);
    a = answer * b;
    if (a > 999) {
      answer = Math.floor(999 / b);
      a = answer * b;
    }
  }

  return { a, b, op, symbol, answer };
}

// ── ScoreTracker component ─────────────────────────────────────────────────

function ScoreTracker({ correct, total }: ScoreTrackerProps) {
  if (total === 0) return null;
  return (
    <div className="text-[#ededed]/50 text-xs tracking-widest uppercase tabular-nums">
      {correct} / {total} correct
    </div>
  );
}

// ── Timer ring (SVG) ───────────────────────────────────────────────────────

interface TimerRingProps {
  frac: number;
  elapsed: number;
  isEndless: boolean;
  ringColor: string;
}

function TimerRing({ frac, elapsed, isEndless, ringColor }: TimerRingProps) {
  const offset = RING_CIRC * (1 - frac);
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg
        viewBox="0 0 56 56"
        width="56"
        height="56"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="28"
          cy="28"
          r="26"
          fill="none"
          stroke="#222"
          strokeWidth="3"
        />
        <circle
          cx="28"
          cy="28"
          r="26"
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          style={
            isEndless
              ? { animation: "pulse-ring 2s ease-in-out infinite" }
              : { transition: "stroke 0.3s" }
          }
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[15px] font-medium text-[#ededed]">
        {elapsed.toFixed(1)}
      </div>
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────

export default function MathFlashcardsPage() {
  // Config state
  const [selectedOps, setSelectedOps] = useState<Set<Operation>>(
    new Set(["multiply"])
  );
  const [rangeMin, setRangeMin] = useState(2);
  const [rangeMax, setRangeMax] = useState(12);
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);

  // Screen state
  const [screen, setScreen] = useState<Screen>("start");

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ringFrac, setRingFrac] = useState(1);
  const [ringColor, setRingColor] = useState("#e8ff47");
  const [bodyFlash, setBodyFlash] = useState<"correct" | "wrong" | null>(null);
  const [problemPop, setProblemPop] = useState(false);

  // Score counters (isolated per D-11)
  const [scoreCorrect, setScoreCorrect] = useState(0);
  const [scoreTotal, setScoreTotal] = useState(0);

  const questionStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isEndless = questionCount === "endless";

  // ── Timer ────────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (endless: boolean) => {
      stopTimer();
      timerRef.current = setInterval(() => {
        const e = (performance.now() - questionStartRef.current) / 1000;
        setElapsed(e);
        if (!endless) {
          const frac = Math.max(0, 1 - e / TIMER_DRAIN_SECS);
          setRingFrac(frac);
          setRingColor(
            frac <= 0.3 ? "#c8cdd4" : frac <= 0.6 ? "#9ba3ad" : "#ededed"
          );
        }
      }, 50);
    },
    [stopTimer]
  );

  // ── Load question ────────────────────────────────────────────────────────

  const loadQuestion = useCallback(
    (
      idx: number,
      qs: Question[],
      endless: boolean,
      ops: Set<Operation>,
      min: number,
      max: number
    ) => {
      setAnswered(false);
      setCurrentInput("");
      setFeedback(null);
      setElapsed(0);
      setRingFrac(1);
      setRingColor(endless ? "#9ba3ad" : "#ededed");

      let q: Question;
      if (endless) {
        q = generateQuestion(ops, min, max);
        setQuestions((prev) => [...prev, q]);
      } else {
        q = qs[idx];
      }

      questionStartRef.current = performance.now();
      startTimer(endless);
    },
    [startTimer]
  );

  // ── Start quiz ───────────────────────────────────────────────────────────

  const startQuiz = useCallback(() => {
    stopTimer();
    const endless = questionCount === "endless";

    const qs: Question[] = [];
    if (!endless) {
      const count = questionCount as number;
      for (let i = 0; i < count; i++) {
        qs.push(generateQuestion(selectedOps, rangeMin, rangeMax));
      }
    }

    setQuestions(qs);
    setCurrentIdx(0);
    setResults([]);
    setStreak(0);
    setScoreCorrect(0);
    setScoreTotal(0);
    setScreen("quiz");
    setAnswered(false);
    setCurrentInput("");
    setFeedback(null);
    setElapsed(0);
    setRingFrac(1);
    setRingColor(endless ? "#9ba3ad" : "#ededed");

    questionStartRef.current = performance.now();
    startTimer(endless);
  }, [questionCount, selectedOps, rangeMin, rangeMax, stopTimer, startTimer]);

  // Reset endless questions on start (avoid stale closure)
  const questionsRef = useRef<Question[]>([]);
  questionsRef.current = questions;

  // ── Submit answer ────────────────────────────────────────────────────────

  const submitAnswer = useCallback(() => {
    if (currentInput === "" || answered) return;
    const val = parseInt(currentInput, 10);
    if (isNaN(val)) return;

    stopTimer();
    setAnswered(true);

    const e = (performance.now() - questionStartRef.current) / 1000;
    const qs = questionsRef.current;
    const q = isEndless ? qs[qs.length - 1] : qs[currentIdx];
    const isCorrect = val === q.answer;

    const entry: ResultEntry = { q, userAnswer: val, correct: isCorrect, time: e };

    setResults((prev) => [...prev, entry]);
    setScoreTotal((prev) => prev + 1);

    if (isCorrect) {
      setStreak((prev) => prev + 1);
      setScoreCorrect((prev) => prev + 1);
      setFeedback("correct");
      setBodyFlash("correct");
      setTimeout(() => setBodyFlash(null), 400);
    } else {
      setStreak(0);
      setFeedback("wrong");
      setBodyFlash("wrong");
      setTimeout(() => setBodyFlash(null), 400);
    }

    setProblemPop(true);
    setTimeout(() => setProblemPop(false), 200);

    setTimeout(() => {
      const nextIdx = currentIdx + 1;
      const done = !isEndless && nextIdx >= (questionCount as number);
      if (done) {
        setScreen("results");
      } else {
        setCurrentIdx(nextIdx);
        // loadQuestion called via useEffect on currentIdx change
        if (!isEndless) {
          setQuestions((qs2) => {
            loadQuestion(nextIdx, qs2, false, selectedOps, rangeMin, rangeMax);
            return qs2;
          });
        } else {
          loadQuestion(nextIdx, [], true, selectedOps, rangeMin, rangeMax);
        }
      }
    }, 700);
  }, [
    currentInput,
    answered,
    currentIdx,
    isEndless,
    questionCount,
    selectedOps,
    rangeMin,
    rangeMax,
    stopTimer,
    loadQuestion,
  ]);

  // ── Keyboard support ─────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "quiz") return;
    const handleKey = (e: KeyboardEvent) => {
      if (answered) return;
      if (e.key >= "0" && e.key <= "9") {
        setCurrentInput((prev) => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === "Backspace") {
        setCurrentInput((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        submitAnswer();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen, answered, submitAnswer]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── Numpad handler ───────────────────────────────────────────────────────

  const handleNumpad = (val: string) => {
    if (answered) return;
    if (val === "clear") {
      setCurrentInput((prev) => prev.slice(0, -1));
    } else if (val === "submit") {
      submitAnswer();
    } else {
      setCurrentInput((prev) => (prev.length < 4 ? prev + val : prev));
    }
  };

  // ── Op toggle ────────────────────────────────────────────────────────────

  const toggleOp = (op: Operation) => {
    setSelectedOps((prev) => {
      const next = new Set(prev);
      if (next.has(op)) {
        if (next.size === 1) return prev;
        next.delete(op);
      } else {
        next.add(op);
      }
      return next;
    });
  };

  // ── Quit ─────────────────────────────────────────────────────────────────

  const handleQuit = () => {
    stopTimer();
    if (results.length > 0) {
      setScreen("results");
    } else {
      setScreen("start");
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const currentQuestion = isEndless
    ? questions[questions.length - 1]
    : questions[currentIdx];

  const displayProgress = isEndless
    ? null
    : Math.round((currentIdx / (questionCount as number)) * 100);

  // ── Results stats ─────────────────────────────────────────────────────────

  const resultStats = (() => {
    if (results.length === 0) return null;
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const times = results.map((r) => r.time);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);
    const fastestIdx = times.indexOf(fastest);
    return { total, correct, avg, fastest, slowest, fastestIdx };
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes flash-correct-anim {
          0% { background: rgba(200,205,212,0.1); }
          100% { background: #0a0a0a; }
        }
        @keyframes flash-wrong-anim {
          0% { background: rgba(155,163,173,0.1); }
          100% { background: #0a0a0a; }
        }
        @keyframes pop-anim {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes shimmer-anim {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(350%); }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-3 py-6"
        style={
          bodyFlash === "correct"
            ? { animation: "flash-correct-anim 0.4s ease-out" }
            : bodyFlash === "wrong"
              ? { animation: "flash-wrong-anim 0.4s ease-out" }
              : undefined
        }
      >
        {/* Back link */}
        <Link
          href="/"
          className="fixed top-4 left-4 text-[#ededed]/40 text-xs hover:text-[#ededed]/70 transition-colors duration-0 z-50"
        >
          ← the shadow realm
        </Link>

        <div className="w-full max-w-[480px]">

          {/* ── START SCREEN ── */}
          {screen === "start" && (
            <div className="flex flex-col items-center">
              {/* Logo */}
              <div
                className="font-mono text-[#ededed] tracking-[4px] leading-none mb-0.5"
                style={{ fontSize: "clamp(48px, 14vw, 72px)", fontWeight: 700 }}
              >
                BLITZ
              </div>
              <div className="text-[10px] tracking-[6px] uppercase text-[#ededed]/40 mb-5">
                Arithmetic · Speed · Score
              </div>

              {/* Operations */}
              <div className="text-[10px] tracking-[3px] uppercase text-[#ededed]/40 mb-1.5 w-full">
                Operations
              </div>
              <div className="w-full grid grid-cols-2 gap-1.5 mb-3.5">
                {(
                  [
                    ["multiply", "× Multiply"],
                    ["divide", "÷ Divide"],
                    ["add", "+ Add"],
                    ["subtract", "− Subtract"],
                  ] as [Operation, string][]
                ).map(([op, label]) => (
                  <button
                    key={op}
                    onClick={() => toggleOp(op)}
                    className={`border rounded px-2 py-2.5 text-[13px] font-mono transition-colors duration-0 text-center ${
                      selectedOps.has(op)
                        ? "border-[#ededed] text-[#ededed] bg-[#ededed]/5"
                        : "border-[#ededed]/15 text-[#ededed]/40 bg-[#12121a]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Number range */}
              <div className="text-[10px] tracking-[3px] uppercase text-[#ededed]/40 mb-1.5 w-full">
                Number Range
              </div>
              <div className="w-full flex items-center gap-3 mb-3.5">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] tracking-widest uppercase text-[#ededed]/40">
                    Min
                  </label>
                  <input
                    type="number"
                    value={rangeMin}
                    min={0}
                    max={99}
                    onChange={(e) => setRangeMin(Number(e.target.value))}
                    className="bg-[#12121a] border border-[#ededed]/15 rounded text-[#ededed] font-mono text-[17px] text-center py-1.5 outline-none focus:border-[#ededed]/60 transition-colors duration-0 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="text-[#ededed]/40 text-base pt-5">—</div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] tracking-widest uppercase text-[#ededed]/40">
                    Max
                  </label>
                  <input
                    type="number"
                    value={rangeMax}
                    min={1}
                    max={144}
                    onChange={(e) => setRangeMax(Number(e.target.value))}
                    className="bg-[#12121a] border border-[#ededed]/15 rounded text-[#ededed] font-mono text-[17px] text-center py-1.5 outline-none focus:border-[#ededed]/60 transition-colors duration-0 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Question count */}
              <div className="text-[10px] tracking-[3px] uppercase text-[#ededed]/40 mb-1.5 w-full">
                Questions
              </div>
              <div className="w-full mb-3.5">
                <div className="flex bg-[#12121a] border border-[#ededed]/15 rounded overflow-hidden">
                  {([5, 10, 15, 20, "endless"] as QuestionCount[]).map(
                    (val) => (
                      <button
                        key={val}
                        onClick={() => setQuestionCount(val)}
                        className={`flex-1 py-2 px-1 font-mono text-[13px] transition-colors duration-0 ${
                          questionCount === val
                            ? "bg-[#ededed] text-[#0a0a0a] font-medium"
                            : "text-[#ededed]/40 hover:text-[#ededed]/70"
                        }`}
                      >
                        {val === "endless" ? "∞" : val}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={startQuiz}
                className="w-full bg-[#ededed] text-[#0a0a0a] font-mono font-bold text-[26px] tracking-[4px] py-3 rounded mt-0.5 hover:bg-[#c8cdd4] transition-colors duration-0"
              >
                START
              </button>
            </div>
          )}

          {/* ── QUIZ SCREEN ── */}
          {screen === "quiz" && currentQuestion && (
            <div className="flex flex-col items-center">
              {/* Header */}
              <div className="w-full flex justify-between items-center mb-3">
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] tracking-widest text-[#ededed]/50">
                    {isEndless
                      ? `Q ${currentIdx + 1}  ∞`
                      : `${currentIdx + 1} / ${questionCount}`}
                  </div>
                  {streak >= 3 && (
                    <div className="text-[11px] tracking-widest text-[#ededed]/70">
                      {streak} STREAK
                    </div>
                  )}
                  <button
                    onClick={handleQuit}
                    className="border border-[#ededed]/15 rounded text-[#ededed]/40 text-[10px] tracking-widest uppercase px-2.5 py-1 hover:border-[#ededed]/50 hover:text-[#ededed]/70 transition-colors duration-0 self-start mt-0.5"
                  >
                    ✕ Quit
                  </button>
                </div>
                <TimerRing
                  frac={ringFrac}
                  elapsed={elapsed}
                  isEndless={isEndless}
                  ringColor={ringColor}
                />
              </div>

              {/* Progress bar */}
              <div className="w-full h-0.5 bg-[#ededed]/10 rounded mb-3.5 overflow-hidden">
                {isEndless ? (
                  <div
                    className="h-full w-[40%] rounded"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, #9ba3ad, transparent)",
                      animation: "shimmer-anim 1.6s ease-in-out infinite",
                    }}
                  />
                ) : (
                  <div
                    className="h-full bg-[#ededed]/60 rounded transition-all duration-0"
                    style={{ width: `${displayProgress}%` }}
                  />
                )}
              </div>

              {/* Score tracker */}
              <div className="mb-2">
                <ScoreTracker correct={scoreCorrect} total={scoreTotal} />
              </div>

              {/* Problem display */}
              <div
                className="font-mono text-[#ededed] text-center mb-2.5 leading-none"
                style={{
                  fontSize: "clamp(40px, 14vw, 64px)",
                  letterSpacing: "2px",
                  animation: problemPop ? "pop-anim 0.2s ease-out" : undefined,
                }}
              >
                {currentQuestion.a} {currentQuestion.symbol} {currentQuestion.b}
              </div>

              {/* Answer display */}
              <div
                className={`w-full bg-[#12121a] border-2 rounded font-mono text-[40px] text-center py-2 px-2 tracking-[4px] mb-2 min-h-[60px] flex items-center justify-center transition-colors duration-0 ${
                  feedback === "correct"
                    ? "border-[#c8cdd4] text-[#c8cdd4]"
                    : feedback === "wrong"
                      ? "border-[#9ba3ad] text-[#9ba3ad]"
                      : currentInput
                        ? "border-[#ededed] text-[#ededed]"
                        : "border-[#ededed]/15 text-[#ededed]/30"
                }`}
              >
                {currentInput || "?"}
              </div>

              {/* Numpad */}
              <div className="w-full grid grid-cols-3 gap-1.5">
                {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleNumpad(n)}
                    className="bg-[#12121a] border border-[#ededed]/15 rounded text-[#ededed] font-mono text-[20px] font-medium py-3 hover:bg-[#1e1e2a] hover:border-[#ededed]/30 active:scale-95 transition-colors duration-0"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => handleNumpad("clear")}
                  className="bg-[#12121a] border border-[#ededed]/15 rounded text-[#9ba3ad] font-mono text-[20px] py-3 hover:bg-[#1e1e2a] active:scale-95 transition-colors duration-0"
                >
                  ⌫
                </button>
                <button
                  onClick={() => handleNumpad("0")}
                  className="bg-[#12121a] border border-[#ededed]/15 rounded text-[#ededed] font-mono text-[20px] font-medium py-3 hover:bg-[#1e1e2a] hover:border-[#ededed]/30 active:scale-95 transition-colors duration-0"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumpad("submit")}
                  disabled={!currentInput || answered}
                  className="bg-[#ededed] border border-[#ededed] rounded text-[#0a0a0a] font-mono text-[22px] font-bold py-3 hover:bg-[#c8cdd4] active:scale-95 transition-colors duration-0 disabled:opacity-30 disabled:cursor-default"
                >
                  ✓
                </button>
              </div>

              {/* Feedback */}
              <div
                className={`h-6 flex items-center justify-center text-[12px] tracking-[3px] mt-1 transition-opacity duration-0 ${
                  feedback ? "opacity-100" : "opacity-0"
                } ${feedback === "correct" ? "text-[#c8cdd4]" : "text-[#9ba3ad]"}`}
              >
                {feedback === "correct"
                  ? elapsed < 3
                    ? "FAST"
                    : "CORRECT"
                  : feedback === "wrong"
                    ? `✗ ${currentQuestion.answer}`
                    : ""}
              </div>
            </div>
          )}

          {/* ── RESULTS SCREEN ── */}
          {screen === "results" && resultStats && (
            <div className="flex flex-col items-center">
              <div className="font-mono text-[#ededed] text-[48px] tracking-[4px] leading-none mb-0.5">
                {isEndless ? "SESSION" : "DONE"}
              </div>
              <div className="text-[10px] tracking-[4px] uppercase text-[#ededed]/40 mb-4">
                {resultStats.total} question{resultStats.total !== 1 ? "s" : ""}{" "}
                complete
              </div>
              {isEndless && (
                <div className="text-[9px] tracking-[3px] uppercase text-[#9ba3ad] border border-[#9ba3ad] rounded px-1.5 py-0.5 mb-3.5 opacity-80">
                  ∞ Endless Mode
                </div>
              )}

              {/* Stats grid */}
              <div className="w-full grid grid-cols-2 gap-2 mb-3.5">
                <div className="bg-[#12121a] border border-[#ededed]/10 rounded p-2.5 text-center">
                  <div className="font-mono text-[32px] tracking-widest leading-none text-[#c8cdd4]">
                    {resultStats.correct}/{resultStats.total}
                  </div>
                  <div className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 mt-1">
                    Correct
                  </div>
                </div>
                <div className="bg-[#12121a] border border-[#ededed]/10 rounded p-2.5 text-center">
                  <div className="font-mono text-[32px] tracking-widest leading-none text-[#9ba3ad]">
                    {resultStats.avg.toFixed(1)}s
                  </div>
                  <div className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 mt-1">
                    Avg Speed
                  </div>
                </div>
                <div className="bg-[#12121a] border border-[#ededed]/10 rounded p-2.5 text-center">
                  <div className="font-mono text-[32px] tracking-widest leading-none text-[#c8cdd4]">
                    {resultStats.fastest.toFixed(1)}s
                  </div>
                  <div className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 mt-1">
                    Fastest
                  </div>
                </div>
                <div className="bg-[#12121a] border border-[#ededed]/10 rounded p-2.5 text-center">
                  <div className="font-mono text-[32px] tracking-widest leading-none text-[#ededed]/50">
                    {resultStats.slowest.toFixed(1)}s
                  </div>
                  <div className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 mt-1">
                    Slowest
                  </div>
                </div>
              </div>

              {/* Results table */}
              <div className="max-h-[220px] overflow-y-auto w-full mb-3.5 scrollbar-thin">
                <table className="w-full border-collapse text-[12px] font-mono">
                  <thead>
                    <tr>
                      <th className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 pb-2 pt-2 px-1 text-left border-b border-[#ededed]/10">
                        #
                      </th>
                      <th className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 pb-2 pt-2 px-1 text-left border-b border-[#ededed]/10">
                        Problem
                      </th>
                      <th className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 pb-2 pt-2 px-1 text-left border-b border-[#ededed]/10">
                        Answer
                      </th>
                      <th className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 pb-2 pt-2 px-1 text-right border-b border-[#ededed]/10">
                        Result
                      </th>
                      <th className="text-[9px] tracking-[3px] uppercase text-[#ededed]/40 pb-2 pt-2 px-1 text-right border-b border-[#ededed]/10">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          i === resultStats.fastestIdx
                            ? "text-[#9ba3ad]"
                            : "text-[#ededed]/70"
                        }
                      >
                        <td className="py-2 px-1 border-b border-[#ededed]/5 last:border-0">
                          {i + 1}
                        </td>
                        <td className="py-2 px-1 border-b border-[#ededed]/5">
                          {r.q.a} {r.q.symbol} {r.q.b}
                        </td>
                        <td className="py-2 px-1 border-b border-[#ededed]/5">
                          {r.correct
                            ? r.userAnswer
                            : `${r.userAnswer} (${r.q.answer})`}
                        </td>
                        <td className="py-2 px-1 border-b border-[#ededed]/5 text-right">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              r.correct ? "bg-[#c8cdd4]" : "bg-[#9ba3ad]"
                            }`}
                          />
                          {r.correct ? "Yes" : "No"}
                        </td>
                        <td className="py-2 px-1 border-b border-[#ededed]/5 text-right text-[#ededed]/40">
                          {r.time.toFixed(2)}s
                          {i === resultStats.fastestIdx ? " ⚡" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action buttons */}
              <div className="w-full flex gap-2.5">
                <button
                  onClick={() => setScreen("start")}
                  className="flex-1 border border-[#ededed]/15 text-[#ededed]/50 font-mono text-[12px] tracking-widest uppercase py-3.5 rounded hover:border-[#ededed]/40 hover:text-[#ededed]/70 transition-colors duration-0"
                >
                  Settings
                </button>
                <button
                  onClick={startQuiz}
                  className="flex-[2] bg-[#ededed] text-[#0a0a0a] font-mono font-bold text-[22px] tracking-[3px] py-3.5 rounded hover:bg-[#c8cdd4] transition-colors duration-0"
                >
                  AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
