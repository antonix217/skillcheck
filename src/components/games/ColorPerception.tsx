import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const TIME_LIMIT = 10;

export const ColorPerception: React.FC<GameProps> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<{ id: number; color: string; isOdd: boolean }[]>([]);
  const [start, setStart] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef(1);
  const finishedRef = useRef(false);
  const maxLevels = 20;

  const generateLevel = (lvl: number) => {
    const size = Math.min(8, Math.floor(lvl / 2) + 3);
    const total = size * size;

    const h = Math.floor(Math.random() * 360);
    const s = 60 + Math.random() * 20;
    const l = 40 + Math.random() * 20;

    // As level increases, the difference in lightness decreases
    const diff = Math.max(2, 18 - lvl * 0.9);
    const oddIdx = Math.floor(Math.random() * total);
    
    const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
    const oddColor = `hsl(${h}, ${s}%, ${l + (l > 50 ? -diff : diff)}%)`;
    
    const newGrid = Array(total).fill(null).map((_, i) => ({
      id: i,
      color: i === oddIdx ? oddColor : baseColor,
      isOdd: i === oddIdx
    }));
    
    setGrid(newGrid);
  };

  const endGame = (lvl: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const score = Math.max(0, Math.min(1000, (lvl - 1) * 52));
    onComplete(score, lvl);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 1) {
          clearInterval(timerRef.current!);
          endGame(levelRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = () => {
    setStart(true);
    startTimeRef.current = performance.now();
    levelRef.current = 1;
    generateLevel(1);
    startTimer();
  };

  const handleBoxClick = (isOdd: boolean) => {
    if (isOdd) {
      if (level >= maxLevels) {
        if (finishedRef.current) return;
        finishedRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        onComplete(1000, level);
      } else {
        const next = level + 1;
        levelRef.current = next;
        setLevel(next);
        generateLevel(next);
        startTimer();
      }
    } else {
      endGame(level);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {!start ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">COLOR PERCEPTION</h2>
          <p className="text-xl opacity-60 mb-8">Find the square with the different shade</p>
          <button onClick={handleStart} className="btn-primary">Start</button>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 font-mono text-[#00F5FF] tracking-widest uppercase text-sm font-bold">
            Perception Scan: Stage {level} / {maxLevels}
          </div>
          <div className="mb-6 w-[440px] mx-auto">
            <div className="flex justify-between text-[10px] font-mono text-[#88888E] uppercase tracking-widest mb-1">
              <span>Tempo</span>
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
          
          <div 
            className="grid gap-2 theme-card p-4 mx-auto" 
            style={{ 
              gridTemplateColumns: `repeat(${Math.floor(Math.sqrt(grid.length))}, 1fr)`,
              width: '440px',
              height: '440px'
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
          <p className="mt-8 text-[#88888E] text-[10px] uppercase tracking-[3px] font-mono">Select the chromatic anomaly</p>
        </div>
      )}
    </div>
  );
};
