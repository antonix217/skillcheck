import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

type State = 'waiting' | 'ready' | 'clicking' | 'result' | 'early';

export const ReactionTime: React.FC<GameProps> = ({ onComplete }) => {
  const [state, setState] = useState<State>('waiting');
  const [results, setResults] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRound = () => {
    setState('ready');
    const delay = Math.random() * 3500 + 1500;
    timeoutRef.current = setTimeout(() => {
      setState('clicking');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      startRound();
    } else if (state === 'ready') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setState('early');
    } else if (state === 'clicking') {
      const reactionTime = performance.now() - startTimeRef.current;
      const newResults = [...results, reactionTime];
      setResults(newResults);
      setState('result');
      if (newResults.length >= 5) {
        const median = newResults.sort((a,b) => a - b)[2];
        const normalized = Math.round(Math.max(0, Math.min(1000, 1000 - (median - 200) * 3)));
        setTimeout(() => onComplete(normalized, Math.round(median)), 1000);
      } else {
        autoAdvanceRef.current = setTimeout(() => startRound(), 3000);
      }
    } else if (state === 'result' || state === 'early') {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      startRound();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  return (
    <div 
      className={`w-full h-full flex flex-col items-center justify-center cursor-pointer select-none ${
        state === 'clicking' ? 'bg-[#00F5FF]' : 
        state === 'ready' ? 'bg-[#FF4E00]' : 
        'bg-[#0F0F11]'
      }`}
      onClick={handleClick}
    >
      {state === 'clicking' ? (
        <h2 className="text-8xl font-black text-[#050505]">ENGAGE!</h2>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            {state === 'waiting' && (
              <div>
                <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">REACTION TIME</h2>
                <p className="text-xl text-[#88888E] font-light">Wait for target color change, then react instantly.</p>
                <p className="mt-12 text-[#00F5FF] font-mono text-sm tracking-[4px] uppercase animate-pulse">Click to Start Analysis</p>
              </div>
            )}
            {state === 'ready' && (
              <h2 className="text-7xl font-black text-black">STAND BY...</h2>
            )}
            {state === 'early' && (
              <div className="text-white">
                <h2 className="text-7xl font-black italic">ABORTED.</h2>
                <p className="text-2xl mt-4 font-mono opacity-60">False start detected. Try again.</p>
              </div>
            )}
            {state === 'result' && (
              <div className="text-white">
                <h2 className="text-8xl font-mono font-black italic">
                  {results[results.length - 1].toFixed(0)}<span className="text-3xl not-italic ml-2 opacity-50">ms</span>
                </h2>
                <p className="text-sm mt-6 font-mono opacity-40 uppercase tracking-widest">
                  Round {results.length} / 5
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="absolute bottom-12 flex gap-4">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`w-12 h-1 transition-all duration-500 overflow-hidden bg-white/10`}
          >
             <div className={`h-full bg-[#00F5FF] transition-transform duration-500 ${results.length > i ? 'translate-x-0' : '-translate-x-full'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
