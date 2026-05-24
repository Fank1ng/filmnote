-- FilmNote security + recommendation feedback upgrade
-- Run this in Supabase SQL Editor after reviewing existing policies.

ALTER TABLE blocked_movies ADD COLUMN IF NOT EXISTS reason TEXT;
CREATE INDEX IF NOT EXISTS idx_blocked_movies_user_tmdb
  ON blocked_movies (user_id, tmdb_id);

CREATE TABLE IF NOT EXISTS watchlist_movies (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'movie',
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  year INTEGER,
  poster_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE watchlist_movies ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'movie';
ALTER TABLE watchlist_movies DROP CONSTRAINT IF EXISTS watchlist_movies_user_id_tmdb_id_key;
DROP INDEX IF EXISTS watchlist_movies_user_id_tmdb_id_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'watchlist_movies_media_type_check'
      AND conrelid = 'watchlist_movies'::regclass
  ) THEN
    ALTER TABLE watchlist_movies
      ADD CONSTRAINT watchlist_movies_media_type_check CHECK (media_type IN ('movie', 'series'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS watchlist_movies_unique_media_idx
  ON watchlist_movies (user_id, media_type, tmdb_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_movies_user
  ON watchlist_movies (user_id, created_at DESC);

ALTER TABLE watchlist_movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own watchlist" ON watchlist_movies;
CREATE POLICY "Users can read own watchlist"
  ON watchlist_movies FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own watchlist" ON watchlist_movies;
CREATE POLICY "Users can insert own watchlist"
  ON watchlist_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own watchlist" ON watchlist_movies;
CREATE POLICY "Users can delete own watchlist"
  ON watchlist_movies FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users can read entries" ON entries;
CREATE POLICY "Signed-in users can read entries"
  ON entries FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can insert own entries" ON entries;
CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own entries" ON entries;
CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own entries" ON entries;
CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE season_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users can read season ratings" ON season_ratings;
CREATE POLICY "Signed-in users can read season ratings"
  ON season_ratings FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can insert own season ratings" ON season_ratings;
CREATE POLICY "Users can insert own season ratings"
  ON season_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own season ratings" ON season_ratings;
CREATE POLICY "Users can update own season ratings"
  ON season_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own season ratings" ON season_ratings;
CREATE POLICY "Users can delete own season ratings"
  ON season_ratings FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users can read profiles" ON user_preferences;
CREATE POLICY "Signed-in users can read profiles"
  ON user_preferences FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can insert own profile" ON user_preferences;
CREATE POLICY "Users can insert own profile"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON user_preferences;
CREATE POLICY "Users can update own profile"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
