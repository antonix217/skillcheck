import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const WORDS = [
  'the','be','to','of','and','a','in','that','have','it','for','on','are','with','as',
  'at','this','but','from','or','an','will','one','all','would','there','their','what',
  'so','if','about','which','when','make','can','like','time','just','know','take',
  'into','year','your','good','some','could','them','see','other','than','then','now',
  'look','only','come','over','think','also','back','after','use','two','how','our',
  'work','first','well','way','even','new','want','because','any','these','give','most',
];

const shuffle = () => [...WORDS].sort(() => Math.random() - 0.5);

export const TypingSpeed: React.FC<GameProps> = ({ onComplete }) => {
  const [words] = useState<string[]>(shuffle);
  const [wordIdx, setWordIdx] = useState(0);
  const [input, setInput] = useState('');
  const [completed, setCompleted] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(0);
  const errorsRef = useRef(0);

  const finish = (done: number, errs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const wpm = done * 4; // words in 15s → WPM
    const accuracy = done > 0 ? done / (done + errs) : 0;
    const score = Math.max(0, Math.min(1000, (wpm - 10) * 11)) * accuracy;
    onComplete(Math.round(score), done);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!started && val.length > 0) {
      setStarted(true);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finish(completedRef.current, errorsRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (val.endsWith(' ')) {
      const typed = val.trim();
      if (typed === words[wordIdx]) {
        completedRef.current += 1;
        setCompleted(c => c + 1);
      } else {
        errorsRef.current += 1;
        setErrors(er => er + 1);
      }
      setWordIdx(i => i + 1);
      setInput('');
    } else {
      setInput(val);
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const currentWord = words[wordIdx] ?? '';
  const isWrong = input.length > 0 && !currentWord.startsWith(input);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-10">
      <div className="flex justify-between w-full font-mono text-xs tracking-widest text-[#00F5FF]">
        <span>{timeLeft}s</span>
        <span>{completed} words</span>
      </div>

      <div className="w-full text-center">
        <p className="text-sm font-mono text-[#88888E] mb-6 tracking-widest uppercase">next</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={wordIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.12 }}
            className="text-6xl font-black font-mono tracking-tight"
          >
            {currentWord.split('').map((char, i) => {
              let cls = 'text-white/30';
              if (i < input.length) cls = input[i] === char ? 'text-[#00F5FF]' : 'text-[#FF4E00]';
              return <span key={i} className={cls}>{char}</span>;
            })}
          </motion.p>
        </AnimatePresence>
      </div>

      <input
        ref={inputRef}
        autoFocus
        value={input}
        onChange={handleInput}
        disabled={timeLeft === 0}
        className={`w-full bg-white/5 border rounded-xl py-5 text-center text-2xl font-mono outline-none transition-all ${
          isWrong ? 'border-[#FF4E00]/60 text-[#FF4E00]' : 'border-white/10 focus:border-[#00F5FF]/50'
        }`}
        placeholder="type + space"
      />
    </div>
  );
};
