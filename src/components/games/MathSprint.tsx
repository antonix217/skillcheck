import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const SESSION_S = 15;
const TIER_ADVANCE = 5;
const R0 = 8;   // avg ~8 T1 correct in 15s

const TIER_WEIGHTS = [1.0, 1.6, 2.2, 3.0, 4.0];
const TIER_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5'];

interface Problem { q: string; a: number; tier: number }

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(tier: number): Problem {
  let q = '', a = 0;
  switch (tier) {
    case 0: { // single-digit +/-
      const n1 = rand(1, 9), n2 = rand(1, 9);
      const add = Math.random() > 0.5;
      q = add ? `${n1} + ${n2}` : `${Math.max(n1,n2)} − ${Math.min(n1,n2)}`;
      a = add ? n1 + n2 : Math.abs(n1 - n2);
      break;
    }
    case 1: { // two-digit + single
      const n1 = rand(10, 99), n2 = rand(1, 9);
      const add = Math.random() > 0.4;
      q = add ? `${n1} + ${n2}` : `${n1} − ${n2}`;
      a = add ? n1 + n2 : n1 - n2;
      break;
    }
    case 2: { // multiplication tables
      const n1 = rand(2, 12), n2 = rand(2, 12);
      q = `${n1} × ${n2}`;
      a = n1 * n2;
      break;
    }
    case 3: { // two-digit + two-digit
      const n1 = rand(10, 99), n2 = rand(10, 99);
      const add = Math.random() > 0.4;
      q = add ? `${n1} + ${n2}` : `${Math.max(n1,n2)} − ${Math.min(n1,n2)}`;
      a = add ? n1 + n2 : Math.abs(n1 - n2);
      break;
    }
    default: { // two-digit multiplication
      const n1 = rand(11, 19), n2 = rand(11, 19);
      q = `${n1} × ${n2}`;
      a = n1 * n2;
    }
  }
  return { q, a, tier };
}

export const MathSprint: React.FC<GameProps> = ({ onComplete }) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_S);
  const [currentTier, setCurrentTier] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const solvedRef = useRef(0);
  const rawRef = useRef(0); // Σ weight(correct) - 0.5 * Σ weight(wrong)
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const raw = Math.max(0.01, rawRef.current);
    const score = Math.round(500 * Math.log2(raw / R0 + 1));
    onComplete(score, solvedRef.current);
  };

  const nextProblem = (solvedCount: number) => {
    const tier = Math.min(4, Math.floor(solvedCount / TIER_ADVANCE));
    setCurrentTier(tier);
    setProblem(generateProblem(tier));
    setAnswer('');
  };

  const handleStart = () => {
    setStarted(true);
    nextProblem(0);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { finish(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || !answer) return;
    const tier = problem.tier;
    if (parseInt(answer) === problem.a) {
      rawRef.current += TIER_WEIGHTS[tier];
      solvedRef.current += 1;
      setSolved(s => s + 1);
      setFlash('correct');
      setTimeout(() => setFlash(null), 200);
      nextProblem(solvedRef.current);
    } else {
      rawRef.current -= 0.5 * TIER_WEIGHTS[tier];
      setWrong(w => w + 1);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 300);
      setAnswer('');
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {!started ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">MATH SPRINT</h2>
          <p className="text-xl opacity-60 mb-2">Solve as many math problems as you can in {SESSION_S}s</p>
          <p className="text-sm opacity-40 mb-8">Problems get harder as you progress</p>
          <button onClick={handleStart} className="btn-primary">Start</button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="flex justify-between mb-6 font-mono text-sm">
            <span className={timeLeft <= 10 ? 'text-[#FF4E00]' : 'text-[#00F5FF]'}>TIME: {timeLeft}s</span>
            <span className="text-[#88888E]">{TIER_LABELS[currentTier]}</span>
            <span className="text-white/70">SOLVED: {solved}</span>
          </div>

          <form onSubmit={checkAnswer} className={`relative theme-card p-12 text-center transition-all ${
            flash === 'correct' ? 'border-[#00F5FF]/60' : flash === 'wrong' ? 'border-[#FF4E00]/60' : ''
          }`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={problem?.q}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="text-7xl font-extrabold mb-8 font-mono tracking-tighter"
              >
                {problem?.q}
              </motion.div>
            </AnimatePresence>
            <input
              autoFocus
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`w-full bg-white/5 border rounded-xl py-6 text-center text-4xl font-mono outline-none transition-all ${
                flash === 'wrong' ? 'border-[#FF4E00]/60' : 'border-white/10 focus:border-[#00F5FF]/50'
              }`}
              placeholder="?"
            />
            <p className="mt-4 text-[#88888E]/40 font-mono text-xs">wrong: {wrong}</p>
          </form>
        </div>
      )}
    </div>
  );
};
