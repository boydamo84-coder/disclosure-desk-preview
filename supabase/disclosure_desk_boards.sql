-- Disclosure Desk ONLY. Run in a NEW Supabase project, never Our Cinema.
-- Private per-user investigation boards. RLS applies to every client query.
create extension if not exists pgcrypto;
create table if not exists public.investigation_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  content jsonb not null default '{"links":[],"notes":[]}'::jsonb
    check (jsonb_typeof(content) = 'object' and
           jsonb_typeof(content->'links') = 'array' and
           jsonb_typeof(content->'notes') = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists investigation_boards_owner_updated
  on public.investigation_boards(user_id, updated_at desc);
alter table public.investigation_boards enable row level security;
revoke all on public.investigation_boards from anon;
grant select, insert, update, delete on public.investigation_boards to authenticated;
drop policy if exists "Owner reads boards" on public.investigation_boards;
create policy "Owner reads boards" on public.investigation_boards
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Owner adds boards" on public.investigation_boards;
create policy "Owner adds boards" on public.investigation_boards
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Owner updates boards" on public.investigation_boards;
create policy "Owner updates boards" on public.investigation_boards
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Owner deletes boards" on public.investigation_boards;
create policy "Owner deletes boards" on public.investigation_boards
  for delete to authenticated using ((select auth.uid()) = user_id);
create or replace function public.set_investigation_board_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists investigation_board_updated on public.investigation_boards;
create trigger investigation_board_updated before update on public.investigation_boards
for each row execute function public.set_investigation_board_updated_at();
-- Security checks: unauthenticated SELECT should fail/return nothing; user A
-- must never SELECT, UPDATE or DELETE user B's row. Never expose service-role keys.
