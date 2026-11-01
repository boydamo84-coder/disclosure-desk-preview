-- DRAFT ONLY: do not run until moderation, privacy, abuse and rollback review.
-- Research Dossier community publishing — opt-in, private-by-default.
-- No client may approve publication or change a moderator decision.
create table if not exists public.dd_research_dossiers (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 6 and 180),
 summary text not null default '' check (char_length(summary) <= 1200),
 body text not null default '' check (char_length(body) <= 200000),
 sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources)='array' and jsonb_array_length(sources)<=100),
 publication_status text not null default 'private' check (publication_status in ('private','submitted','published','rejected','withdrawn')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists dd_dossiers_public_idx on public.dd_research_dossiers (published_at desc) where publication_status='published';
create index if not exists dd_dossiers_author_idx on public.dd_research_dossiers (author_id,updated_at desc);
alter table public.dd_research_dossiers enable row level security;
drop policy if exists "Authors read own dossiers or public published" on public.dd_research_dossiers;
create policy "Authors read own dossiers or public published" on public.dd_research_dossiers
 for select using (auth.uid()=author_id or (publication_status='published' and published_at is not null));
drop policy if exists "Authors create private drafts" on public.dd_research_dossiers;
create policy "Authors create private drafts" on public.dd_research_dossiers
 for insert to authenticated with check (auth.uid()=author_id and publication_status='private' and published_at is null);
-- Deliberately no client UPDATE/DELETE policy yet. Implement reviewed RPCs:
-- save private draft, submit for moderation, withdraw and moderator approve/reject.
-- Avoid direct client updates that could escalate private -> published.
create table if not exists public.dd_dossier_ratings (
 dossier_id uuid not null references public.dd_research_dossiers(id) on delete cascade,
 reader_id uuid not null references auth.users(id) on delete cascade,
 stars smallint not null check (stars between 1 and 5),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(dossier_id,reader_id)
);
alter table public.dd_dossier_ratings enable row level security;
-- Users may only read their own rating; public average/count should come from
-- a carefully reviewed aggregate endpoint (not expose voter identities).
drop policy if exists "Readers see own rating" on public.dd_dossier_ratings;
create policy "Readers see own rating" on public.dd_dossier_ratings
 for select to authenticated using (auth.uid()=reader_id);
drop policy if exists "Readers rate approved public work except own" on public.dd_dossier_ratings;
create policy "Readers rate approved public work except own" on public.dd_dossier_ratings
 for insert to authenticated with check (
 auth.uid()=reader_id and exists (
  select 1 from public.dd_research_dossiers d
  where d.id=dossier_id and d.publication_status='published'
  and d.published_at is not null and d.author_id<>auth.uid()
 ));
drop policy if exists "Readers update own rating on public work" on public.dd_dossier_ratings;
create policy "Readers update own rating on public work" on public.dd_dossier_ratings
 for update to authenticated using (auth.uid()=reader_id)
 with check (auth.uid()=reader_id and exists (
  select 1 from public.dd_research_dossiers d
  where d.id=dossier_id and d.publication_status='published' and d.author_id<>auth.uid()
 ));
drop policy if exists "Readers remove own rating" on public.dd_dossier_ratings;
create policy "Readers remove own rating" on public.dd_dossier_ratings
 for delete to authenticated using (auth.uid()=reader_id);
-- NOTE: No public publishing until content moderation, copyright review,
-- privacy controls, reporter/block tools and rating-abuse protections ship.
