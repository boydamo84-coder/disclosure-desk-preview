-- Podcast episode suggestions are private moderation submissions, never automatically published.
create table if not exists public.dd_podcast_suggestions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 episode_url text not null check (length(episode_url) between 12 and 1000 and episode_url ~ '^https://'),
 title text not null check (char_length(btrim(title)) between 3 and 180),
 notes text not null default '' check (char_length(notes) <= 500),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create index if not exists dd_podcast_suggestions_user_created on public.dd_podcast_suggestions(user_id,created_at desc);
create unique index if not exists dd_podcast_suggestions_user_url on public.dd_podcast_suggestions(user_id,episode_url);
alter table public.dd_podcast_suggestions enable row level security;
revoke all on public.dd_podcast_suggestions from anon;
revoke all on public.dd_podcast_suggestions from authenticated;
grant insert (user_id,episode_url,title,notes) on public.dd_podcast_suggestions to authenticated;
grant select (id,user_id,episode_url,title,notes,status,created_at) on public.dd_podcast_suggestions to authenticated;
drop policy if exists dd_podcast_suggestions_insert_own on public.dd_podcast_suggestions;
create policy dd_podcast_suggestions_insert_own on public.dd_podcast_suggestions for insert to authenticated
 with check (auth.uid()=user_id and status='pending');
drop policy if exists dd_podcast_suggestions_read_own on public.dd_podcast_suggestions;
create policy dd_podcast_suggestions_read_own on public.dd_podcast_suggestions for select to authenticated
 using (auth.uid()=user_id);
-- Moderation is performed separately using a trusted administrator workflow.
