import React, { useState, useEffect, useRef } from 'react';
import { GameProps } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

const SESSION_S = 15;
const TIER_ADVANCE = 12; // correct words per tier
const R0 = 20;  // avg ~8 words T1 in 15s → weightedWpm*acc² ≈ 20

const WORDS_T1 = [
  'the','be','to','of','and','a','in','that','have','it','for','on','are','with','as',
  'at','this','but','from','or','an','will','one','all','would','there','their','what',
  'so','if','about','which','when','make','can','like','time','just','know','take',
  'into','year','your','good','some','could','them','see','other','than','then','now',
  'look','only','come','over','think','also','back','after','use','two','how','our',
  'work','first','well','way','even','new','want','any','these','give','most','may',
];

const WORDS_T2 = [
  'quickly','system','problem','result','school','through','between','another','always',
  'before','little','should','around','person','sample','figure','second','whether',
  'general','nothing','provide','service','without','because','certain','already',
  'process','program','include','subject','present','against','morning','example',
  'company','feeling','country','believe','picture','perhaps','history','address',
  'usually','quality','parents','receive','outside','forward','private','surface',
];

const WORDS_T3 = [
  'algorithm','benchmark','cognitive','description','evaluation','fundamental',
  'government','hypothesis','implement','knowledge','laboratory','mechanism',
  'navigation','objective','parameter','resolution','structure','technology',
  'understand','validation','wavelength','expression','framework','hierarchy',
  'interface','javascript','optimization','performance','systematic','technique',
  'precision','acceleration','perspective','calibration','observation','simulation',
];

const TIER_WEIGHTS = [1.0, 1.4, 1.8];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function wordPool(tier: number): string[] {
  if (tier >= 2) return shuffle(WORDS_T3);
  if (tier >= 1) return shuffle(WORDS_T2);
  return shuffle(WORDS_T1);
}

export const TypingSpeed: React.FC<GameProps> = ({ onComplete }) => {
  const [wordQueue, setWordQueue] = useState<string[]>(() => wordPool(0));
  const [wordIdx, setWordIdx] = useState(0);
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSION_S);
  const [started, setStarted] = useState(false);
  const [currentTier, setCurrentTier] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const correctRef = useRef(0);
  const errorsRef = useRef(0);
  const weightedSumRef = useRef(0); // Σ tier_weight per correct word
  const finishedRef = useRef(false);

  const finish = (done: number, errs: number, elapsed: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const totalAttempts = done + errs;
    const accuracy = totalAttempts > 0 ? done / totalAttempts : 0;
    const minutes = elapsed / 60;
    const weightedWpm = minutes > 0 ? weightedSumRef.current / minutes : 0;
    const raw = Math.max(0.01, weightedWpm * accuracy * accuracy);
    const score = Math.round(500 * Math.log2(raw / R0 + 1));
    const wpm = minutes > 0 ? Math.round(done / minutes) : 0;
    onComplete(score, wpm);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!started && val.length > 0) {
      setStarted(true);
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setTimeLeft(prev => {
          if (prev <= 1) {
            finish(correctRef.current, errorsRef.current, SESSION_S);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (val.endsWith(' ')) {
      const typed = val.trim();
      const currentWord = wordQueue[wordIdx] ?? '';
      const tier = Math.min(2, Math.floor(correctRef.current / TIER_ADVANCE));
      if (typed === currentWord) {
        correctRef.current += 1;
        weightedSumRef.current += TIER_WEIGHTS[tier];
        const newCorrect = correctRef.current;
        setCorrect(newCorrect);
        // Advance tier + refresh word pool if needed
        const newTier = Math.min(2, Math.floor(newCorrect / TIER_ADVANCE));
        if (newTier !== tier) {
          setCurrentTier(newTier);
          setWordQueue(wordPool(newTier));
          setWordIdx(0);
        } else {
          const nextIdx = wordIdx + 1;
          if (nextIdx >= wordQueue.length) {
            setWordQueue(wordPool(newTier));
            setWordIdx(0);
          } else {
            setWordIdx(nextIdx);
          }
        }
      } else {
        errorsRef.current += 1;
        setErrors(er => er + 1);
        setWordIdx(i => {
          const next = i + 1;
          if (next >= wordQueue.length) {
            setWordQueue(wordPool(tier));
            return 0;
          }
          return next;
        });
      }
      setInput('');
    } else {
      setInput(val);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const currentWord = wordQueue[wordIdx] ?? '';
  const isWrong = input.length > 0 && !currentWord.startsWith(input);
  const tierLabel = ['BASIC', 'MEDIUM', 'ADVANCED'][currentTier];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-8">
      <div className="flex justify-between w-full font-mono text-xs tracking-widest">
        <span className={timeLeft <= 10 ? 'text-[#FF4E00]' : 'text-[#00F5FF]'}>{timeLeft}s</span>
        <span className="text-[#88888E]">{tierLabel}</span>
        <span className="text-[#00F5FF]">{correct} words</span>
      </div>

      <div className="w-full text-center">
        <p className="text-sm font-mono text-[#88888E] mb-4 tracking-widest uppercase">type + space</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={`${wordIdx}-${currentTier}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.1 }}
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
        placeholder="start typing..."
      />
    </div>
  );
};
