import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';

const SYMBOLS = ['●', '■', '▲', '◆', '★', '♥', '♣', '♠', '✖', '✚'];
const STAGE_TIME = 7;
const MAX_LEVELS = 10;

export const PatternScan: React.FC<GameProps> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const [start, setStart] = useState(false);
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME);
  const [failed, setFailed] = useState(false);
  const totalTimeRef = useRef(0);
  const levelRef = useRef(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerStartTimeRef = useRef<number>(0);
  const finishedRef = useRef(false);

  const finishGame = (total: number, levels: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const avg = total / levels;
    const score = Math.round(Math.max(0, Math.min(1000, 1000 - (avg - 500) * 0.66)));
    onComplete(score, Math.round(avg));
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(STAGE_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
  };

  const generateGrid = (lvl: number) => {
    const size = lvl + 2;
    const total = size * size;
    const newTarget = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const otherSymbols = SYMBOLS.filter(s => s !== newTarget);
    const newGrid = Array(total).fill(null).map(() =>
      otherSymbols[Math.floor(Math.random() * otherSymbols.length)]
    );
    newGrid[Math.floor(Math.random() * total)] = newTarget;
    setTarget(newTarget);
    setGrid(newGrid);
    containerStartTimeRef.current = performance.now();
    startTimer();
  };

  const handleStart = () => {
    setStart(true);
    levelRef.current = 1;
    generateGrid(1);
  };

  const handleItemClick = (symbol: string) => {
    if (symbol !== target) return;
    const stepTime = performance.now() - containerStartTimeRef.current;
    totalTimeRef.current += stepTime;
    if (levelRef.current >= MAX_LEVELS) {
      finishGame(totalTimeRef.current, MAX_LEVELS);
    } else {
      const nextLevel = levelRef.current + 1;
      levelRef.current = nextLevel;
      setLevel(nextLevel);
      generateGrid(nextLevel);
    }
  };

  useEffect(() => {
    if (!start || timeLeft > 0) return;
    clearInterval(timerRef.current!);
    setFailed(true);
    const t = window.setTimeout(() => {
      finishGame(totalTimeRef.current + STAGE_TIME * 1000, Math.max(1, levelRef.current));
    }, 1200);
  }, [timeLeft, start]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const cellSize = Math.max(32, Math.min(56, Math.floor(480 / (level + 2))));
  const gridWidth = cellSize * (level + 2) + 8 * (level + 1);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8 relative">
      {!start ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">PATTERN SCAN</h2>
          <p className="text-xl opacity-60 mb-8">Find the unique symbol — {STAGE_TIME}s per stage</p>
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
            <div className="text-sm font-mono text-[#88888E] uppercase tracking-widest">Stage {level}/{MAX_LEVELS}</div>
            <div className={`text-sm font-mono uppercase tracking-widest ${timeLeft <= 2 ? 'text-[#FF4E00]' : 'text-[#88888E]'}`}>
              {timeLeft}s
            </div>
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${level + 2}, ${cellSize}px)`,
              width: `${gridWidth}px`,
            }}
          >
            {grid.map((symbol, i) => (
              <button
                key={i}
                onClick={() => handleItemClick(symbol)}
                style={{ width: cellSize, height: cellSize }}
                className="bg-white/[0.03] hover:bg-white/10 border border-[#1A1A1E] rounded-lg flex items-center justify-center text-2xl transition-colors"
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
