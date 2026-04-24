import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_MS = 15_000;
const HIT_BONUS_MS = 300;
const TIER_ADVANCE = 8;   // hits per tier
const BASE_RADIUS = 50;
const MIN_RADIUS = 10;
const R0 = 9;   // avg ~8 hits at 1.1 value each in 15s

function tierRadius(totalHits: number): number {
  const tier = Math.floor(totalHits / TIER_ADVANCE);
  return Math.max(MIN_RADIUS, BASE_RADIUS - tier * 5);
}

function targetValue(radius: number): number {
  return BASE_RADIUS / radius;
}

export const AimPrecision: React.FC<GameProps> = ({ onComplete }) => {
  const [targetsHit, setTargetsHit] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timerSec, setTimerSec] = useState(30);
  const [flash, setFlash] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<{ x: number; y: number; radius: number; id: number } | null>(null);
  const [started, setStarted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(INITIAL_MS);
  const hitsRef = useRef(0);
  const rawScoreRef = useRef(0);   // Σ targetValue(hits) - 0.3 * Σ targetValue(misses)
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const raw = Math.max(0.01, rawScoreRef.current);
    const score = Math.round(500 * Math.log2(raw / R0 + 1));
    onComplete(score, hitsRef.current);
  };

  const spawnTarget = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const radius = tierRadius(hitsRef.current);
    const margin = radius + 8;
    const x = margin + Math.random() * (rect.width - margin * 2);
    const y = margin + Math.random() * (rect.height - margin * 2);
    setCurrentTarget({ x, y, radius, id: Math.random() });
  };

  const handleHit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTarget) return;
    const val = targetValue(currentTarget.radius);
    rawScoreRef.current += val;
    hitsRef.current += 1;
    setTargetsHit(h => h + 1);
    timeLeftRef.current = Math.min(INITIAL_MS, timeLeftRef.current + HIT_BONUS_MS);
    spawnTarget();
  };

  const handleMiss = () => {
    if (!currentTarget) return;
    const val = targetValue(currentTarget.radius);
    rawScoreRef.current -= 0.3 * val;
    setMisses(m => m + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 250);
  };

  const handleStart = () => {
    setStarted(true);
    spawnTarget();
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 100;
      setTimerSec(Math.max(0, Math.ceil(timeLeftRef.current / 1000)));
      if (timeLeftRef.current <= 0) finish();
    }, 100);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const currentTier = Math.floor(hitsRef.current / TIER_ADVANCE) + 1;

  return (
    <div
      ref={containerRef}
      onClick={started ? handleMiss : undefined}
      className="w-full h-full min-h-[500px] theme-card relative overflow-hidden flex items-center justify-center"
    >
      {!started ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">AIM PRECISION</h2>
          <p className="text-xl opacity-60 mb-2">Hit targets before time runs out.</p>
          <p className="text-sm opacity-40 mb-8">Targets shrink as you hit more · each hit +0.3s</p>
          <button onClick={(e) => { e.stopPropagation(); handleStart(); }} className="btn-primary">Start</button>
        </div>
      ) : (
        <>
          {flash && (
            <div className="absolute inset-0 pointer-events-none z-10 border-4 border-[#FF4E00] shadow-[inset_0_0_60px_rgba(255,78,0,0.4)] rounded-inherit" />
          )}
          <div className="absolute top-4 left-4 font-mono text-sm flex gap-6 z-20">
            <span className={timerSec <= 5 ? 'text-[#FF4E00]' : 'text-[#00F5FF]'}>TIME: {timerSec}s</span>
            <span className="text-white/70">HIT: {targetsHit}</span>
            <span className="text-[#FF4E00]/70">MISS: {misses}</span>
            <span className="text-[#88888E] text-xs self-center">T{currentTier}</span>
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
                  left: currentTarget.x - currentTarget.radius,
                  top: currentTarget.y - currentTarget.radius,
                  width: currentTarget.radius * 2,
                  height: currentTarget.radius * 2,
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
