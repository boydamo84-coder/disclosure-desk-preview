-- Disclosure Desk: private video progress per verified account
create table if not exists public.video_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 watched jsonb not null default '{}'::jsonb,
 skipped jsonb not null default '{}'::jsonb,
 last_clip_id text,
 updated_at timestamptz not null default now()
);
alter table public.video_progress enable row level security;
drop policy if exists "Video progress owner select" on public.video_progress;
create policy "Video progress owner select" on public.video_progress for select to authenticated using (auth.uid()=user_id);
drop policy if exists "Video progress owner insert" on public.video_progress;
create policy "Video progress owner insert" on public.video_progress for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Video progress owner update" on public.video_progress;
create policy "Video progress owner update" on public.video_progress for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
revoke all on public.video_progress from anon;
grant select,insert,update on public.video_progress to authenticated;
