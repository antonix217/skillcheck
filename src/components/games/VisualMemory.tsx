import React, { useState, useEffect, useCallback } from 'react';
import { GameProps } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export const VisualMemory: React.FC<GameProps> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [clickedTile, setClickedTile] = useState<number | null>(null);
  const [status, setStatus] = useState<'intro' | 'watching' | 'playing' | 'wrong'>('intro');

  const startLevel = useCallback((lvl: number) => {
    const newSequence: number[] = [];
    for (let i = 0; i < lvl + 2; i++) {
      newSequence.push(Math.floor(Math.random() * 9));
    }
    setSequence(newSequence);
    setUserSequence([]);
    setStatus('watching');
    setIsPlaying(true);
    
    // Play sequence
    newSequence.forEach((tileIdx, i) => {
      setTimeout(() => {
        setActiveTile(tileIdx);
        setTimeout(() => setActiveTile(null), 400);
        if (i === newSequence.length - 1) {
          setTimeout(() => {
            setStatus('playing');
            setIsPlaying(false);
          }, 600);
        }
      }, (i + 1) * 800);
    });
  }, []);

  const handleTileClick = (idx: number) => {
    if (status !== 'playing' || isPlaying) return;

    setClickedTile(idx);
    setTimeout(() => setClickedTile(null), 200);

    const newUserSequence = [...userSequence, idx];
    setUserSequence(newUserSequence);

    if (idx !== sequence[newUserSequence.length - 1]) {
      setStatus('wrong');
      // Normalize: Level 10 -> 1000, Level 3 -> 0
      const score = Math.max(0, Math.min(1000, (level - 2) * 100));
      setTimeout(() => onComplete(score, level), 1500);
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setStatus('watching');
      setTimeout(() => {
        setLevel(prev => prev + 1);
        startLevel(level + 1);
      }, 1000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {status === 'intro' ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">VISUAL MEMORY</h2>
          <p className="text-xl opacity-60 mb-8">Repeat the sequence as the grid tiles light up</p>
          <button onClick={() => startLevel(1)} className="btn-primary">Start</button>
        </div>
      ) : (
        <div className="text-center">
          <h3 className="text-2xl font-mono text-[#00F5FF] mb-8 font-black uppercase tracking-widest leading-none">Stage {level}</h3>
          
          <div className="grid grid-cols-3 gap-6 w-[320px] h-[320px]">
            {[...Array(9)].map((_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTileClick(i)}
                className={cn(
                  "w-full h-full rounded-xl transition-all duration-300",
                  activeTile === i || clickedTile === i
                    ? "bg-[#00F5FF] shadow-[0_0_30px_rgba(0,245,255,0.6)] border-transparent"
                    : "bg-[#0F0F11] border border-[#1A1A1E] hover:border-white/20",
                  status === 'wrong' && "bg-[#FF4E00]/20 border-[#FF4E00]"
                )}
              />
            ))}
          </div>

          <div className="mt-10 flex gap-2 justify-center">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i < userSequence.length
                    ? 'bg-[#00F5FF]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <p className="mt-4 text-[#88888E] uppercase tracking-[4px] text-xs font-mono font-bold animate-pulse">
            {status === 'watching' ? 'Memorizing neural sequence...' : status === 'playing' ? 'Execute pattern recall' : 'STASIS ERROR'}
          </p>
        </div>
      )}
    </div>
  );
};
