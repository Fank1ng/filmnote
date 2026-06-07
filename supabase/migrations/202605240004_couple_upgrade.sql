-- FilmNote Couple + shared next-watch queue
-- Execute in Supabase SQL editor.

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  disconnect_requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couples_distinct_users check (user_a <> user_b),
  constraint couples_requester_is_member check (requested_by = user_a or requested_by = user_b),
  constraint couples_disconnect_requester_is_member check (disconnect_requested_by is null or disconnect_requested_by = user_a or disconnect_requested_by = user_b)
);

alter table public.couples
add column if not exists disconnect_requested_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'couples_disconnect_requester_is_member'
      and conrelid = 'public.couples'::regclass
  ) then
    alter table public.couples
      add constraint couples_disconnect_requester_is_member
      check (disconnect_requested_by is null or disconnect_requested_by = user_a or disconnect_requested_by = user_b);
  end if;
end $$;

create unique index if not exists couples_one_pair_idx
on public.couples (least(user_a::text, user_b::text), greatest(user_a::text, user_b::text));

create unique index if not exists couples_user_a_active_idx
on public.couples (user_a)
where status = 'active';

create unique index if not exists couples_user_b_active_idx
on public.couples (user_b)
where status = 'active';

create or replace function public.enforce_single_active_couple()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.couples c
    where c.id <> new.id
      and c.status = 'active'
      and (c.user_a in (new.user_a, new.user_b) or c.user_b in (new.user_a, new.user_b))
  ) then
    raise exception 'user already has an active couple';
  end if;
  return new;
end;
$$;

drop trigger if exists couples_enforce_single_active on public.couples;
create trigger couples_enforce_single_active
before insert or update on public.couples
for each row execute function public.enforce_single_active_couple();

delete from public.couples pending
where pending.status = 'pending'
  and exists (
    select 1 from public.couples active
    where active.id <> pending.id
      and active.status = 'active'
      and (
        active.user_a in (pending.user_a, pending.user_b)
        or active.user_b in (pending.user_a, pending.user_b)
      )
  );

create table if not exists public.couple_watch_queue (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  media_type text not null default 'movie',
  tmdb_id integer not null,
  title text not null,
  year integer,
  poster_path text,
  position integer not null default 0,
  added_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couple_watch_queue_tmdb_positive check (tmdb_id > 0)
);

alter table public.couple_watch_queue
add column if not exists media_type text not null default 'movie';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'couple_watch_queue_media_type_check'
      and conrelid = 'public.couple_watch_queue'::regclass
  ) then
    alter table public.couple_watch_queue
      add constraint couple_watch_queue_media_type_check check (media_type in ('movie', 'series'));
  end if;
end $$;

drop index if exists couple_watch_queue_unique_movie_idx;
create unique index if not exists couple_watch_queue_unique_media_idx
on public.couple_watch_queue (couple_id, media_type, tmdb_id);

create index if not exists couple_watch_queue_order_idx
on public.couple_watch_queue (couple_id, position, created_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists couples_touch_updated_at on public.couples;
create trigger couples_touch_updated_at
before update on public.couples
for each row execute function public.touch_updated_at();

drop trigger if exists couple_watch_queue_touch_updated_at on public.couple_watch_queue;
create trigger couple_watch_queue_touch_updated_at
before update on public.couple_watch_queue
for each row execute function public.touch_updated_at();

alter table public.couples enable row level security;
alter table public.couple_watch_queue enable row level security;

grant select, insert, update, delete on public.couples to authenticated;
grant select, insert, update, delete on public.couple_watch_queue to authenticated;

drop policy if exists "couple members can read partner blocked movies" on public.blocked_movies;
create policy "couple members can read partner blocked movies"
on public.blocked_movies for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.couples c
    where c.status = 'active'
      and user_id in (c.user_a, c.user_b)
      and auth.uid() in (c.user_a, c.user_b)
  )
);

drop policy if exists "couple members can read couples" on public.couples;
create policy "couple members can read couples"
on public.couples for select
using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "members can request couples" on public.couples;
create policy "members can request couples"
on public.couples for insert
with check (
  auth.uid() = requested_by
  and (auth.uid() = user_a or auth.uid() = user_b)
);

drop policy if exists "members can update couples" on public.couples;
create policy "members can update couples"
on public.couples for update
using (auth.uid() = user_a or auth.uid() = user_b)
with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "members can delete couples" on public.couples;
create policy "members can delete couples"
on public.couples for delete
using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "couple members can read queue" on public.couple_watch_queue;
create policy "couple members can read queue"
on public.couple_watch_queue for select
using (
  exists (
    select 1 from public.couples c
    where c.id = couple_watch_queue.couple_id
      and c.status = 'active'
      and (auth.uid() = c.user_a or auth.uid() = c.user_b)
  )
);

drop policy if exists "couple members can insert queue" on public.couple_watch_queue;
create policy "couple members can insert queue"
on public.couple_watch_queue for insert
with check (
  auth.uid() = added_by
  and exists (
    select 1 from public.couples c
    where c.id = couple_watch_queue.couple_id
      and c.status = 'active'
      and (auth.uid() = c.user_a or auth.uid() = c.user_b)
  )
);

drop policy if exists "couple members can update queue" on public.couple_watch_queue;
create policy "couple members can update queue"
on public.couple_watch_queue for update
using (
  exists (
    select 1 from public.couples c
    where c.id = couple_watch_queue.couple_id
      and c.status = 'active'
      and (auth.uid() = c.user_a or auth.uid() = c.user_b)
  )
)
with check (
  exists (
    select 1 from public.couples c
    where c.id = couple_watch_queue.couple_id
      and c.status = 'active'
      and (auth.uid() = c.user_a or auth.uid() = c.user_b)
  )
);

drop policy if exists "couple members can delete queue" on public.couple_watch_queue;
create policy "couple members can delete queue"
on public.couple_watch_queue for delete
using (
  exists (
    select 1 from public.couples c
    where c.id = couple_watch_queue.couple_id
      and c.status = 'active'
      and (auth.uid() = c.user_a or auth.uid() = c.user_b)
  )
);
