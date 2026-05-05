-- FilmNote: Database constraints for data integrity
-- Run in Supabase SQL Editor (https://app.supabase.com)

-- 1. Prevent duplicate ratings: same user can't rate same movie/series twice (when tmdb_id exists)
-- PostgreSQL treats NULLs as distinct, so manual entries (tmdb_id IS NULL) are not affected
ALTER TABLE entries ADD CONSTRAINT unique_user_tmdb_type UNIQUE (user_id, tmdb_id, type);

-- 2. For entries without tmdb_id, prevent duplicate (title + year + type) per user
CREATE UNIQUE INDEX unique_user_title_year_type ON entries (user_id, title, year, type) WHERE tmdb_id IS NULL;

-- 3. Prevent duplicate season numbers within the same entry
ALTER TABLE season_ratings ADD CONSTRAINT unique_entry_user_season UNIQUE (entry_id, user_id, season_number);
