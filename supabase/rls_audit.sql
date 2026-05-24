select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasrules
from pg_tables
where schemaname = 'public'
  and tablename in (
    'entries',
    'season_ratings',
    'watchlist_movies',
    'blocked_movies',
    'couples',
    'couple_watch_queue',
    'invite_codes',
    'user_preferences'
  )
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'entries',
    'season_ratings',
    'watchlist_movies',
    'blocked_movies',
    'couples',
    'couple_watch_queue',
    'invite_codes',
    'user_preferences'
  )
order by tablename, policyname;
