import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LogOut, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchMyScores } from '../lib/supabase';
import type { GameScore } from '../types';

interface ProfileProps {
  onHome: () => void;
  onSignOut: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const Profile: React.FC<ProfileProps> = ({ onHome, onSignOut }) => {
  const { user, profile } = useAuth();
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyScores(user.id)
      .then(data => setScores(data.slice(0, 20)))
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || !profile) return null;

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="w-full max-w-2xl mx-auto py-16 px-6 space-y-6">

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="theme-card flex items-center gap-6"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile.username}
            className="w-20 h-20 rounded-full border-2 border-[#00F5FF]/30 flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#00F5FF]/20 border-2 border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF] text-3xl font-bold flex-shrink-0">
            {profile.username[0].toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-2xl font-bold tracking-tight">{profile.username}</div>
          <div className="text-[#88888E] text-sm font-mono mt-1">
            Membro dal {formatDate(profile.created_at)}
          </div>
        </div>
      </motion.div>

      {/* Storico partite */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="theme-card"
      >
        <h3 className="font-mono text-[11px] uppercase tracking-[3px] text-[#88888E] mb-5">
          I Miei Score
        </h3>

        {loading ? (
          <div className="text-center text-[#88888E] text-sm py-8 font-mono">Caricamento...</div>
        ) : scores.length === 0 ? (
          <div className="text-center text-[#88888E] text-sm py-8 font-mono">
            Nessuna partita ancora.
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            <div className="flex items-center gap-4 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#88888E]">
              <span className="w-5 text-right">#</span>
              <span className="flex-1">Data</span>
              <span className="w-20 text-right">Score</span>
            </div>
            {scores.map((row, idx) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <span className="w-5 text-right font-mono text-[11px] text-[#88888E]">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm text-[#88888E] font-mono">
                  {formatDate(row.created_at)}
                </span>
                <span className="w-20 text-right font-mono text-sm font-bold text-white">
                  {row.total_score.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 justify-center"
      >
        <button onClick={onHome} className="btn-secondary flex items-center gap-2">
          <Home size={16} />
          Home
        </button>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-8 py-4 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 hover:text-rose-300 font-semibold rounded-full uppercase tracking-widest transition-all text-sm"
        >
          <LogOut size={16} />
          Esci
        </button>
      </motion.div>

    </div>
  );
};
