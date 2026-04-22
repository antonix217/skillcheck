import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { fetchGlobalLeaderboard, fetchPerGameLeaderboard, fetchMyScores } from '../lib/supabase';
import type { GameScore } from '../types';
import { GAMES } from '../constants';

interface LeaderboardProps {
  currentUserId?: string;
}

type Tab = 'global' | 'per-game' | 'my-scores';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId }) => {
  const [tab, setTab] = useState<Tab>('global');
  const [rows, setRows] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('reaction');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'global') {
        setRows(await fetchGlobalLeaderboard());
      } else if (tab === 'per-game') {
        setRows(await fetchPerGameLeaderboard(selectedGame));
      } else if (tab === 'my-scores' && currentUserId) {
        setRows(await fetchMyScores(currentUserId));
      }
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, [tab, selectedGame, currentUserId]);

  useEffect(() => { load(); }, [load]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'global', label: 'GLOBALE' },
    { id: 'per-game', label: 'PER GIOCO' },
    { id: 'my-scores', label: 'I MIEI SCORE' },
  ];

  const getGameScore = (row: GameScore) => {
    const val = row[selectedGame as keyof GameScore];
    return typeof val === 'number' ? val : null;
  };

  return (
    <div className="theme-card">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={18} className="text-[#00F5FF]" />
        <h3 className="font-mono text-[11px] uppercase tracking-[3px] text-[#88888E]">Leaderboard</h3>
      </div>

      <div className="flex gap-1 mb-6 bg-[#0a0a0c] rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            disabled={t.id === 'my-scores' && !currentUserId}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              tab === t.id ? 'bg-[#1A1A1E] text-white' : 'text-[#88888E] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'per-game' && (
        <select
          value={selectedGame}
          onChange={e => setSelectedGame(e.target.value)}
          className="w-full mb-4 bg-[#0a0a0c] border border-[#222] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#00F5FF]/50"
        >
          {GAMES.map(g => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
      )}

      {loading ? (
        <div className="text-center text-[#88888E] text-sm py-8 font-mono">Caricamento...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-[#88888E] text-sm py-8 font-mono">
          {tab === 'my-scores' ? 'Nessun score salvato.' : 'Nessun dato disponibile.'}
        </div>
      ) : (
        <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
          {rows.map((row, idx) => {
            const isMe = row.user_id === currentUserId;
            const displayScore = tab === 'per-game' ? (getGameScore(row) ?? 0) : row.total_score;
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isMe ? 'bg-[#00F5FF]/10 border border-[#00F5FF]/20' : 'hover:bg-white/[0.02]'
                }`}
              >
                <span className={`w-6 text-right font-mono text-[11px] ${idx < 3 ? 'text-[#00F5FF]' : 'text-[#88888E]'}`}>
                  {idx + 1}
                </span>
                <span className={`flex-1 font-semibold text-[13px] truncate ${isMe ? 'text-[#00F5FF]' : 'text-white'}`}>
                  {row.username} {isMe && '(tu)'}
                </span>
                <span className="font-mono text-[13px] font-bold">
                  {displayScore.toLocaleString()}
                </span>
                <span className="text-[#88888E] text-[10px] font-mono w-14 text-right">
                  {formatDate(row.created_at)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
