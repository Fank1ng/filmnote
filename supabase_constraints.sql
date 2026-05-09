-- FilmNote: Database constraints for data integrity
-- Run in Supabase SQL Editor (https://app.supabase.com)

-- 1. Prevent duplicate ratings: same user can't rate same movie/series twice (when tmdb_id exists)
-- PostgreSQL treats NULLs as distinct, so manual entries (tmdb_id IS NULL) are not affected
ALTER TABLE entries ADD CONSTRAINT unique_user_tmdb_type UNIQUE (user_id, tmdb_id, type);

-- 2. For entries without tmdb_id, prevent duplicate (title + year + type) per user
CREATE UNIQUE INDEX unique_user_title_year_type ON entries (user_id, title, year, type) WHERE tmdb_id IS NULL;

-- 3. Prevent duplicate season numbers within the same entry
ALTER TABLE season_ratings ADD CONSTRAINT unique_entry_user_season UNIQUE (entry_id, user_id, season_number);

-- 4. Blocked movies (user-specific don't-recommend list)
CREATE TABLE IF NOT EXISTS blocked_movies (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id)
);
CREATE INDEX IF NOT EXISTS idx_blocked_movies_user ON blocked_movies (user_id);

ALTER TABLE blocked_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own blocked movies"
  ON blocked_movies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blocked movies"
  ON blocked_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own blocked movies"
  ON blocked_movies FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Store TMDB overview in entries for instant detail display
ALTER TABLE entries ADD COLUMN IF NOT EXISTS overview TEXT;

-- 6. Unique display_name to prevent duplicate usernames
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE user_preferences ADD CONSTRAINT unique_display_name UNIQUE (display_name);
