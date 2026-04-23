# Dashboard + Auth + Leaderboard Design
**Date:** 2026-04-22

## Overview

Redesign the Results page to include a world leaderboard, add Supabase Auth (Google + Email/Password), and allow users to save and compare scores globally.

---

## 1. Architecture

**Backend:** Supabase (project: `vqvsahjsqakyljuuobjl`)
- Auth: Supabase Auth (Google OAuth + Email/Password)
- Database: PostgreSQL via Supabase
- Client: `@supabase/supabase-js`

**Frontend additions:**
- `src/lib/supabase.ts` — Supabase client singleton
- `src/components/AuthModal.tsx` — login/signup overlay
- `src/components/Leaderboard.tsx` — leaderboard tabs component
- `src/components/Results.tsx` — full redesign
- `src/hooks/useAuth.ts` — auth state hook

---

## 2. Supabase Schema

```sql
-- profiles: one per user, created on signup
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- game_scores: one row per completed run
create table game_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  username text not null,
  total_score int not null,
  reaction int,
  aim int,
  memory int,
  typing int,
  math int,
  pattern int,
  color int,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table game_scores enable row level security;

-- profiles: readable by all, writable by owner
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- scores: readable by all, insertable by owner
create policy "scores_read" on game_scores for select using (true);
create policy "scores_insert" on game_scores for insert with check (auth.uid() = user_id);
```

---

## 3. Auth Flow

**Unauthenticated user:**
1. Plays all games → Results page shown normally
2. Sees leaderboard (read-only, their score NOT saved yet)
3. Presses "Salva Score" → AuthModal opens
4. After login/signup → score saved automatically → leaderboard updates

**Authenticated user:**
1. Header shows avatar + username (top right, always)
2. After playing → Results shown → score saved automatically
3. Leaderboard shows their position highlighted

**AuthModal tabs:**
- Google OAuth (one click)
- Email + Password (sign in / sign up toggle)
- After first signup: prompt for username (required, unique)

---

## 4. Results Page (Redesign)

**Layout: 3-row vertical**

**Row 1 — Hero**
- Left: total score (huge number) + rank badge (ELITE/PRO/STRONG/AVERAGE/NOVICE) + "TOP X% GLOBAL"
- Center: Radar chart (skill profile)
- Right: Skill bars per game with raw value

**Row 2 — Leaderboard**
- 3 tabs: `GLOBAL` | `PER GAME` | `MY SCORES`
- GLOBAL: rank # | username | total score | date — top 50, current user highlighted in cyan
- PER GAME: dropdown to select game, shows top 50 for that game
- MY SCORES: user's past runs (requires auth), sorted by date

**Row 3 — Footer**
- "Salva Score" button (→ AuthModal if not logged in, saves directly if logged in)
- "Gioca di Nuovo" button
- Share link: `skillcheck.io/vs/<random>`

---

## 5. Header Auth Button

In `App.tsx` header (during game and always on landing):
- Not logged in: "Sign In" button (ghost style)
- Logged in: avatar circle + username, click → dropdown with "Sign Out"

---

## 6. Env Variables

```
VITE_SUPABASE_URL=https://vqvsahjsqakyljuuobjl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxYem_ovNY3ZaO8jZdds4w_Z_xfmxt-
```

Stored in `.env.local` (gitignored).

---

## 7. Rank Thresholds

| Score | Rank |
|-------|------|
| > 900 | ELITE |
| > 750 | PRO |
| > 550 | STRONG |
| > 350 | AVERAGE |
| ≤ 350 | NOVICE |

Percentile ("TOP X%") calculated from real scores in `game_scores` table. Falls back to seed distribution if < 10 scores exist.

---

## 8. Out of Scope

- Social features (follow, compare with friends)
- Email verification flow
- Password reset
- Profile editing page
- Pagination beyond top 50
