import React from 'react';
import { motion } from 'motion/react';
import { Zap, Target, Brain, Keyboard, Calculator, Search, Palette, ChevronRight, ChevronDown } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { useAuth } from '../hooks/useAuth';

interface LandingProps {
  onStart: () => void;
  onStartGame: (gameId: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onStartGame }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F5FF]/20 bg-[#00F5FF]/5 text-[#00F5FF] text-[10px] font-mono mb-8 uppercase tracking-[3px]">
            <Zap size={10} className="animate-pulse" /> Global Benchmarking
          </div>
          <h1 className="text-8xl md:text-9xl font-black mb-8 tracking-[-0.04em] leading-[0.85] uppercase">
            SKILL<span className="text-[#00F5FF]">CHECK</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#88888E] mb-14 max-w-2xl mx-auto leading-relaxed font-light">
            Measure your response speed, accuracy, and neural span in a 5-minute intensive assessment.
          </p>

          <button
            onClick={onStart}
            className="btn-primary group relative"
          >
            Begin Analysis
            <ChevronRight size={18} className="inline-ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mt-24">
          {[
            { icon: Zap, label: 'Reaction', id: 'reaction' },
            { icon: Target, label: 'Aim', id: 'aim' },
            { icon: Brain, label: 'Memory', id: 'memory' },
            { icon: Keyboard, label: 'Typing', id: 'typing' },
            { icon: Calculator, label: 'Math', id: 'math' },
            { icon: Search, label: 'Pattern', id: 'pattern' },
            { icon: Palette, label: 'Color', id: 'color' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onStartGame(item.id)}
              className="flex flex-col items-center gap-3 opacity-30 hover:opacity-100 transition-opacity group"
            >
              <div className="w-10 h-10 rounded-full border border-white/10 group-hover:border-[#00F5FF]/40 group-hover:bg-[#00F5FF]/5 flex items-center justify-center transition-colors">
                <item.icon size={16} />
              </div>
              <span className="text-[9px] font-mono uppercase tracking-[2px]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-[#88888E]"
        >
          <span className="text-[9px] font-mono uppercase tracking-[3px]">Classifica</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </motion.div>
      </div>

      {/* Leaderboard section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, margin: '-100px' }}
        className="w-full max-w-2xl mx-auto px-4 pb-24"
      >
        <div className="text-center mb-8">
          <p className="text-[10px] font-mono uppercase tracking-[4px] text-[#88888E]">Classifica Mondiale</p>
        </div>
        <Leaderboard currentUserId={user?.id} defaultTab="global" />
      </motion.div>
    </div>
  );
};
