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
