import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'intro' | 'ready' | 'go' | 'result' | 'early';

const INITIAL_MS = 45_000;
const HIT_BONUS_MS = 2_500;
const FALSE_START_MS = 2_000;
const R0 = 60;

export const ReactionTime: React.FC<GameProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [hits, setHits] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [timerSec, setTimerSec] = useState(45);
  const [lastRt, setLastRt] = useState<number | null>(null);

  const timeLeftRef = useRef(INITIAL_MS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitRef = useRef<NodeJS.Timeout | null>(null);
  const rtStartRef = useRef(0);
  const speedSumRef = useRef(0);
  const falseStartsRef = useRef(0);
  const allRtsRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (waitRef.current) clearTimeout(waitRef.current);
    const raw = Math.max(0.01, speedSumRef.current - 3 * falseStartsRef.current);
    const score = Math.round(500 * Math.log2(raw / R0 + 1));
    const sorted = [...allRtsRef.current].sort((a, b) => a - b);
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 999;
    onComplete(score, Math.round(median));
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      timeLeftRef.current -= 100;
      setTimerSec(Math.max(0, Math.ceil(timeLeftRef.current / 1000)));
      if (timeLeftRef.current <= 0) finish();
    }, 100);
  };

  const startRound = () => {
    setPhase('ready');
    const delay = 1500 + Math.random() * 3000;
    waitRef.current = setTimeout(() => {
      setPhase('go');
      rtStartRef.current = performance.now();
    }, delay);
  };

  const handleClick = () => {
    if (phase === 'intro') {
      startTimer();
      startRound();
    } else if (phase === 'ready') {
      clearTimeout(waitRef.current!);
      timeLeftRef.current = Math.max(0, timeLeftRef.current - FALSE_START_MS);
      falseStartsRef.current += 1;
      setFalseStarts(f => f + 1);
      setPhase('early');
    } else if (phase === 'go') {
      const rt = performance.now() - rtStartRef.current;
      allRtsRef.current.push(rt);
      speedSumRef.current += 1000 / rt;
      setHits(h => h + 1);
      setLastRt(rt);
      timeLeftRef.current = Math.min(INITIAL_MS, timeLeftRef.current + HIT_BONUS_MS);
      setPhase('result');
      waitRef.current = setTimeout(() => startRound(), 700);
    } else if (phase === 'result' || phase === 'early') {
      clearTimeout(waitRef.current!);
      startRound();
    }
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (waitRef.current) clearTimeout(waitRef.current);
  }, []);

  return (
    <div
      className={`w-full h-full min-h-[500px] flex flex-col items-center justify-center cursor-pointer select-none relative ${
        phase === 'go' ? 'bg-[#00F5FF]' :
        phase === 'ready' ? 'bg-[#FF4E00]' :
        'bg-[#0F0F11]'
      }`}
      onClick={handleClick}
    >
      {phase !== 'intro' && (
        <div className="absolute top-6 inset-x-0 flex justify-center gap-12 pointer-events-none">
          <span className={`font-mono text-sm ${timerSec <= 5 ? 'text-[#FF4E00]' : 'text-white/50'}`}>
            {timerSec}s
          </span>
          <span className="font-mono text-sm text-white/50">{hits} hits</span>
          {falseStarts > 0 && (
            <span className="font-mono text-sm text-[#FF4E00]/60">{falseStarts} false start</span>
          )}
        </div>
      )}

      {phase === 'go' ? (
        <h2 className="text-8xl font-black text-[#050505]">ENGAGE!</h2>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            {phase === 'intro' && (
              <div>
                <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">REACTION TIME</h2>
                <p className="text-xl text-[#88888E] font-light">Click the instant the screen turns cyan.</p>
                <p className="text-sm text-[#88888E]/50 mt-2">45s timer · each hit +2.5s · false start −2s</p>
                <p className="mt-12 text-[#00F5FF] font-mono text-sm tracking-[4px] uppercase animate-pulse">Click to Start</p>
              </div>
            )}
            {phase === 'ready' && (
              <h2 className="text-7xl font-black text-black">STAND BY...</h2>
            )}
            {phase === 'early' && (
              <div className="text-white">
                <h2 className="text-7xl font-black italic">ABORTED.</h2>
                <p className="text-2xl mt-4 font-mono opacity-60">False start — −2s</p>
              </div>
            )}
            {phase === 'result' && lastRt !== null && (
              <div className="text-white">
                <h2 className="text-8xl font-mono font-black italic">
                  {lastRt.toFixed(0)}<span className="text-3xl not-italic ml-2 opacity-50">ms</span>
                </h2>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
