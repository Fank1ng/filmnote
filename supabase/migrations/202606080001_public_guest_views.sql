-- Public read-only views for guest browsing.
-- These expose only fields intended for anonymous visitors.

create or replace view public.public_entries
with (security_invoker = false)
as
select
  id,
  user_id,
  type,
  media_type,
  tmdb_id,
  title,
  year,
  director,
  poster_path,
  overview,
  ratings,
  score,
  total_score,
  comment,
  created_at,
  updated_at
from public.entries;

create or replace view public.public_season_ratings
with (security_invoker = false)
as
select
  id,
  entry_id,
  user_id,
  season_number,
  season_title,
  ratings,
  total_score,
  comment
from public.season_ratings;

create or replace view public.public_profiles
with (security_invoker = false)
as
select
  user_id,
  display_name
from public.user_preferences;

grant select on public.public_entries to anon, authenticated;
grant select on public.public_season_ratings to anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
