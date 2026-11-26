-- DRAFT ONLY: disposable test databases. Not a migration. No production execution.
-- Text-only pilot. No attachment storage, external fetch, or access to private W.NE tables.
begin;
create table public.dd_cr_submissions (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null default auth.uid(),
 author_label text not null check (char_length(btrim(author_label)) between 1 and 80),
 title text not null check (char_length(btrim(title)) between 1 and 160),
 abstract text not null check (char_length(btrim(abstract)) between 1 and 1500),
 category text not null check (category in ('Case analysis','Document analysis','Scientific research','Historical research','FOIA research','Other research')),
 body_text text not null check (char_length(btrim(body_text)) between 1 and 120000),
 references_text text not null default '' check (char_length(references_text)<=20000),
 consent boolean not null check(consent),
 status text not null default 'pending' check(status in ('pending','published','rejected','withdrawn')),
 revision_of uuid references public.dd_cr_submissions(id),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 check (octet_length(body_text)+octet_length(references_text)<=180000)
);
create index dd_cr_author_idx on public.dd_cr_submissions(author_id,created_at desc);
create index dd_cr_public_idx on public.dd_cr_submissions(status,created_at desc);
create table public.dd_cr_reactions (
 report_id uuid not null references public.dd_cr_submissions(id),
 member_id uuid not null default auth.uid(),
 reaction smallint not null check(reaction in (-1,1)),
 primary key(report_id,member_id)
);
create table public.dd_cr_comments (
 id uuid primary key default gen_random_uuid(),
 report_id uuid not null references public.dd_cr_submissions(id),
 member_id uuid not null default auth.uid(),
 author_label text not null check(char_length(btrim(author_label)) between 1 and 80),
 body_text text not null check(char_length(btrim(body_text)) between 1 and 2000),
 created_at timestamptz not null default now(),
 status text not null default 'visible' check(status in ('visible','removed'))
);
create index dd_cr_comments_report_idx on public.dd_cr_comments(report_id,created_at);
alter table public.dd_cr_submissions enable row level security;
alter table public.dd_cr_reactions enable row level security;
alter table public.dd_cr_comments enable row level security;
revoke all on public.dd_cr_submissions,public.dd_cr_reactions,public.dd_cr_comments from public,anon,authenticated;
-- Clients cannot assign author/member UUID, status, timestamps, or moderation outcomes.
grant select(id,author_label,title,abstract,category,body_text,references_text,status,revision_of,created_at,reviewed_at)
 on public.dd_cr_submissions to anon,authenticated;
grant insert(author_label,title,abstract,category,body_text,references_text,consent,revision_of)
 on public.dd_cr_submissions to authenticated;
grant select(report_id,reaction) on public.dd_cr_reactions to anon,authenticated;
grant insert(report_id,reaction),update(reaction),delete on public.dd_cr_reactions to authenticated;
grant select(id,report_id,author_label,body_text,created_at,status) on public.dd_cr_comments to anon,authenticated;
grant insert(report_id,author_label,body_text) on public.dd_cr_comments to authenticated;
create policy dd_cr_public_read on public.dd_cr_submissions for select to anon,authenticated using(status='published');
create policy dd_cr_author_read on public.dd_cr_submissions for select to authenticated using(author_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
-- Revisions are intentionally deferred until ownership and version-chain checks are built.
create policy dd_cr_submit on public.dd_cr_submissions for insert to authenticated
 with check(author_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false' and status='pending' and revision_of is null);
create policy dd_cr_react_read on public.dd_cr_reactions for select to anon,authenticated
 using(exists(select 1 from public.dd_cr_submissions s where s.id=report_id and s.status='published'));
create policy dd_cr_react_insert on public.dd_cr_reactions for insert to authenticated
 with check(member_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false' and exists(select 1 from public.dd_cr_submissions s where s.id=report_id and s.status='published'));
create policy dd_cr_react_update on public.dd_cr_reactions for update to authenticated
 using(member_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false' and exists(select 1 from public.dd_cr_submissions s where s.id=report_id and s.status='published'))
 with check(member_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false' and exists(select 1 from public.dd_cr_submissions s where s.id=report_id and s.status='published'));
create policy dd_cr_react_delete on public.dd_cr_reactions for delete to authenticated
 using(member_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy dd_cr_comment_read on public.dd_cr_comments for select to anon,authenticated
 using(status='visible' and exists(select 1 from public.dd_cr_submissions s where s.id=report_id and s.status='published'));
create policy dd_cr_comment_insert on public.dd_cr_comments for insert to authenticated
 with check(member_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false' and status='visible' and exists(select 1 from public.dd_cr_submissions s where s.id=report_id and s.status='published'));
-- No client moderation grant. Operator approval/withdrawal is simulated in tests only.
-- Remaining gates: server-derived author identity, authenticated rate limits, moderator audit,
-- author withdrawal and revision API, abuse reporting, public read pagination and actual auth tests.
-- Do not expose this draft on a live project until those gates pass.
commit;
