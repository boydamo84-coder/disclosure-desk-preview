-- Disclosure Desk Community Research M02 / DESIGN REVIEW ONLY (2026-11-18)
-- NEVER apply to live Supabase from this branch or from CI.
-- CI may execute this SQL only against a disposable local PostgreSQL service.
-- Deliberate fail-closed model: registered authors can save PRIVATE drafts.
-- Public paper/edition tables are READ ONLY and EMPTY on installation.
-- No public publish RPC, no SECURITY DEFINER endpoint, no service keys.
-- W.NE research_documents / recovery history are never read or modified here.
-- Documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
-- https://supabase.com/docs/guides/auth/auth-anonymous

create function public.dd_cr_links_ok(p_urls text[])
returns boolean language sql immutable security invoker set search_path = ''
as $fn$
 select cardinality(p_urls)<=12 and not exists(
  select 1 from unnest(p_urls) url
  where url is null or length(url)>1000
     or url !~ '^https://[^[:space:]<>]+
 );
$fn$;
revoke all on function public.dd_cr_links_ok(text[]) from public,anon,authenticated;
grant execute on function public.dd_cr_links_ok(text[]) to authenticated;

create table public.dd_cr_drafts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check (length(btrim(title)) between 8 and 140),
 abstract text not null default '' check (length(abstract)<=600),
 body text not null default '' check (length(body)<=30000),
 paper_type text not null default 'case' check (paper_type in ('case','archive','hypothesis','methods')),
 source_urls text[] not null default array[]::text[] check (public.dd_cr_links_ok(source_urls)),
 revision integer not null default 1 check (revision>=1),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index dd_cr_drafts_author_idx on public.dd_cr_drafts (author_id,updated_at desc);
alter table public.dd_cr_drafts enable row level security;
revoke all on table public.dd_cr_drafts from public,anon,authenticated;
grant select,delete on table public.dd_cr_drafts to authenticated;
grant insert (title,abstract,body,paper_type,source_urls) on public.dd_cr_drafts to authenticated;
grant update (title,abstract,body,paper_type,source_urls) on public.dd_cr_drafts to authenticated;
create policy dd_cr_drafts_private_read on public.dd_cr_drafts
 for select to authenticated using (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
);
create policy dd_cr_drafts_private_create on public.dd_cr_drafts
 for insert to authenticated with check (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
);
create policy dd_cr_drafts_private_update on public.dd_cr_drafts
 for update to authenticated
 using (author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true')
 with check (author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create policy dd_cr_drafts_private_delete on public.dd_cr_drafts
 for delete to authenticated using (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
);
create function public.dd_cr_guard_draft()
returns trigger language plpgsql security invoker set search_path=''
as $body$
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true'
    or new.author_id is distinct from auth.uid() then
  raise exception 'Registered draft author required' using errcode='42501';
 end if;
 if tg_op='UPDATE' then
   if new.id is distinct from old.id or new.author_id is distinct from old.author_id
      or new.created_at is distinct from old.created_at then
    raise exception 'Draft identity is immutable' using errcode='23514';
   end if;
   new.revision=old.revision+1;
   new.created_at=old.created_at;
 else
   new.revision=1;
   new.created_at=clock_timestamp();
 end if;
 new.updated_at=clock_timestamp();
 return new;
end
$body$;
revoke all on function public.dd_cr_guard_draft() from public,anon,authenticated;
create trigger dd_cr_draft_guard before insert or update on public.dd_cr_drafts
 for each row execute function public.dd_cr_guard_draft();

-- Publication registry and immutable paper editions are NOT writable by site clients.
-- A separately reviewed publish/withdraw process is required in M03.
create table public.dd_cr_publications (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'published' check (status in ('published','withdrawn')),
 current_edition integer not null default 1 check (current_edition>=1),
 published_at timestamptz not null default now(),
 changed_at timestamptz not null default now()
);
create index dd_cr_pub_visible_idx on public.dd_cr_publications (published_at desc)
 where status='published';
alter table public.dd_cr_publications enable row level security;
revoke all on table public.dd_cr_publications from public,anon,authenticated;
grant select on public.dd_cr_publications to anon,authenticated;
create policy dd_cr_pub_read on public.dd_cr_publications
 for select to anon,authenticated
 using (status='published' or (author_id=(select auth.uid())
     and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'));

create table public.dd_cr_editions (
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 edition integer not null check (edition>=1),
 title text not null check (length(btrim(title)) between 8 and 140),
 abstract text not null check (length(btrim(abstract)) between 30 and 600),
 body text not null check (length(btrim(body)) between 150 and 30000),
 paper_type text not null check (paper_type in ('case','archive','hypothesis','methods')),
 source_urls text[] not null default array[]::text[] check (public.dd_cr_links_ok(source_urls)),
 published_at timestamptz not null default now(),
 primary key (paper_id,edition)
);
alter table public.dd_cr_editions enable row level security;
revoke all on table public.dd_cr_editions from public,anon,authenticated;
grant select on public.dd_cr_editions to anon,authenticated;
create policy dd_cr_edition_read_if_paper_visible on public.dd_cr_editions
 for select to anon,authenticated
 using (exists(select 1 from public.dd_cr_publications p where p.id=paper_id));
-- Any edition >1 remains a distinct, permanent published snapshot.
-- Non-author cannot read withdrawn editions; no client can rewrite them.

-- Private individual vote identities, NOT public truth scores or public tallies.
create table public.dd_cr_votes (
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 voter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 value smallint not null check (value in (-1,1)),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(paper_id,voter_id)
);
alter table public.dd_cr_votes enable row level security;
revoke all on public.dd_cr_votes from public,anon,authenticated;
grant select,delete on public.dd_cr_votes to authenticated;
grant insert (paper_id,value) on public.dd_cr_votes to authenticated;
grant update (value) on public.dd_cr_votes to authenticated;
create policy dd_cr_votes_member_read on public.dd_cr_votes
 for select to authenticated using (voter_id=(select auth.uid())
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create policy dd_cr_votes_member_create on public.dd_cr_votes
 for insert to authenticated with check (
 voter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists (select 1 from public.dd_cr_publications p
             where p.id=paper_id and p.status='published'));
create policy dd_cr_votes_member_change on public.dd_cr_votes
 for update to authenticated
 using (voter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true')
 with check (voter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists (select 1 from public.dd_cr_publications p
             where p.id=paper_id and p.status='published'));
create policy dd_cr_votes_member_remove on public.dd_cr_votes
 for delete to authenticated using (voter_id=(select auth.uid())
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create function public.dd_cr_guard_vote()
returns trigger language plpgsql security invoker set search_path=''
as $body$
begin
 if new.voter_id is distinct from auth.uid() or auth.uid() is null
    or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Registered voter required' using errcode='42501';
 end if;
 if tg_op='UPDATE' and
   (new.paper_id is distinct from old.paper_id or new.voter_id is distinct from old.voter_id
    or new.created_at is distinct from old.created_at) then
   raise exception 'Vote identity is immutable' using errcode='23514';
 end if;
 if tg_op='UPDATE' then
   new.created_at=old.created_at;
 else
   new.created_at=clock_timestamp();
 end if;
 new.updated_at=clock_timestamp();
 return new;
end
$body$;
revoke all on function public.dd_cr_guard_vote() from public,anon,authenticated;
create trigger dd_cr_vote_guard before insert or update on public.dd_cr_votes
 for each row execute function public.dd_cr_guard_vote();

-- Text-only, category-labelled feedback. Publication and moderation still off.
create table public.dd_cr_comments (
 id uuid primary key default gen_random_uuid(),
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 parent_id uuid references public.dd_cr_comments(id) on delete set null,
 category text not null check (category in ('support','counter','correction','source','question')),
 body text not null check (length(btrim(body)) between 2 and 4000),
 hidden boolean not null default false,
 deleted boolean not null default false,
 created_at timestamptz not null default now(),
 check (id is distinct from parent_id)
);
create index dd_cr_comments_paper_idx on public.dd_cr_comments (paper_id,created_at desc);
alter table public.dd_cr_comments enable row level security;
revoke all on public.dd_cr_comments from public,anon,authenticated;
grant select on public.dd_cr_comments to anon,authenticated;
grant insert (paper_id,parent_id,category,body) on public.dd_cr_comments to authenticated;
create policy dd_cr_comments_public_read on public.dd_cr_comments
 for select to anon,authenticated using (
 not hidden and not deleted and exists (select 1 from public.dd_cr_publications p
                                       where p.id=paper_id and p.status='published'));
create policy dd_cr_comments_registered_create on public.dd_cr_comments
 for insert to authenticated with check (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and not hidden and not deleted
 and exists (select 1 from public.dd_cr_publications p
             where p.id=paper_id and p.status='published'));
create function public.dd_cr_comment_parent_guard()
returns trigger language plpgsql security invoker set search_path=''
as $body$
begin
 if auth.uid() is null or new.author_id is distinct from auth.uid()
    or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Registered feedback author required' using errcode='42501';
 end if;
 if new.parent_id is not null and not exists(
    select 1 from public.dd_cr_comments parent
    where parent.id=new.parent_id and parent.paper_id=new.paper_id
      and parent.parent_id is null and not parent.deleted and not parent.hidden
 ) then
  raise exception 'Reply must refer to a visible root comment on the same paper'
    using errcode='23514';
 end if;
 return new;
end
$body$;
revoke all on function public.dd_cr_comment_parent_guard() from public,anon,authenticated;
create trigger dd_cr_comment_guard before insert on public.dd_cr_comments
 for each row execute function public.dd_cr_comment_parent_guard();

-- Only the reporting member can read their report; moderators need a separate
-- reviewed privileged workflow in M03. Reporter identity is never exposed.
create table public.dd_cr_reports (
 id uuid primary key default gen_random_uuid(),
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 comment_id uuid references public.dd_cr_comments(id) on delete cascade,
 reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 reason text not null check (reason in ('copyright','privacy','harassment','spam','source')),
 details text not null default '' check (length(details)<=1000),
 created_at timestamptz not null default now(),
 unique(paper_id,comment_id,reporter_id)
);
create unique index dd_cr_paper_report_once_idx on public.dd_cr_reports (paper_id,reporter_id)
 where comment_id is null;
alter table public.dd_cr_reports enable row level security;
revoke all on public.dd_cr_reports from public,anon,authenticated;
grant select on public.dd_cr_reports to authenticated;
grant insert (paper_id,comment_id,reason,details) on public.dd_cr_reports to authenticated;
create policy dd_cr_report_own_read on public.dd_cr_reports
 for select to authenticated using (reporter_id=(select auth.uid())
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create policy dd_cr_report_own_insert on public.dd_cr_reports
 for insert to authenticated with check (
 reporter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists(select 1 from public.dd_cr_publications p
            where p.id=paper_id and p.status='published')
 and (comment_id is null or exists(
    select 1 from public.dd_cr_comments c
    where c.id=comment_id and c.paper_id=dd_cr_reports.paper_id
       and not c.deleted and not c.hidden
 )));
-- NO sample users, drafts, public papers, votes, comments or reports added.
-- NO client-side publishing and NO admin/moderation privileges granted.

 );
$fn$;
revoke all on function public.dd_cr_links_ok(text[]) from public,anon,authenticated;
grant execute on function public.dd_cr_links_ok(text[]) to authenticated;

create table public.dd_cr_drafts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check (length(btrim(title)) between 8 and 140),
 abstract text not null default '' check (length(abstract)<=600),
 body text not null default '' check (length(body)<=30000),
 paper_type text not null default 'case' check (paper_type in ('case','archive','hypothesis','methods')),
 source_urls text[] not null default array[]::text[] check (public.dd_cr_links_ok(source_urls)),
 revision integer not null default 1 check (revision>=1),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index dd_cr_drafts_author_idx on public.dd_cr_drafts (author_id,updated_at desc);
alter table public.dd_cr_drafts enable row level security;
revoke all on table public.dd_cr_drafts from public,anon,authenticated;
grant select,delete on table public.dd_cr_drafts to authenticated;
grant insert (title,abstract,body,paper_type,source_urls) on public.dd_cr_drafts to authenticated;
grant update (title,abstract,body,paper_type,source_urls) on public.dd_cr_drafts to authenticated;
create policy dd_cr_drafts_private_read on public.dd_cr_drafts
 for select to authenticated using (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
);
create policy dd_cr_drafts_private_create on public.dd_cr_drafts
 for insert to authenticated with check (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
);
create policy dd_cr_drafts_private_update on public.dd_cr_drafts
 for update to authenticated
 using (author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true')
 with check (author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create policy dd_cr_drafts_private_delete on public.dd_cr_drafts
 for delete to authenticated using (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
);
create function public.dd_cr_guard_draft()
returns trigger language plpgsql security invoker set search_path=''
as $body$
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true'
    or new.author_id is distinct from auth.uid() then
  raise exception 'Registered draft author required' using errcode='42501';
 end if;
 if tg_op='UPDATE' then
   if new.id is distinct from old.id or new.author_id is distinct from old.author_id
      or new.created_at is distinct from old.created_at then
    raise exception 'Draft identity is immutable' using errcode='23514';
   end if;
   new.revision=old.revision+1;
   new.created_at=old.created_at;
 else
   new.revision=1;
   new.created_at=clock_timestamp();
 end if;
 new.updated_at=clock_timestamp();
 return new;
end
$body$;
revoke all on function public.dd_cr_guard_draft() from public,anon,authenticated;
create trigger dd_cr_draft_guard before insert or update on public.dd_cr_drafts
 for each row execute function public.dd_cr_guard_draft();

-- Publication registry and immutable paper editions are NOT writable by site clients.
-- A separately reviewed publish/withdraw process is required in M03.
create table public.dd_cr_publications (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'published' check (status in ('published','withdrawn')),
 current_edition integer not null default 1 check (current_edition>=1),
 published_at timestamptz not null default now(),
 changed_at timestamptz not null default now()
);
create index dd_cr_pub_visible_idx on public.dd_cr_publications (published_at desc)
 where status='published';
alter table public.dd_cr_publications enable row level security;
revoke all on table public.dd_cr_publications from public,anon,authenticated;
grant select on public.dd_cr_publications to anon,authenticated;
create policy dd_cr_pub_read on public.dd_cr_publications
 for select to anon,authenticated
 using (status='published' or (author_id=(select auth.uid())
     and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'));

create table public.dd_cr_editions (
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 edition integer not null check (edition>=1),
 title text not null check (length(btrim(title)) between 8 and 140),
 abstract text not null check (length(btrim(abstract)) between 30 and 600),
 body text not null check (length(btrim(body)) between 150 and 30000),
 paper_type text not null check (paper_type in ('case','archive','hypothesis','methods')),
 source_urls text[] not null default array[]::text[] check (public.dd_cr_links_ok(source_urls)),
 published_at timestamptz not null default now(),
 primary key (paper_id,edition)
);
alter table public.dd_cr_editions enable row level security;
revoke all on table public.dd_cr_editions from public,anon,authenticated;
grant select on public.dd_cr_editions to anon,authenticated;
create policy dd_cr_edition_read_if_paper_visible on public.dd_cr_editions
 for select to anon,authenticated
 using (exists(select 1 from public.dd_cr_publications p where p.id=paper_id));
-- Any edition >1 remains a distinct, permanent published snapshot.
-- Non-author cannot read withdrawn editions; no client can rewrite them.

-- Private individual vote identities, NOT public truth scores or public tallies.
create table public.dd_cr_votes (
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 voter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 value smallint not null check (value in (-1,1)),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(paper_id,voter_id)
);
alter table public.dd_cr_votes enable row level security;
revoke all on public.dd_cr_votes from public,anon,authenticated;
grant select,delete on public.dd_cr_votes to authenticated;
grant insert (paper_id,value) on public.dd_cr_votes to authenticated;
grant update (value) on public.dd_cr_votes to authenticated;
create policy dd_cr_votes_member_read on public.dd_cr_votes
 for select to authenticated using (voter_id=(select auth.uid())
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create policy dd_cr_votes_member_create on public.dd_cr_votes
 for insert to authenticated with check (
 voter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists (select 1 from public.dd_cr_publications p
             where p.id=paper_id and p.status='published'));
create policy dd_cr_votes_member_change on public.dd_cr_votes
 for update to authenticated
 using (voter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true')
 with check (voter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists (select 1 from public.dd_cr_publications p
             where p.id=paper_id and p.status='published'));
create policy dd_cr_votes_member_remove on public.dd_cr_votes
 for delete to authenticated using (voter_id=(select auth.uid())
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create function public.dd_cr_guard_vote()
returns trigger language plpgsql security invoker set search_path=''
as $body$
begin
 if new.voter_id is distinct from auth.uid() or auth.uid() is null
    or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Registered voter required' using errcode='42501';
 end if;
 if tg_op='UPDATE' and
   (new.paper_id is distinct from old.paper_id or new.voter_id is distinct from old.voter_id
    or new.created_at is distinct from old.created_at) then
   raise exception 'Vote identity is immutable' using errcode='23514';
 end if;
 if tg_op='UPDATE' then
   new.created_at=old.created_at;
 else
   new.created_at=clock_timestamp();
 end if;
 new.updated_at=clock_timestamp();
 return new;
end
$body$;
revoke all on function public.dd_cr_guard_vote() from public,anon,authenticated;
create trigger dd_cr_vote_guard before insert or update on public.dd_cr_votes
 for each row execute function public.dd_cr_guard_vote();

-- Text-only, category-labelled feedback. Publication and moderation still off.
create table public.dd_cr_comments (
 id uuid primary key default gen_random_uuid(),
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 parent_id uuid references public.dd_cr_comments(id) on delete set null,
 category text not null check (category in ('support','counter','correction','source','question')),
 body text not null check (length(btrim(body)) between 2 and 4000),
 hidden boolean not null default false,
 deleted boolean not null default false,
 created_at timestamptz not null default now(),
 check (id is distinct from parent_id)
);
create index dd_cr_comments_paper_idx on public.dd_cr_comments (paper_id,created_at desc);
alter table public.dd_cr_comments enable row level security;
revoke all on public.dd_cr_comments from public,anon,authenticated;
grant select on public.dd_cr_comments to anon,authenticated;
grant insert (paper_id,parent_id,category,body) on public.dd_cr_comments to authenticated;
create policy dd_cr_comments_public_read on public.dd_cr_comments
 for select to anon,authenticated using (
 not hidden and not deleted and exists (select 1 from public.dd_cr_publications p
                                       where p.id=paper_id and p.status='published'));
create policy dd_cr_comments_registered_create on public.dd_cr_comments
 for insert to authenticated with check (
 author_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and not hidden and not deleted
 and exists (select 1 from public.dd_cr_publications p
             where p.id=paper_id and p.status='published'));
create function public.dd_cr_comment_parent_guard()
returns trigger language plpgsql security invoker set search_path=''
as $body$
begin
 if auth.uid() is null or new.author_id is distinct from auth.uid()
    or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Registered feedback author required' using errcode='42501';
 end if;
 if new.parent_id is not null and not exists(
    select 1 from public.dd_cr_comments parent
    where parent.id=new.parent_id and parent.paper_id=new.paper_id
      and parent.parent_id is null and not parent.deleted and not parent.hidden
 ) then
  raise exception 'Reply must refer to a visible root comment on the same paper'
    using errcode='23514';
 end if;
 return new;
end
$body$;
revoke all on function public.dd_cr_comment_parent_guard() from public,anon,authenticated;
create trigger dd_cr_comment_guard before insert on public.dd_cr_comments
 for each row execute function public.dd_cr_comment_parent_guard();

-- Only the reporting member can read their report; moderators need a separate
-- reviewed privileged workflow in M03. Reporter identity is never exposed.
create table public.dd_cr_reports (
 id uuid primary key default gen_random_uuid(),
 paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
 comment_id uuid references public.dd_cr_comments(id) on delete cascade,
 reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 reason text not null check (reason in ('copyright','privacy','harassment','spam','source')),
 details text not null default '' check (length(details)<=1000),
 created_at timestamptz not null default now(),
 unique(paper_id,comment_id,reporter_id)
);
create unique index dd_cr_paper_report_once_idx on public.dd_cr_reports (paper_id,reporter_id)
 where comment_id is null;
alter table public.dd_cr_reports enable row level security;
revoke all on public.dd_cr_reports from public,anon,authenticated;
grant select on public.dd_cr_reports to authenticated;
grant insert (paper_id,comment_id,reason,details) on public.dd_cr_reports to authenticated;
create policy dd_cr_report_own_read on public.dd_cr_reports
 for select to authenticated using (reporter_id=(select auth.uid())
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true');
create policy dd_cr_report_own_insert on public.dd_cr_reports
 for insert to authenticated with check (
 reporter_id=(select auth.uid()) and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists(select 1 from public.dd_cr_publications p
            where p.id=paper_id and p.status='published')
 and (comment_id is null or exists(
    select 1 from public.dd_cr_comments c
    where c.id=comment_id and c.paper_id=dd_cr_reports.paper_id
       and not c.deleted and not c.hidden
 )));
-- NO sample users, drafts, public papers, votes, comments or reports added.
-- NO client-side publishing and NO admin/moderation privileges granted.
