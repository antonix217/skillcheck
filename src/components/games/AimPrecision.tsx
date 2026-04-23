import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const TOTAL_TIME = 15;
const MISS_PENALTY = 20;

export const AimPrecision: React.FC<GameProps> = ({ onComplete }) => {
  const [targetsHit, setTargetsHit] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [flash, setFlash] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<{ x: number; y: number; size: number; id: number } | null>(null);
  const [start, setStart] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetsHitRef = useRef(0);
  const missesRef = useRef(0);
  const finishedRef = useRef(false);

  const finish = (hits: number, totalMisses: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const score = Math.max(0, Math.min(1000, hits * 40 - totalMisses * MISS_PENALTY));
    onComplete(score, hits);
  };

  const spawnTarget = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const margin = 60;
      const size = Math.random() * 30 + 30;
      const x = margin + Math.random() * (rect.width - margin * 2);
      const y = margin + Math.random() * (rect.height - margin * 2);
      setCurrentTarget({ x, y, size, id: Math.random() });
    }
  };

  const handleHit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = targetsHitRef.current + 1;
    targetsHitRef.current = next;
    setTargetsHit(next);
    spawnTarget();
  };

  const handleMiss = () => {
    const next = missesRef.current + 1;
    missesRef.current = next;
    setMisses(next);
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  const handleStart = () => {
    setStart(true);
    spawnTarget();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 1) {
          finish(targetsHitRef.current, missesRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={start ? handleMiss : undefined}
      className="w-full h-full min-h-[500px] theme-card relative overflow-hidden flex items-center justify-center"
    >
      {!start ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">AIM PRECISION</h2>
          <p className="text-xl opacity-60 mb-8">Hit as many targets as you can in {TOTAL_TIME}s — misses penalize score</p>
          <button onClick={(e) => { e.stopPropagation(); handleStart(); }} className="btn-primary">Start</button>
        </div>
      ) : (
        <>
          {flash && (
            <div className="absolute inset-0 pointer-events-none z-10 border-4 border-[#FF4E00] shadow-[inset_0_0_60px_rgba(255,78,0,0.4)] rounded-inherit transition-opacity" />
          )}
          <div className="absolute top-4 left-4 font-mono text-[#00F5FF] text-sm flex gap-6">
            <span>TIME: {timeLeft}s</span>
            <span>HIT: {targetsHit}</span>
            <span className="text-[#FF4E00]">MISS: {misses}</span>
          </div>
          <AnimatePresence>
            {currentTarget && (
              <motion.button
                key={currentTarget.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                onClick={handleHit}
                className="absolute rounded-full flex items-center justify-center cursor-crosshair bg-[#00F5FF] shadow-[0_0_20px_rgba(0,245,255,0.4)]"
                style={{
                  left: currentTarget.x - currentTarget.size / 2,
                  top: currentTarget.y - currentTarget.size / 2,
                  width: currentTarget.size,
                  height: currentTarget.size,
                }}
              >
                <div className="w-1/3 h-1/3 bg-white rounded-full opacity-50" />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};
