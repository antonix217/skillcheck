import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'intro' | 'ready' | 'go' | 'result' | 'early';

const ROUNDS = 4;
// R0 = 4.0 → average speed at 250ms (1000/250 = 4.0) × 4 rounds / 4 = 4.0
const R0 = 4.0;

export const ReactionTime: React.FC<GameProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundsDone, setRoundsDone] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [lastRt, setLastRt] = useState<number | null>(null);

  const waitRef = useRef<NodeJS.Timeout | null>(null);
  const advanceRef = useRef<NodeJS.Timeout | null>(null);
  const rtStartRef = useRef(0);
  const speedSumRef = useRef(0);
  const falseStartsRef = useRef(0);
  const allRtsRef = useRef<number[]>([]);
  const roundsDoneRef = useRef(0);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimeout(waitRef.current!);
    clearTimeout(advanceRef.current!);
    // average speed per round, minus false-start penalty
    const avgSpeed = speedSumRef.current / ROUNDS;
    const raw = Math.max(0.01, avgSpeed - falseStartsRef.current * 0.3);
    const score = Math.round(500 * Math.log2(raw / R0 + 1));
    const sorted = [...allRtsRef.current].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 999;
    onComplete(score, Math.round(median));
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
      startRound();
    } else if (phase === 'ready') {
      clearTimeout(waitRef.current!);
      falseStartsRef.current += 1;
      setFalseStarts(f => f + 1);
      setPhase('early');
    } else if (phase === 'go') {
      const rt = performance.now() - rtStartRef.current;
      allRtsRef.current.push(rt);
      speedSumRef.current += 1000 / rt;
      roundsDoneRef.current += 1;
      setRoundsDone(r => r + 1);
      setLastRt(rt);
      if (roundsDoneRef.current >= ROUNDS) {
        setPhase('result');
        advanceRef.current = setTimeout(() => finish(), 1000);
      } else {
        setPhase('result');
        advanceRef.current = setTimeout(() => startRound(), 800);
      }
    } else if (phase === 'result' || phase === 'early') {
      clearTimeout(advanceRef.current!);
      if (roundsDoneRef.current >= ROUNDS) {
        finish();
      } else {
        startRound();
      }
    }
  };

  useEffect(() => () => {
    clearTimeout(waitRef.current!);
    clearTimeout(advanceRef.current!);
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
      {phase === 'go' ? (
        <h2 className="text-8xl font-black text-[#050505]">ENGAGE!</h2>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={phase + roundsDone}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            {phase === 'intro' && (
              <div>
                <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">REACTION TIME</h2>
                <p className="text-xl text-[#88888E] font-light">Click the instant the screen turns cyan.</p>
                <p className="text-sm text-[#88888E]/50 mt-2">{ROUNDS} rounds · false start penalizes score</p>
                <p className="mt-12 text-[#00F5FF] font-mono text-sm tracking-[4px] uppercase animate-pulse">Click to Start</p>
              </div>
            )}
            {phase === 'ready' && (
              <h2 className="text-7xl font-black text-black">STAND BY...</h2>
            )}
            {phase === 'early' && (
              <div className="text-white">
                <h2 className="text-7xl font-black italic">ABORTED.</h2>
                <p className="text-2xl mt-4 font-mono opacity-60">False start — score penalized</p>
              </div>
            )}
            {phase === 'result' && lastRt !== null && (
              <div className="text-white">
                <h2 className="text-8xl font-mono font-black italic">
                  {lastRt.toFixed(0)}<span className="text-3xl not-italic ml-2 opacity-50">ms</span>
                </h2>
                <p className="text-sm mt-6 font-mono opacity-40 uppercase tracking-widest">
                  Round {roundsDone} / {ROUNDS}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="absolute bottom-12 flex gap-4">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <div key={i} className="w-12 h-1 overflow-hidden bg-white/10">
            <div className={`h-full bg-[#00F5FF] transition-transform duration-500 ${roundsDone > i ? 'translate-x-0' : '-translate-x-full'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
