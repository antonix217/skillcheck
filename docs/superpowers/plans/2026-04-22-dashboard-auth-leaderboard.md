# Piano di Implementazione: Dashboard + Auth + Leaderboard

> **Per agenti autonomi:** SUB-SKILL OBBLIGATORIA: Usa superpowers:subagent-driven-development (consigliato) o superpowers:executing-plans per implementare questo piano task per task. I passi usano la sintassi checkbox (`- [ ]`) per il tracciamento.

**Obiettivo:** Aggiungere Supabase Auth (Google + email/password), una leaderboard globale e una pagina Risultati ridisegnata che salva i punteggi e mostra il rank.

**Architettura:** Supabase gestisce l'autenticazione e il DB PostgreSQL. Un client singleton in `src/lib/supabase.ts` è usato ovunque. Lo stato auth vive nell'hook `useAuth`. La pagina Risultati acquisisce una sezione leaderboard e il flusso di salvataggio punteggio.

**Tech Stack:** React 19, TypeScript, Supabase JS v2, Tailwind v4, motion/react, recharts, lucide-react

---

## Mappa dei File

| Azione | File | Responsabilità |
|--------|------|----------------|
| Crea | `src/lib/supabase.ts` | Client Supabase singleton + helper DB tipizzati |
| Crea | `src/hooks/useAuth.ts` | Stato auth: user, session, azioni signIn/Out |
| Crea | `src/components/AuthModal.tsx` | Overlay login/signup (Google + email/password + prompt username) |
| Crea | `src/components/Leaderboard.tsx` | Leaderboard a 3 tab: Global / Per Game / My Scores |
| Modifica | `src/types.ts` | Aggiunge i tipi `SupabaseProfile`, `GameScore` |
| Modifica | `src/components/Results.tsx` | Redesign completo + salvataggio punteggio + integrazione leaderboard |
| Modifica | `src/App.tsx` | Pulsante auth nell'header (sempre visibile durante i giochi) |
| Crea | `.env.local` | VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |

---

## Task 1: Installa Supabase e configura l'ambiente

**File:**
- Modifica: `package.json` (via npm install)
- Crea: `.env.local`

- [ ] **Step 1: Installa `@supabase/supabase-js`**

```bash
cd /Users/antoniocaselli/Desktop/skillcheck
npm install @supabase/supabase-js
```

Atteso: pacchetto aggiunto, nessun errore.

- [ ] **Step 2: Crea `.env.local`**

Crea il file `/Users/antoniocaselli/Desktop/skillcheck/.env.local` con:

```
VITE_SUPABASE_URL=https://vqvsahjsqakyljuuobjl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxYem_ovNY3ZaO8jZdds4w_Z_xfmxt-
```

- [ ] **Step 3: Verifica che TypeScript compili**

```bash
cd /Users/antoniocaselli/Desktop/skillcheck
npm run lint
```

Atteso: 0 errori (nessun nuovo file ancora, verifica baseline).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @supabase/supabase-js"
```

---

## Task 2: Estendi i tipi e crea il client Supabase

**File:**
- Modifica: `src/types.ts`
- Crea: `src/lib/supabase.ts`

- [ ] **Step 1: Aggiorna `src/types.ts`**

Sostituisci l'intero file con:

```typescript
export type GameId =
  | 'reaction'
  | 'aim'
  | 'memory'
  | 'typing'
  | 'math'
  | 'pattern'
  | 'color';

export interface GameResult {
  id: GameId;
  score: number; // Normalizzato 0-1000
  raw: number;   // Metrica grezza (ms, wpm, ecc.)
  label: string;
}

export interface UserProfile {
  name: string;
  results: GameResult[];
  lastUpdated: number;
}

export interface GameProps {
  onComplete: (score: number, raw: number) => void;
}

// Tipi delle righe DB Supabase
export interface SupabaseProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface GameScore {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  reaction: number | null;
  aim: number | null;
  memory: number | null;
  typing: number | null;
  math: number | null;
  pattern: number | null;
  color: number | null;
  created_at: string;
}
```

- [ ] **Step 2: Crea `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { GameScore, SupabaseProfile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Recupera i top 50 punteggi globali
export async function fetchGlobalLeaderboard(): Promise<GameScore[]> {
  const { data, error } = await supabase
    .from('game_scores')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// Recupera i top 50 punteggi per un gioco specifico
export async function fetchPerGameLeaderboard(gameId: string): Promise<GameScore[]> {
  const { data, error } = await supabase
    .from('game_scores')
    .select('*')
    .not(gameId, 'is', null)
    .order(gameId, { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// Recupera i punteggi dell'utente corrente, ordinati per data
export async function fetchMyScores(userId: string): Promise<GameScore[]> {
  const { data, error } = await supabase
    .from('game_scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Conta quanti punteggi sono sotto questo totale (per il percentile)
export async function fetchScorePercentile(totalScore: number): Promise<number> {
  const { count, error } = await supabase
    .from('game_scores')
    .select('*', { count: 'exact', head: true })
    .lt('total_score', totalScore);
  if (error) return 50; // fallback
  const { count: total } = await supabase
    .from('game_scores')
    .select('*', { count: 'exact', head: true });
  if (!total || total < 10) return Math.max(5, 100 - Math.round(totalScore / 10));
  return Math.round(((count ?? 0) / total) * 100);
}

// Inserisce una nuova riga punteggio
export async function insertScore(
  userId: string,
  username: string,
  scores: Record<string, number>
): Promise<void> {
  const { error } = await supabase.from('game_scores').insert({
    user_id: userId,
    username,
    total_score: scores.total,
    reaction: scores.reaction ?? null,
    aim: scores.aim ?? null,
    memory: scores.memory ?? null,
    typing: scores.typing ?? null,
    math: scores.math ?? null,
    pattern: scores.pattern ?? null,
    color: scores.color ?? null,
  });
  if (error) throw error;
}

// Crea o aggiorna il profilo di un utente
export async function upsertProfile(
  userId: string,
  username: string,
  avatarUrl?: string
): Promise<SupabaseProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, username, avatar_url: avatarUrl ?? null }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Controlla se lo username è già preso
export async function isUsernameTaken(username: string): Promise<boolean> {
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('username', username);
  return (count ?? 0) > 0;
}

// Recupera il profilo tramite user id
export async function fetchProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data ?? null;
}
```

- [ ] **Step 3: Esegui lint**

```bash
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/lib/supabase.ts
git commit -m "feat: add Supabase client and DB helpers"
```

---

## Task 3: Hook useAuth

**File:**
- Crea: `src/hooks/useAuth.ts`

- [ ] **Step 1: Crea `src/hooks/useAuth.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, fetchProfile } from '../lib/supabase';
import type { SupabaseProfile } from '../types';

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: SupabaseProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const p = await fetchProfile(uid);
    setProfile(p);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfile(sess.user.id);
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  return { user, session, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshProfile };
}
```

- [ ] **Step 2: Esegui lint**

```bash
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook with Google + email/password support"
```

---

## Task 4: Componente AuthModal

**File:**
- Crea: `src/components/AuthModal.tsx`

- [ ] **Step 1: Crea `src/components/AuthModal.tsx`**

```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { upsertProfile, isUsernameTaken } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'auth' | 'username';
type AuthTab = 'google' | 'email';
type EmailMode = 'signin' | 'signup';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('auth');
  const [tab, setTab] = useState<AuthTab>('google');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dopo l'auth, se l'utente non ha profilo → mostra step username
  React.useEffect(() => {
    if (user && !profile && isOpen) {
      setStep('username');
    } else if (user && profile && isOpen) {
      onSuccess?.();
      onClose();
    }
  }, [user, profile, isOpen, onClose, onSuccess]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    let err: string | null;
    if (emailMode === 'signin') {
      err = await signInWithEmail(email, password);
    } else {
      err = await signUpWithEmail(email, password);
    }
    setLoading(false);
    if (err) setError(err);
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Lo username deve avere almeno 3 caratteri.');
      setLoading(false);
      return;
    }
    const taken = await isUsernameTaken(trimmed);
    if (taken) {
      setError('Username già in uso.');
      setLoading(false);
      return;
    }
    try {
      await upsertProfile(user.id, trimmed, user.user_metadata?.avatar_url);
      await refreshProfile();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore nel salvare lo username.');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="theme-card w-full max-w-md relative"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-[#88888E] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {step === 'auth' && (
              <>
                <h2 className="text-xl font-bold mb-2">Accedi per salvare il tuo score</h2>
                <p className="text-[#88888E] text-sm mb-8">Crea un account gratuito per comparire nella leaderboard globale.</p>

                {/* Tab */}
                <div className="flex gap-2 mb-6">
                  {(['google', 'email'] as AuthTab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest rounded-lg transition-all ${
                        tab === t ? 'bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30' : 'text-[#88888E] hover:text-white border border-transparent'
                      }`}
                    >
                      {t === 'google' ? 'Google' : 'Email'}
                    </button>
                  ))}
                </div>

                {tab === 'google' && (
                  <button
                    onClick={signInWithGoogle}
                    className="w-full btn-primary flex items-center justify-center gap-3"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#050505"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#050505"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#050505"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#050505"/>
                    </svg>
                    Continua con Google
                  </button>
                )}

                {tab === 'email' && (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      {(['signin', 'signup'] as EmailMode[]).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEmailMode(m)}
                          className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-widest rounded transition-all ${
                            emailMode === m ? 'text-white' : 'text-[#88888E]'
                          }`}
                        >
                          {m === 'signin' ? 'Accedi' : 'Registrati'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#88888E] focus:outline-none focus:border-[#00F5FF]/50"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#88888E] focus:outline-none focus:border-[#00F5FF]/50"
                    />
                    {error && <p className="text-rose-400 text-xs">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full btn-primary">
                      {loading ? 'Caricamento...' : emailMode === 'signin' ? 'Accedi' : 'Crea Account'}
                    </button>
                  </form>
                )}
              </>
            )}

            {step === 'username' && (
              <>
                <h2 className="text-xl font-bold mb-2">Scegli il tuo username</h2>
                <p className="text-[#88888E] text-sm mb-8">Sarà visibile nella leaderboard globale.</p>
                <form onSubmit={handleUsernameSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Username (min 3 caratteri)"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={24}
                    className="w-full bg-[#0a0a0c] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#88888E] focus:outline-none focus:border-[#00F5FF]/50"
                  />
                  {error && <p className="text-rose-400 text-xs">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full btn-primary">
                    {loading ? 'Salvataggio...' : 'Conferma'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

- [ ] **Step 2: Esegui lint**

```bash
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthModal.tsx
git commit -m "feat: add AuthModal with Google + email/password + username step"
```

---

## Task 5: Componente Leaderboard

**File:**
- Crea: `src/components/Leaderboard.tsx`

- [ ] **Step 1: Crea `src/components/Leaderboard.tsx`**

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { fetchGlobalLeaderboard, fetchPerGameLeaderboard, fetchMyScores } from '../lib/supabase';
import type { GameScore } from '../types';
import { GAMES } from '../constants';

interface LeaderboardProps {
  currentUserId?: string;
  currentUserTotalScore?: number;
}

type Tab = 'global' | 'per-game' | 'my-scores';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId, currentUserTotalScore }) => {
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

      {/* Tab */}
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

      {/* Selettore per gioco */}
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

      {/* Tabella */}
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
```

- [ ] **Step 2: Esegui lint**

```bash
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 3: Commit**

```bash
git add src/components/Leaderboard.tsx
git commit -m "feat: add Leaderboard component with Global/Per-Game/My-Scores tabs"
```

---

## Task 6: Redesign Results.tsx

**File:**
- Modifica: `src/components/Results.tsx`

Il nuovo layout ha 3 righe: (1) statistiche hero + radar + barre abilità, (2) leaderboard, (3) azioni footer.

Logica di salvataggio: al mount, se l'utente è loggato → salva automaticamente. Se non lo è → "Salva Score" apre l'AuthModal → dopo auth → salva.

- [ ] **Step 1: Riscrivi `src/components/Results.tsx`**

```typescript
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
}

const getRank = (score: number) => {
  if (score > 900) return { title: 'ELITE', color: 'text-cyan-400' };
  if (score > 750) return { title: 'PRO', color: 'text-emerald-400' };
  if (score > 550) return { title: 'STRONG', color: 'text-yellow-400' };
  if (score > 350) return { title: 'AVERAGE', color: 'text-white/60' };
  return { title: 'NOVICE', color: 'text-rose-400' };
};

export const Results: React.FC<ResultsProps> = ({ results, onRetry }) => {
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

  // Confetti all'arrivo
  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00F5FF', '#e4e3e0', '#22d3ee'] });
  }, []);

  // Recupera il percentile
  useEffect(() => {
    fetchScorePercentile(totalScore).then(p => setPercentile(100 - p));
  }, [totalScore]);

  // Salvataggio automatico se loggato e con profilo
  const saveScore = async () => {
    if (!user || !profile || savedRef.current) return;
    savedRef.current = true;
    try {
      await insertScore(user.id, profile.username, scoreMap);
      setScoreSaved(true);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Errore nel salvare lo score.');
      savedRef.current = false;
    }
  };

  useEffect(() => {
    if (user && profile && !scoreSaved && !savedRef.current) {
      saveScore();
    }
  }, [user, profile]); // eslint-disable-line

  const handleSaveScore = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      saveScore();
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    // saveScore verrà attivato dall'useEffect sopra una volta impostato il profilo
  };

  const percentileDisplay = percentile !== null ? `TOP ${percentile.toFixed(1)}%` : `TOP ~${(100 - totalScore / 10).toFixed(1)}%`;

  const shareCode = Math.random().toString(36).substring(7);

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-6 space-y-8">

      {/* Riga 1: Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

        {/* Sinistra: riepilogo punteggio */}
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

        {/* Centro: Radar */}
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

        {/* Destra: barre abilità */}
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
        <Leaderboard
          currentUserId={user?.id}
          currentUserTotalScore={totalScore}
        />
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
        <button onClick={onRetry} className="btn-secondary">Gioca di Nuovo</button>
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
```

- [ ] **Step 2: Esegui lint**

```bash
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 3: Commit**

```bash
git add src/components/Results.tsx
git commit -m "feat: redesign Results page with leaderboard and save-score flow"
```

---

## Task 7: Pulsante auth nell'header di App.tsx

**File:**
- Modifica: `src/App.tsx`

Aggiunge: pulsante auth in alto a destra nell'header di gioco. Quando non si è in modalità gioco, mostra un'area auth floating in alto a destra.

- [ ] **Step 1: Riscrivi `src/App.tsx`**

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { Landing } from './components/Landing';
import { Results } from './components/Results';
import { GameId, GameResult } from './types';
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

type View = 'landing' | 'game' | 'results';

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={profile.username}
                className="w-8 h-8 rounded-full border border-[#333]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#00F5FF]/20 border border-[#00F5FF]/30 flex items-center justify-center text-[#00F5FF] text-xs font-bold">
                {profile.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-[12px] font-mono text-[#88888E]">{profile.username}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[10px] font-mono uppercase tracking-widest text-[#88888E] hover:text-white transition-colors px-2 py-1 border border-transparent hover:border-[#333] rounded"
          >
            Esci
          </button>
        </div>
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

      {/* Auth floating su landing/risultati */}
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
npm run lint
```

Atteso: 0 errori.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add auth header button to App with sign-in/out"
```

---

## Task 8: Smoke test

- [ ] **Step 1: Avvia il server di sviluppo**

```bash
npm run dev
```

Atteso: server avviato su http://localhost:3000 senza errori in console.

- [ ] **Step 2: Checklist manuale**

Apri http://localhost:3000 e verifica:
- [ ] Il pulsante "Accedi" appare in alto a destra sulla landing page
- [ ] Cliccando "Accedi" si apre l'AuthModal con i tab Google + Email
- [ ] Giocando tutti i giochi si naviga alla pagina Risultati
- [ ] La pagina Risultati mostra punteggio totale, radar chart, barre abilità
- [ ] La sezione Leaderboard si renderizza (può essere vuota se il DB non ha dati)
- [ ] Il pulsante "Salva Score" appare quando non si è loggati
- [ ] Cliccando "Salva Score" si apre l'AuthModal
- [ ] Dopo il login, lo score si salva automaticamente e appare il badge "Score salvato ✓"
- [ ] L'header da loggato mostra avatar + username + "Esci"
- [ ] "Gioca di Nuovo" resetta e torna alla landing

- [ ] **Step 3: Lint finale**

```bash
npm run lint
```

Atteso: 0 errori.

---

## Copertura della Spec

| Sezione Spec | Coperta da |
|---|---|
| Schema Supabase (profiles, game_scores, RLS) | **Passo manuale** — lo schema va applicato nel dashboard Supabase. SQL nella spec. |
| Auth: Google OAuth | Task 3, 4 |
| Auth: Email/Password | Task 3, 4 |
| Auth: prompt username al primo signup | Task 4 |
| Pulsante auth nell'header | Task 7 |
| Redesign Results (layout 3 righe) | Task 6 |
| Badge rank (ELITE/PRO/STRONG/AVERAGE/NOVICE) | Task 6 |
| "TOP X% GLOBAL" percentile | Task 2 (`fetchScorePercentile`) + Task 6 |
| Tab GLOBALE leaderboard | Task 5 |
| Tab PER GIOCO leaderboard | Task 5 |
| Tab I MIEI SCORE leaderboard | Task 5 |
| Utente corrente evidenziato in cyan | Task 5 |
| Salvataggio score dalla pagina Risultati | Task 6 |
| Auto-salvataggio se loggato | Task 6 |
| "Salva Score" → AuthModal se non loggato | Task 6 |
| Pulsante "Gioca di Nuovo" | Task 6 |
| Link condivisione `skillcheck.io/vs/<random>` | Task 6 |
| Variabili d'ambiente | Task 1 |
| Soglie rank | Task 6 (`getRank`) |

> **Nota:** Lo schema del database Supabase (SQL nella spec) va eseguito manualmente nell'editor SQL di Supabase prima che l'app possa leggere/scrivere dati.
