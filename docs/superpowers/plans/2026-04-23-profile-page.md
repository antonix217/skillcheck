# Piano di Implementazione: Pagina Profilo

> **Per agenti autonomi:** SUB-SKILL OBBLIGATORIA: Usa superpowers:subagent-driven-development (consigliato) o superpowers:executing-plans per implementare questo piano task per task. I passi usano la sintassi checkbox (`- [ ]`) per il tracciamento.

**Obiettivo:** Aggiungere una pagina profilo con avatar, username, data iscrizione e storico partite; spostare il logout lì e rimuoverlo dall'header.

**Architettura:** Aggiunge `'profile'` al tipo `View` in App.tsx. Click su avatar/username → `setView('profile')`. Niente router. Nuovo componente `Profile.tsx` autonomo.

**Tech Stack:** React 19, TypeScript, Tailwind v4, motion/react, Supabase JS v2, lucide-react

---

## Mappa dei File

| Azione | File | Responsabilità |
|--------|------|----------------|
| Crea | `src/components/Profile.tsx` | Pagina profilo: hero + storico + footer logout/home |
| Modifica | `src/App.tsx` | Aggiunge view `'profile'`, aggiorna AuthButton (rimuove "Esci", rende avatar cliccabile), renderizza Profile |

---

## Task 1: Crea src/components/Profile.tsx

**File:**
- Crea: `src/components/Profile.tsx`

- [ ] **Step 1: Crea il file**

```typescript
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
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '4-digit' });

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
            {/* Header */}
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
```

- [ ] **Step 2: Esegui lint**

```bash
cd /Users/antoniocaselli/Desktop/skillcheck
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 3: Commit**

```bash
cd /Users/antoniocaselli/Desktop/skillcheck
git add src/components/Profile.tsx
git commit -m "feat: add Profile page component"
```

---

## Task 2: Aggiorna App.tsx

**File:**
- Modifica: `src/App.tsx`

Modifiche da apportare:
1. Aggiunge `'profile'` al tipo `View`
2. `AuthButton` loggato: rimuove pulsante "Esci", rende l'area avatar+username cliccabile → `setView('profile')`
3. Aggiunge render di `<Profile>` nell'`AnimatePresence`
4. Importa `Profile`

- [ ] **Step 1: Sovrascrivi src/App.tsx**

```typescript
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
```

- [ ] **Step 2: Esegui lint**

```bash
cd /Users/antoniocaselli/Desktop/skillcheck
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 3: Commit**

```bash
cd /Users/antoniocaselli/Desktop/skillcheck
git add src/App.tsx
git commit -m "feat: add profile view and make auth button navigate to profile"
```

---

## Task 3: Verifica build

- [ ] **Step 1: Build di produzione**

```bash
cd /Users/antoniocaselli/Desktop/skillcheck
npm run build
```

Atteso: `✓ built in X.XXs` senza errori TypeScript.

---

## Copertura Spec

| Requisito | Task |
|---|---|
| Hero card: avatar, username, data iscrizione | Task 1 |
| Storico partite (max 20, scroll) | Task 1 |
| Stato vuoto e loading | Task 1 |
| Pulsante "Esci" nella pagina profilo | Task 1 |
| Pulsante "Home" | Task 1 |
| Click avatar → setView('profile') | Task 2 |
| Rimosso "Esci" dall'AuthButton header | Task 2 |
| View 'profile' nell'AnimatePresence | Task 2 |
| signOut + redirect landing | Task 2 |
