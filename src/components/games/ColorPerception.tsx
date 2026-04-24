import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const TIME_LIMIT = 10;
const R0 = 120;

function deltaL(level: number): number {
  return Math.max(0.5, 20 - (level - 1) * 0.85);
}

export const ColorPerception: React.FC<GameProps> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<{ id: number; color: string; isOdd: boolean }[]>([]);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef(1);
  const levelStartRef = useRef<number>(0);
  const rawRef = useRef(0); // Σ difficulty * timeBonus
  const finishedRef = useRef(false);

  const endGame = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const raw = Math.max(0.01, rawRef.current);
    const score = Math.round(500 * Math.log2(raw / R0 + 1));
    onComplete(score, levelRef.current);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 1) {
          clearInterval(timerRef.current!);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateLevel = (lvl: number) => {
    const side = lvl + 1; // level 1: 2×2, level 2: 3×3, ...
    const total = side * side;
    const h = Math.floor(Math.random() * 360);
    const s = 60 + Math.random() * 20;
    const l = 40 + Math.random() * 20;
    const diff = deltaL(lvl);
    const oddIdx = Math.floor(Math.random() * total);
    const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
    const oddColor = `hsl(${h}, ${s}%, ${l + (l > 50 ? -diff : diff)}%)`;
    setGrid(Array.from({ length: total }, (_, i) => ({
      id: i,
      color: i === oddIdx ? oddColor : baseColor,
      isOdd: i === oddIdx,
    })));
    levelStartRef.current = performance.now();
  };

  const handleStart = () => {
    setStarted(true);
    levelRef.current = 1;
    generateLevel(1);
    startTimer();
  };

  const handleBoxClick = (isOdd: boolean) => {
    if (isOdd) {
      const rt = performance.now() - levelStartRef.current;
      const lvl = levelRef.current;
      const side = lvl + 1;
      const difficulty = (side * side) / deltaL(lvl);
      const timeBonus = Math.max(0, (TIME_LIMIT * 1000 - rt) / (TIME_LIMIT * 1000));
      rawRef.current += difficulty * timeBonus;

      const next = lvl + 1;
      levelRef.current = next;
      setLevel(next);
      generateLevel(next);
      startTimer();
    } else {
      endGame();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {!started ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">COLOR PERCEPTION</h2>
          <p className="text-xl opacity-60 mb-2">Find the square with the different shade</p>
          <p className="text-sm opacity-40 mb-8">Wrong click ends the game — differences get subtler each level</p>
          <button onClick={handleStart} className="btn-primary">Start</button>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 font-mono text-[#00F5FF] tracking-widest uppercase text-sm font-bold">
            Stage {level} · Δ{deltaL(level).toFixed(1)}%
          </div>
          <div className="mb-6 w-[440px] mx-auto">
            <div className="flex justify-between text-[10px] font-mono text-[#88888E] uppercase tracking-widest mb-1">
              <span>Time</span>
              <span className={timeLeft <= 3 ? 'text-rose-400' : 'text-[#00F5FF]'}>{timeLeft}s</span>
            </div>
            <div className="h-1 bg-[#222] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timeLeft <= 3 ? 'bg-rose-500' : 'bg-[#00F5FF]'}`}
                animate={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
                transition={{ duration: 0.4, ease: 'linear' }}
              />
            </div>
          </div>

          {(() => {
            const side = level + 1;
            return (
              <div
                className="grid gap-2 theme-card p-4 mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${side}, 1fr)`,
                  width: '440px',
                  height: '440px',
                }}
              >
                {grid.map((box) => (
                  <button
                    key={box.id}
                    onClick={() => handleBoxClick(box.isOdd)}
                    className="w-full h-full rounded-md transition-all hover:scale-[1.02] active:scale-95"
                    style={{ backgroundColor: box.color }}
                  />
                ))}
              </div>
            );
          })()}

          <p className="mt-6 text-[#88888E] text-[10px] uppercase tracking-[3px] font-mono">
            Select the chromatic anomaly
          </p>
        </div>
      )}
    </div>
  );
};
