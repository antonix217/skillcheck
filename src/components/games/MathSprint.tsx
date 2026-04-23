import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface Problem {
  q: string;
  a: number;
}

export const MathSprint: React.FC<GameProps> = ({ onComplete }) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [start, setStart] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateProblem = () => {
    const type = Math.floor(Math.random() * 3);
    let q = '', a = 0;
    if (type === 0) { // Addition
      const n1 = Math.floor(Math.random() * 50) + 1;
      const n2 = Math.floor(Math.random() * 50) + 1;
      q = `${n1} + ${n2}`;
      a = n1 + n2;
    } else if (type === 1) { // Subtraction
      const n1 = Math.floor(Math.random() * 100) + 1;
      const n2 = Math.floor(Math.random() * n1) + 1;
      q = `${n1} - ${n2}`;
      a = n1 - n2;
    } else { // Multiplication
      const n1 = Math.floor(Math.random() * 12) + 1;
      const n2 = Math.floor(Math.random() * 12) + 1;
      q = `${n1} × ${n2}`;
      a = n1 * n2;
    }
    setProblem({ q, a });
    setAnswer('');
  };

  const handleStart = () => {
    setStart(true);
    generateProblem();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem) return;
    if (parseInt(answer) === problem.a) {
      setSolved(prev => prev + 1);
      generateProblem();
    } else {
      setWrong(prev => prev + 1);
      setAnswer('');
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && start) {
      const finalScore = solved - (wrong * 0.5);
      // Normalize: 30 pts -> 1000, 5 pts -> 0
      const score = Math.max(0, Math.min(1000, (finalScore - 5) * 40));
      onComplete(score, solved);
    }
  }, [timeLeft, start, solved, wrong]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {!start ? (
        <div className="text-center p-8">
          <h2 className="text-4xl font-bold mb-4 font-mono">MATH SPRINT</h2>
          <p className="text-xl opacity-60 mb-8">Solve as many problems as you can in 30 seconds</p>
          <button onClick={handleStart} className="btn-primary">Start</button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="flex justify-between mb-8 font-mono text-[#00F5FF]">
            <span>TIME: {timeLeft}s</span>
            <span>SOLVED: {solved}</span>
          </div>

          <form onSubmit={checkAnswer} className="relative theme-card p-12 text-center">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl py-6 text-center text-4xl font-mono outline-none focus:border-[#00F5FF]/50 transition-all"
              placeholder="?"
            />
          </form>
        </div>
      )}
    </div>
  );
};
