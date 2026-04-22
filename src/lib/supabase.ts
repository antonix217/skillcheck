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
  if (error) return 50;
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
