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
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id)
);
ALTER TABLE blocked_movies ADD COLUMN IF NOT EXISTS reason TEXT;
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

-- 4b. Watchlist movies (user-specific want-to-watch list)
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

CREATE POLICY "Users can read own watchlist"
  ON watchlist_movies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON watchlist_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON watchlist_movies FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Store TMDB overview in entries for instant detail display
ALTER TABLE entries ADD COLUMN IF NOT EXISTS overview TEXT;

-- 6. Unique display_name to prevent duplicate usernames
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE user_preferences ADD CONSTRAINT unique_display_name UNIQUE (display_name);

-- 7. Baseline RLS policies for shared viewing + own writes
-- FilmNote intentionally allows signed-in users to see each other's entries for comparison.
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

-- 8. List mutual-exclusion and rating cleanup rules
-- Same behavior as supabase_list_rules_upgrade_2026_05.sql, kept here for full fresh installs.
CREATE OR REPLACE FUNCTION public.normalize_list_media_type(p_type TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_type IN ('series', 'tv') THEN 'series' ELSE 'movie' END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_watchlist_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.media_type := public.normalize_list_media_type(NEW.media_type);

  IF EXISTS (
    SELECT 1
    FROM public.entries e
    WHERE e.user_id = NEW.user_id
      AND public.normalize_list_media_type(e.type) = NEW.media_type
      AND e.tmdb_id = NEW.tmdb_id
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'list_rule_already_rated_watchlist';
  END IF;

  IF to_regclass('public.couples') IS NOT NULL
     AND to_regclass('public.couple_watch_queue') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.couples c
      JOIN public.couple_watch_queue q ON q.couple_id = c.id
      WHERE c.status = 'active'
        AND (c.user_a = NEW.user_id OR c.user_b = NEW.user_id)
        AND q.media_type = NEW.media_type
        AND q.tmdb_id = NEW.tmdb_id
    ) THEN
      RAISE EXCEPTION USING MESSAGE = 'list_rule_watchlist_queue_conflict';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS watchlist_movies_enforce_list_rules ON public.watchlist_movies;
CREATE TRIGGER watchlist_movies_enforce_list_rules
BEFORE INSERT OR UPDATE ON public.watchlist_movies
FOR EACH ROW EXECUTE FUNCTION public.enforce_watchlist_rules();

CREATE OR REPLACE FUNCTION public.enforce_couple_queue_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a UUID;
  v_user_b UUID;
BEGIN
  NEW.media_type := public.normalize_list_media_type(NEW.media_type);

  SELECT c.user_a, c.user_b
  INTO v_user_a, v_user_b
  FROM public.couples c
  WHERE c.id = NEW.couple_id
    AND c.status = 'active';

  IF v_user_a IS NULL OR v_user_b IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.entries e
    WHERE e.user_id IN (v_user_a, v_user_b)
      AND public.normalize_list_media_type(e.type) = NEW.media_type
      AND e.tmdb_id = NEW.tmdb_id
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'list_rule_already_rated_queue';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.watchlist_movies w
    WHERE w.user_id IN (v_user_a, v_user_b)
      AND w.media_type = NEW.media_type
      AND w.tmdb_id = NEW.tmdb_id
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'list_rule_watchlist_queue_conflict';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.couple_watch_queue') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS couple_watch_queue_enforce_list_rules ON public.couple_watch_queue';
    EXECUTE 'CREATE TRIGGER couple_watch_queue_enforce_list_rules BEFORE INSERT OR UPDATE ON public.couple_watch_queue FOR EACH ROW EXECUTE FUNCTION public.enforce_couple_queue_rules()';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cleanup_lists_after_entry_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_media_type TEXT;
BEGIN
  IF NEW.tmdb_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_media_type := public.normalize_list_media_type(NEW.type);

  DELETE FROM public.watchlist_movies w
  WHERE w.user_id = NEW.user_id
    AND w.media_type = v_media_type
    AND w.tmdb_id = NEW.tmdb_id;

  IF to_regclass('public.couples') IS NULL
     OR to_regclass('public.couple_watch_queue') IS NULL THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.couple_watch_queue q
  USING public.couples c
  WHERE q.couple_id = c.id
    AND c.status = 'active'
    AND (c.user_a = NEW.user_id OR c.user_b = NEW.user_id)
    AND q.media_type = v_media_type
    AND q.tmdb_id = NEW.tmdb_id
    AND EXISTS (
      SELECT 1
      FROM public.entries ea
      WHERE ea.user_id = c.user_a
        AND public.normalize_list_media_type(ea.type) = v_media_type
        AND ea.tmdb_id = NEW.tmdb_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.entries eb
      WHERE eb.user_id = c.user_b
        AND public.normalize_list_media_type(eb.type) = v_media_type
        AND eb.tmdb_id = NEW.tmdb_id
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entries_cleanup_lists_after_rating ON public.entries;
CREATE TRIGGER entries_cleanup_lists_after_rating
AFTER INSERT OR UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.cleanup_lists_after_entry_rating();
