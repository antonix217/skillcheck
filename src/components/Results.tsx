import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GameResult } from '../types';
import { GAMES } from '../constants';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';
import { insertScore, fetchScorePercentile } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { Leaderboard } from './Leaderboard';

interface ResultsProps {
  results: GameResult[];
  onRetry: () => void;
  singleGame?: boolean;
}

const getRank = (score: number) => {
  if (score > 900) return { title: 'ELITE', color: 'text-cyan-400' };
  if (score > 750) return { title: 'PRO', color: 'text-emerald-400' };
  if (score > 550) return { title: 'STRONG', color: 'text-yellow-400' };
  if (score > 350) return { title: 'AVERAGE', color: 'text-white/60' };
  return { title: 'NOVICE', color: 'text-rose-400' };
};

export const Results: React.FC<ResultsProps> = ({ results, onRetry, singleGame }) => {
  const { user, profile } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [percentile, setPercentile] = useState<number | null>(null);
  const savedRef = useRef(false);

  const totalScore = useMemo(() =>
    Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length),
    [results]
  );

  const rank = getRank(totalScore);

  const chartData = useMemo(() =>
    results.map(r => ({
      subject: GAMES.find(g => g.id === r.id)?.title ?? r.id,
      A: r.score,
      fullMark: 1000,
    })),
    [results]
  );

  const scoreMap = useMemo(() => {
    const m: Record<string, number> = { total: totalScore };
    results.forEach(r => { m[r.id] = r.score; });
    return m;
  }, [results, totalScore]);

  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00F5FF', '#e4e3e0', '#22d3ee'] });
  }, []);

  useEffect(() => {
    fetchScorePercentile(totalScore).then(p => setPercentile(100 - p));
  }, [totalScore]);

  const saveScore = async () => {
    if (!user || !profile || savedRef.current) return;
    savedRef.current = true;
    try {
      await insertScore(user.id, profile.username, scoreMap);
      setScoreSaved(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Errore sconosciuto.';
      setSaveError(msg);
      savedRef.current = false;
    }
  };

  useEffect(() => {
    if (user && profile && !scoreSaved && !savedRef.current) {
      saveScore();
    }
  }, [user, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveScore = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      saveScore();
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
  };

  const percentileDisplay = percentile !== null
    ? `TOP ${percentile.toFixed(1)}%`
    : `TOP ~${(100 - totalScore / 10).toFixed(1)}%`;

  const shareCode = useMemo(() => Math.random().toString(36).substring(7), []);

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-6 space-y-8">

      {/* Riga 1: Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-card flex flex-col justify-center"
        >
          <div className="percentile-tag mb-6">{percentileDisplay} GLOBAL</div>
          <div className="text-[110px] font-extrabold leading-[0.8] tracking-[-0.04em] mb-4">
            {totalScore}
          </div>
          <div className={`text-2xl font-bold mb-4 ${rank.color}`}>{rank.title}</div>
          <div className="text-[#88888E] text-[15px] leading-relaxed font-light">
            {rank.title === 'ELITE' && 'Prestazioni eccezionali. Sei nel top assoluto.'}
            {rank.title === 'PRO' && 'Performance elevate. Riflessi rapidi e precisione ottima.'}
            {rank.title === 'STRONG' && 'Buone performance. Superiore alla media.'}
            {rank.title === 'AVERAGE' && 'Nella media. Con pratica puoi migliorare.'}
            {rank.title === 'NOVICE' && 'Hai appena iniziato. Continua ad allenarti!'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="theme-card flex items-center justify-center min-h-[400px]"
        >
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#222" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#88888E', fontSize: 10, fontWeight: 500 }} />
              <PolarRadiusAxis domain={[0, 1000]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="#00F5FF" fill="#00F5FF" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="theme-card"
        >
          <div className="space-y-6">
            {results.map((r) => (
              <div key={r.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] font-mono uppercase tracking-[1px] text-[#88888E]">
                    {GAMES.find(g => g.id === r.id)?.title}
                  </span>
                  <span className="font-display italic text-[16px]">
                    {r.raw.toFixed(0)}{r.label}
                  </span>
                </div>
                <div className="skill-bar-bg">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.score / 10}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="skill-bar-fill"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Riga 2: Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Leaderboard currentUserId={user?.id} />
      </motion.div>

      {/* Riga 3: Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap gap-4 items-center justify-center"
      >
        {!scoreSaved && (
          <button onClick={handleSaveScore} className="btn-primary">
            Salva Score
          </button>
        )}
        {scoreSaved && (
          <div className="percentile-tag">Score salvato ✓</div>
        )}
        {saveError && (
          <div className="text-rose-400 text-xs font-mono">{saveError}</div>
        )}
        <button onClick={onRetry} className="btn-secondary">{singleGame ? 'Torna alla Home' : 'Gioca di Nuovo'}</button>
        <div className="text-[#88888E] font-mono text-xs border-b border-dashed border-[#444] pb-1 cursor-pointer hover:text-white transition-colors">
          skillcheck.io/vs/{shareCode}
        </div>
      </motion.div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
