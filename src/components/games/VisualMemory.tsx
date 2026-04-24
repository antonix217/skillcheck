import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameProps } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const R0 = 33;

function gridSize(level: number): number {
  if (level >= 16) return 5;
  if (level >= 8) return 4;
  return 3;
}

function cellShowMs(level: number): number {
  return Math.max(200, 700 - level * 30);
}

function speedFactor(L: number): number {
  return 1 + Math.max(0, L - 5) * 0.12;
}

export const VisualMemory: React.FC<GameProps> = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [clickedTile, setClickedTile] = useState<number | null>(null);
  const [status, setStatus] = useState<'intro' | 'watching' | 'playing' | 'wrong'>('intro');

  const completedLengthsRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  const doFinish = useCallback((currentLevel: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const raw = completedLengthsRef.current.reduce((acc, L) => acc + L * speedFactor(L), 0);
    const safeRaw = Math.max(0.01, raw);
    const score = Math.round(500 * Math.log2(safeRaw / R0 + 1));
    setTimeout(() => onComplete(score, currentLevel), 1500);
  }, [onComplete]);

  const startLevel = useCallback((lvl: number) => {
    const gs = gridSize(lvl);
    const seqLen = lvl + 2;
    const newSeq: number[] = Array.from({ length: seqLen }, () =>
      Math.floor(Math.random() * gs * gs)
    );
    setSequence(newSeq);
    setUserSequence([]);
    setStatus('watching');
    setIsPlaying(true);

    const showMs = cellShowMs(lvl);
    const interval = showMs + 100;

    newSeq.forEach((tileIdx, i) => {
      setTimeout(() => {
        setActiveTile(tileIdx);
        setTimeout(() => setActiveTile(null), showMs);
        if (i === newSeq.length - 1) {
          setTimeout(() => {
            setStatus('playing');
            setIsPlaying(false);
          }, showMs + 150);
        }
      }, (i + 1) * interval);
    });
  }, []);

  const handleTileClick = (idx: number) => {
    if (status !== 'playing' || isPlaying) return;

    setClickedTile(idx);
    setTimeout(() => setClickedTile(null), 200);

    const newUserSeq = [...userSequence, idx];
    setUserSequence(newUserSeq);

    if (idx !== sequence[newUserSeq.length - 1]) {
      setStatus('wrong');
      doFinish(level);
      return;
    }

    if (newUserSeq.length === sequence.length) {
      completedLengthsRef.current.push(sequence.length);
      setStatus('watching');
      setTimeout(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        startLevel(nextLevel);
      }, 800);
    }
  };

  const gs = gridSize(level);
  const tileCount = gs * gs;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {status === 'intro' ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">VISUAL MEMORY</h2>
          <p className="text-xl opacity-60 mb-2">Repeat the sequence as the grid tiles light up.</p>
          <p className="text-sm opacity-40 mb-8">Grid expands and speed increases at higher levels</p>
          <button onClick={() => startLevel(1)} className="btn-primary">Start</button>
        </div>
      ) : (
        <div className="text-center">
          <h3 className="text-2xl font-mono text-[#00F5FF] mb-6 font-black uppercase tracking-widest">
            Stage {level} · {gs}×{gs}
          </h3>

          <div
            className="grid gap-2 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gs}, 1fr)`,
              width: '320px',
              height: '320px',
            }}
          >
            {Array.from({ length: tileCount }).map((_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTileClick(i)}
                className={cn(
                  'w-full h-full rounded-xl transition-all duration-200',
                  activeTile === i || clickedTile === i
                    ? 'bg-[#00F5FF] shadow-[0_0_30px_rgba(0,245,255,0.6)] border-transparent'
                    : 'bg-[#0F0F11] border border-[#1A1A1E] hover:border-white/20',
                  status === 'wrong' && 'bg-[#FF4E00]/20 border-[#FF4E00]'
                )}
              />
            ))}
          </div>

          <div className="mt-8 flex gap-2 justify-center">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i < userSequence.length ? 'bg-[#00F5FF]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <p className="mt-4 text-[#88888E] uppercase tracking-[4px] text-xs font-mono font-bold animate-pulse">
            {status === 'watching' ? 'Memorize sequence...' : status === 'playing' ? 'Repeat the pattern' : 'SEQUENCE ERROR'}
          </p>
        </div>
      )}
    </div>
  );
};
