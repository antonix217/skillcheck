import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';

const SYMBOLS = ['●', '■', '▲', '◆', '★', '♥', '♣', '♠', '✖', '✚'];
const STAGE_TIME = 7;
const R0 = 65;

export const PatternScan: React.FC<GameProps> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME);
  const [failed, setFailed] = useState(false);

  const rawRef = useRef(0); // Σ gridArea * timeBonus
  const levelRef = useRef(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const levelStartRef = useRef<number>(0);
  const finishedRef = useRef(false);

  const finishGame = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const raw = Math.max(0.01, rawRef.current);
    const score = Math.round(500 * Math.log2(raw / R0 + 1));
    onComplete(score, levelRef.current - 1); // levels completed
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(STAGE_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
  };

  const generateGrid = (lvl: number) => {
    const side = lvl + 2;
    const total = side * side;
    const newTarget = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const others = SYMBOLS.filter(s => s !== newTarget);
    const newGrid = Array(total).fill(null).map(() =>
      others[Math.floor(Math.random() * others.length)]
    );
    newGrid[Math.floor(Math.random() * total)] = newTarget;
    setTarget(newTarget);
    setGrid(newGrid);
    levelStartRef.current = performance.now();
    startTimer();
  };

  const handleStart = () => {
    setStarted(true);
    levelRef.current = 1;
    generateGrid(1);
  };

  const handleItemClick = (symbol: string) => {
    if (symbol !== target) return;
    const rt = performance.now() - levelStartRef.current;
    const side = levelRef.current + 2;
    const gridArea = side * side;
    const timeBonus = Math.max(0, (STAGE_TIME * 1000 - rt) / (STAGE_TIME * 1000));
    rawRef.current += gridArea * timeBonus;

    const next = levelRef.current + 1;
    levelRef.current = next;
    setLevel(next);
    generateGrid(next);
  };

  useEffect(() => {
    if (!started || timeLeft > 0) return;
    clearInterval(timerRef.current!);
    setFailed(true);
    const t = window.setTimeout(() => finishGame(), 1200);
    return () => clearTimeout(t);
  }, [timeLeft, started]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const side = level + 2;
  const cellSize = Math.max(28, Math.min(52, Math.floor(460 / side)));
  const gridWidth = cellSize * side + 8 * (side - 1);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 relative">
      {!started ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">PATTERN SCAN</h2>
          <p className="text-xl opacity-60 mb-2">Find the unique symbol — {STAGE_TIME}s per stage</p>
          <p className="text-sm opacity-40 mb-8">Grid grows indefinitely — survive as long as you can</p>
          <button onClick={handleStart} className="btn-primary">Start</button>
        </div>
      ) : (
        <>
          {failed && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
              <p className="text-6xl font-black font-mono text-[#FF4E00] tracking-tighter">TIME OUT</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-8">
            <div className="text-sm font-mono text-[#88888E] uppercase tracking-widest">Target:</div>
            <div className="text-6xl text-[#00F5FF] font-black">{target}</div>
            <div className="text-sm font-mono text-[#88888E] uppercase tracking-widest">Stage {level}</div>
            <div className={`text-sm font-mono uppercase tracking-widest ${timeLeft <= 2 ? 'text-[#FF4E00]' : 'text-[#88888E]'}`}>
              {timeLeft}s
            </div>
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${side}, ${cellSize}px)`,
              width: `${gridWidth}px`,
            }}
          >
            {grid.map((symbol, i) => (
              <button
                key={i}
                onClick={() => handleItemClick(symbol)}
                style={{ width: cellSize, height: cellSize }}
                className="bg-white/[0.03] hover:bg-white/10 border border-[#1A1A1E] rounded-lg flex items-center justify-center text-xl transition-colors"
              >
                {symbol}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
