-- FilmNote list mutual-exclusion and rating cleanup rules.
-- Execute in Supabase SQL Editor after the watchlist and couple queue tables exist.

create or replace function public.normalize_list_media_type(p_type text)
returns text
language sql
immutable
as $$
  select case when p_type in ('series', 'tv') then 'series' else 'movie' end;
$$;

create or replace function public.enforce_watchlist_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.media_type := public.normalize_list_media_type(new.media_type);

  if exists (
    select 1
    from public.entries e
    where e.user_id = new.user_id
      and public.normalize_list_media_type(e.type) = new.media_type
      and e.tmdb_id = new.tmdb_id
  ) then
    raise exception using message = 'list_rule_already_rated_watchlist';
  end if;

  if to_regclass('public.couples') is not null
     and to_regclass('public.couple_watch_queue') is not null then
    if exists (
      select 1
      from public.couples c
      join public.couple_watch_queue q on q.couple_id = c.id
      where c.status = 'active'
        and (c.user_a = new.user_id or c.user_b = new.user_id)
        and q.media_type = new.media_type
        and q.tmdb_id = new.tmdb_id
    ) then
      raise exception using message = 'list_rule_watchlist_queue_conflict';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists watchlist_movies_enforce_list_rules on public.watchlist_movies;
create trigger watchlist_movies_enforce_list_rules
before insert or update on public.watchlist_movies
for each row execute function public.enforce_watchlist_rules();

create or replace function public.enforce_couple_queue_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_a uuid;
  v_user_b uuid;
begin
  new.media_type := public.normalize_list_media_type(new.media_type);

  select c.user_a, c.user_b
  into v_user_a, v_user_b
  from public.couples c
  where c.id = new.couple_id
    and c.status = 'active';

  if v_user_a is null or v_user_b is null then
    return new;
  end if;

  if exists (
    select 1
    from public.entries e
    where e.user_id in (v_user_a, v_user_b)
      and public.normalize_list_media_type(e.type) = new.media_type
      and e.tmdb_id = new.tmdb_id
  ) then
    raise exception using message = 'list_rule_already_rated_queue';
  end if;

  if exists (
    select 1
    from public.watchlist_movies w
    where w.user_id in (v_user_a, v_user_b)
      and w.media_type = new.media_type
      and w.tmdb_id = new.tmdb_id
  ) then
    raise exception using message = 'list_rule_watchlist_queue_conflict';
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.couple_watch_queue') is not null then
    execute 'drop trigger if exists couple_watch_queue_enforce_list_rules on public.couple_watch_queue';
    execute 'create trigger couple_watch_queue_enforce_list_rules before insert or update on public.couple_watch_queue for each row execute function public.enforce_couple_queue_rules()';
  end if;
end $$;

create or replace function public.cleanup_lists_after_entry_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_media_type text;
begin
  if new.tmdb_id is null then
    return new;
  end if;

  v_media_type := public.normalize_list_media_type(new.type);

  delete from public.watchlist_movies w
  where w.user_id = new.user_id
    and w.media_type = v_media_type
    and w.tmdb_id = new.tmdb_id;

  if to_regclass('public.couples') is null
     or to_regclass('public.couple_watch_queue') is null then
    return new;
  end if;

  delete from public.couple_watch_queue q
  using public.couples c
  where q.couple_id = c.id
    and c.status = 'active'
    and (c.user_a = new.user_id or c.user_b = new.user_id)
    and q.media_type = v_media_type
    and q.tmdb_id = new.tmdb_id
    and exists (
      select 1
      from public.entries ea
      where ea.user_id = c.user_a
        and public.normalize_list_media_type(ea.type) = v_media_type
        and ea.tmdb_id = new.tmdb_id
    )
    and exists (
      select 1
      from public.entries eb
      where eb.user_id = c.user_b
        and public.normalize_list_media_type(eb.type) = v_media_type
        and eb.tmdb_id = new.tmdb_id
    );

  return new;
end;
$$;

drop trigger if exists entries_cleanup_lists_after_rating on public.entries;
create trigger entries_cleanup_lists_after_rating
after insert or update on public.entries
for each row execute function public.cleanup_lists_after_entry_rating();
