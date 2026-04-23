import React, { useState, useCallback, useMemo } from 'react';
import { Landing } from './components/Landing';
import { Results } from './components/Results';
import { Profile } from './components/Profile';
import { GameResult } from './types';
import { GAMES } from './constants';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/AuthModal';

// Giochi
import { ReactionTime } from './components/games/ReactionTime';
import { AimPrecision } from './components/games/AimPrecision';
import { VisualMemory } from './components/games/VisualMemory';
import { TypingSpeed } from './components/games/TypingSpeed';
import { MathSprint } from './components/games/MathSprint';
import { PatternScan } from './components/games/PatternScan';
import { ColorPerception } from './components/games/ColorPerception';

type View = 'landing' | 'game' | 'results' | 'profile';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { user, profile, signOut } = useAuth();

  const filteredGames = useMemo(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return isMobile ? GAMES.filter(g => g.id !== 'typing') : GAMES;
  }, []);

  const handleStart = () => {
    setActiveGameIdx(0);
    setResults([]);
    setView('game');
  };

  const handleGameComplete = useCallback((score: number, raw: number) => {
    const game = filteredGames[activeGameIdx];
    const newResult: GameResult = { id: game.id, score, raw, label: game.unit };
    setResults(prev => [...prev, newResult]);
    if (activeGameIdx < filteredGames.length - 1) {
      setActiveGameIdx(prev => prev + 1);
    } else {
      setView('results');
    }
  }, [activeGameIdx, filteredGames]);

  const handleSignOut = async () => {
    await signOut();
    setView('landing');
  };

  const activeGame = filteredGames[activeGameIdx];

  const renderGame = () => {
    switch (activeGame.id) {
      case 'reaction': return <ReactionTime onComplete={handleGameComplete} />;
      case 'aim': return <AimPrecision onComplete={handleGameComplete} />;
      case 'memory': return <VisualMemory onComplete={handleGameComplete} />;
      case 'typing': return <TypingSpeed onComplete={handleGameComplete} />;
      case 'math': return <MathSprint onComplete={handleGameComplete} />;
      case 'pattern': return <PatternScan onComplete={handleGameComplete} />;
      case 'color': return <ColorPerception onComplete={handleGameComplete} />;
      default: return null;
    }
  };

  const AuthButton = () => {
    if (user && profile) {
      return (
        <button
          onClick={() => setView('profile')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url as string}
              alt={profile.username}
              className="w-8 h-8 rounded-full border border-[#333]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#00F5FF]/20 border border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF] text-xs font-bold">
              {profile.username[0].toUpperCase()}
            </div>
          )}
          <span className="text-[12px] font-mono text-[#88888E]">{profile.username}</span>
        </button>
      );
    }
    return (
      <button
        onClick={() => setAuthModalOpen(true)}
        className="text-[12px] font-mono uppercase tracking-widest text-[#88888E] hover:text-white transition-colors px-4 py-2 border border-[#333] hover:border-[#555] rounded-full"
      >
        Accedi
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header HUD durante i giochi */}
      <AnimatePresence>
        {view === 'game' && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="w-full h-20 border-b border-[#222] flex items-center justify-between px-10 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50 overflow-hidden"
          >
            <div className="text-2xl font-extrabold tracking-tighter uppercase">SKILL<span className="text-[#00F5FF]">CHECK</span></div>
            <div className="flex gap-2 h-1 bg-[#222] flex-1 max-w-md mx-12 rounded-full overflow-hidden">
              {filteredGames.map((_, i) => (
                <div
                  key={i}
                  className={`h-full transition-all duration-700 ${
                    i < activeGameIdx ? 'bg-[#00F5FF] w-full' :
                    i === activeGameIdx ? 'bg-[#00F5FF]/40 w-full' :
                    'bg-transparent w-full'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono text-[10px] text-[#88888E] uppercase tracking-[2px]">
                Stage {activeGameIdx + 1} / {filteredGames.length}
              </div>
              <AuthButton />
              {import.meta.env.DEV && (
                <button
                  onClick={() => handleGameComplete(500, 0)}
                  className="font-mono text-[10px] uppercase tracking-[2px] px-3 py-1 border border-dashed border-[#FF4E00]/50 text-[#FF4E00]/70 rounded hover:border-[#FF4E00] hover:text-[#FF4E00] transition-all"
                >
                  DEV SKIP →
                </button>
              )}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Auth floating su landing/risultati/profilo */}
      {view !== 'game' && (
        <div className="fixed top-6 right-8 z-40">
          <AuthButton />
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <Landing onStart={handleStart} />
            </motion.div>
          )}

          {view === 'game' && (
            <motion.div
              key={`game-${activeGame.id}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full h-full flex flex-col items-center justify-center py-12"
            >
              <div className="game-container min-h-[600px] w-full max-w-5xl">
                {renderGame()}
              </div>
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <Results results={results} onRetry={handleStart} />
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <Profile
                onHome={() => setView('landing')}
                onSignOut={handleSignOut}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sfondo */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#050505]">
        <div className="absolute top-[10%] left-[-10%] w-[60%] h-[60%] bg-[#00F5FF]/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-[#FF4E00]/[0.02] rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-[0.05]" />
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
