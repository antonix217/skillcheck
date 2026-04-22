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

type AuthTab = 'google' | 'email';
type EmailMode = 'signin' | 'signup';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, refreshProfile } = useAuth();
  const [tab, setTab] = useState<AuthTab>('google');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dopo l'auth, se l'utente non ha profilo → mostra step username
  const step = user && !profile ? 'username' : 'auth';

  React.useEffect(() => {
    if (user && profile && isOpen) {
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
