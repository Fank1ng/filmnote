-- FilmNote Couple disconnect-request upgrade
-- Run once in Supabase SQL Editor. Safe to run more than once.

begin;

alter table public.couples
add column if not exists disconnect_requested_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'couples_disconnect_requester_is_member'
      and conrelid = 'public.couples'::regclass
  ) then
    alter table public.couples
      add constraint couples_disconnect_requester_is_member
      check (
        disconnect_requested_by is null
        or disconnect_requested_by = user_a
        or disconnect_requested_by = user_b
      );
  end if;
end $$;

commit;
