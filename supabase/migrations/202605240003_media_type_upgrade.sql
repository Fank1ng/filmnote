-- FilmNote media-type upgrade for watchlist + couple queue
-- Run once in Supabase SQL Editor. Safe to run more than once.

begin;

-- 想看清单：支持 movie / series，避免电影和剧集 TMDb ID 冲突。
alter table public.watchlist_movies
add column if not exists media_type text not null default 'movie';

alter table public.watchlist_movies
drop constraint if exists watchlist_movies_user_id_tmdb_id_key;

drop index if exists public.watchlist_movies_user_id_tmdb_id_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'watchlist_movies_media_type_check'
      and conrelid = 'public.watchlist_movies'::regclass
  ) then
    alter table public.watchlist_movies
      add constraint watchlist_movies_media_type_check
      check (media_type in ('movie', 'series'));
  end if;
end $$;

create unique index if not exists watchlist_movies_unique_media_idx
on public.watchlist_movies (user_id, media_type, tmdb_id);

-- Couple 下次看队列：支持 movie / series，避免电影和剧集 TMDb ID 冲突。
alter table public.couple_watch_queue
add column if not exists media_type text not null default 'movie';

drop index if exists public.couple_watch_queue_unique_movie_idx;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'couple_watch_queue_media_type_check'
      and conrelid = 'public.couple_watch_queue'::regclass
  ) then
    alter table public.couple_watch_queue
      add constraint couple_watch_queue_media_type_check
      check (media_type in ('movie', 'series'));
  end if;
end $$;

create unique index if not exists couple_watch_queue_unique_media_idx
on public.couple_watch_queue (couple_id, media_type, tmdb_id);

commit;
