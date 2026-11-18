-- COMMUNITY RESEARCH M06: ADDITIVE, EMPTY, API-LOCKED SCHEMA FOR EXISTING DISCLOSURE DESK PROJECT
-- Intended only for user's approved existing Supabase project: omqxizswzcwgzqaczlhe.
-- This is NOT a public launch and NOT a licence to create real user papers or enable UI flags.
-- Create eight NEW tables, no sample members/rows; no existing table altered.
-- Finish by REVOKING ALL anon/authenticated access to newly created tables/functions.
-- Requires independent review before unsealing RPCs or permitting live community use.
BEGIN;
SET LOCAL statement_timeout='60s';
SET LOCAL lock_timeout='3s';
DO $pre$
BEGIN
 IF to_regclass('public.dd_cr_drafts') IS NOT NULL
   OR to_regclass('public.dd_cr_publications') IS NOT NULL
   OR to_regnamespace('dd_cr_private') IS NOT NULL
   OR to_regprocedure('public.dd_cr_links_ok(text[])') IS NOT NULL
 THEN RAISE EXCEPTION 'Community Research name collision: NO modifications made'; END IF;
END $pre$;
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
     or url !~ '^https://[^[:space:]<>]+$'
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


-- Community Research M03 / ATOMIC PUBLICATION DESIGN ONLY / NOT A DEPLOYMENT.
-- Only disposable PostgreSQL 17 CI is allowed to execute this draft.
-- Requires M02 schema first. NEVER execute against live Disclosure Desk.
-- The security-definer entry points live ONLY in dd_cr_private (NOT an exposed API schema).
-- Public RPC wrappers are SECURITY INVOKER, and own no elevated permissions.
-- No W.NE tables, research_document history, user metadata, or service-role keys accessed.
-- M03 never grants clients direct writes to dd_cr_publications or dd_cr_editions.

create schema dd_cr_private;
revoke all on schema dd_cr_private from public, anon, authenticated;
grant usage on schema dd_cr_private to authenticated;

-- Mapping is not part of the public Data API: never expose W.NE/draft identifiers.
create table dd_cr_private.draft_papers (
  draft_id uuid primary key references public.dd_cr_drafts(id) on delete cascade,
  paper_id uuid not null unique references public.dd_cr_publications(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp()
);
create table dd_cr_private.publication_events (
  id bigint generated always as identity primary key,
  paper_id uuid not null references public.dd_cr_publications(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check(event_type in ('publish','revise','withdraw')),
  draft_revision integer,
  edition integer not null check(edition>=1),
  consent_confirmed boolean not null check(consent_confirmed),
  event_at timestamptz not null default clock_timestamp()
);
alter table dd_cr_private.draft_papers enable row level security;
alter table dd_cr_private.publication_events enable row level security;
revoke all on all tables in schema dd_cr_private from public, anon, authenticated;
create index dd_cr_events_author_idx on dd_cr_private.publication_events(actor_id,event_at desc);

-- Explicit acknowledgement + saved-revision lock required for every new edition.
-- A SECURITY DEFINER is narrowly required to write to the non-client-writable
-- publication tables. NO direct API access to this function: only the
-- public SECURITY INVOKER wrapper can reach it through an authenticated role.
create function dd_cr_private.publish_saved_copy(
  p_draft_id uuid,
  p_expected_revision integer,
  p_confirm_publication boolean,
  p_paper_id uuid default null,
  p_expected_edition integer default null
) returns jsonb
language plpgsql security definer set search_path=''
as $fn$
declare
  v_actor uuid := auth.uid();
  v_draft public.dd_cr_drafts%rowtype;
  v_paper public.dd_cr_publications%rowtype;
  v_linked uuid;
  v_new_paper uuid;
  v_edition integer;
  v_kind text;
begin
  if v_actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
    raise exception 'Registered account required' using errcode='42501';
  end if;
  if p_confirm_publication is distinct from true then
    raise exception 'Explicit publication approval required' using errcode='42501';
  end if;
  if p_draft_id is null or p_expected_revision is null or p_expected_revision<1 then
    raise exception 'Saved draft and its exact revision are required' using errcode='22023';
  end if;
  if (p_paper_id is null) is distinct from (p_expected_edition is null) then
    raise exception 'Publication ID and expected edition must be supplied together' using errcode='22023';
  end if;
  if p_expected_edition is not null and p_expected_edition<1 then
    raise exception 'Invalid edition version' using errcode='22023';
  end if;

  -- A per-account transaction lock serialises new-paper quotas across drafts.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_actor::text,141));
  select d.* into v_draft from public.dd_cr_drafts d
   where d.id=p_draft_id and d.author_id=v_actor for update;
  if not found then
    raise exception 'Draft not found for this account' using errcode='42501';
  end if;
  if v_draft.revision<>p_expected_revision then
    raise exception 'Saved draft changed: review the latest copy before publishing' using errcode='40001';
  end if;
  if pg_catalog.length(pg_catalog.btrim(v_draft.title)) not between 8 and 140
    or pg_catalog.length(pg_catalog.btrim(v_draft.abstract)) not between 30 and 600
    or pg_catalog.length(pg_catalog.btrim(v_draft.body)) not between 150 and 30000
    or pg_catalog.cardinality(v_draft.source_urls)<1
    or not public.dd_cr_links_ok(v_draft.source_urls)
    -- Every source is a publicly routable-looking HTTPS hostname; never
    -- publish loopback/local domains, credentials or malformed authority.
    or exists(select 1 from unnest(v_draft.source_urls) as link(url)
      where link.url like '%@%'
        or link.url !~* '^https://[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/:?#]|$)'
        or link.url ~* '^https://[a-z0-9][a-z0-9.-]*\.(local|internal|test)([/:?#]|$)'
    ) then
    raise exception 'Paper requires a complete abstract, body and at least one valid source' using errcode='23514';
  end if;
  select l.paper_id into v_linked from dd_cr_private.draft_papers l
    where l.draft_id=p_draft_id;

  if p_paper_id is null then
    if v_linked is not null then
      raise exception 'This draft has already been published; open the revision workflow'
        using errcode='23505';
    end if;
    if (select pg_catalog.count(*) from public.dd_cr_publications p
        where p.author_id=v_actor and p.published_at>pg_catalog.clock_timestamp()-interval '24 hours') >=3 then
      raise exception 'Publication limit reached (3 papers in 24 hours)'
        using errcode='22023';
    end if;
    insert into public.dd_cr_publications(author_id,status,current_edition)
      values(v_actor,'published',1) returning id into v_new_paper;
    insert into dd_cr_private.draft_papers(draft_id,paper_id,author_id)
      values(p_draft_id,v_new_paper,v_actor);
    v_edition:=1;
    v_kind:='publish';
  else
    if v_linked is distinct from p_paper_id then
      raise exception 'This draft is not linked to that paper' using errcode='42501';
    end if;
    select p.* into v_paper from public.dd_cr_publications p
      where p.id=p_paper_id and p.author_id=v_actor for update;
    if not found or v_paper.status<>'published' then
      raise exception 'No active owned paper is available for revision' using errcode='42501';
    end if;
    if v_paper.current_edition<>p_expected_edition then
      raise exception 'Paper edition has changed; review again' using errcode='40001';
    end if;
    if v_paper.changed_at>pg_catalog.clock_timestamp()-interval '5 minutes' then
      raise exception 'Wait five minutes before creating another edition' using errcode='22023';
    end if;
    if (select pg_catalog.count(*) from public.dd_cr_editions e
        where e.paper_id=p_paper_id and e.published_at>pg_catalog.clock_timestamp()-interval '24 hours') >=10 then
      raise exception 'Edition limit reached (10 editions in 24 hours)' using errcode='22023';
    end if;
    if exists (select 1 from public.dd_cr_editions e
      where e.paper_id=p_paper_id and e.edition=p_expected_edition
      and e.title=v_draft.title and e.abstract=v_draft.abstract
      and e.body=v_draft.body and e.paper_type=v_draft.paper_type
      and e.source_urls=v_draft.source_urls) then
       raise exception 'The proposed public edition has no changes' using errcode='23514';
    end if;
    v_new_paper:=p_paper_id;
    v_edition:=p_expected_edition+1;
    v_kind:='revise';
  end if;

  insert into public.dd_cr_editions(paper_id,edition,title,abstract,body,paper_type,source_urls)
    values (v_new_paper,v_edition,v_draft.title,v_draft.abstract,
            v_draft.body,v_draft.paper_type,v_draft.source_urls);
  if v_kind='revise' then
    update public.dd_cr_publications p
       set current_edition=v_edition,changed_at=pg_catalog.clock_timestamp()
       where p.id=v_new_paper and p.author_id=v_actor;
  end if;
  insert into dd_cr_private.publication_events(
    paper_id,actor_id,event_type,draft_revision,edition,consent_confirmed)
    values(v_new_paper,v_actor,v_kind,p_expected_revision,v_edition,true);
  return pg_catalog.jsonb_build_object(
    'paper_id',v_new_paper,'edition',v_edition,'status','published');
end
$fn$;
revoke all on function dd_cr_private.publish_saved_copy(uuid,integer,boolean,uuid,integer)
  from public,anon,authenticated;
grant execute on function dd_cr_private.publish_saved_copy(uuid,integer,boolean,uuid,integer)
  to authenticated;

create function dd_cr_private.withdraw_paper(
  p_paper_id uuid,
  p_expected_edition integer,
  p_confirm_withdrawal boolean
) returns jsonb
language plpgsql security definer set search_path=''
as $fn$
declare
  v_actor uuid := auth.uid();
  v_paper public.dd_cr_publications%rowtype;
begin
  if v_actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
    raise exception 'Registered account required' using errcode='42501';
  end if;
  if p_confirm_withdrawal is distinct from true then
    raise exception 'Explicit withdrawal approval required' using errcode='42501';
  end if;
  if p_paper_id is null or p_expected_edition is null or p_expected_edition<1 then
    raise exception 'Existing paper and current edition required' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_actor::text,141));
  select p.* into v_paper from public.dd_cr_publications p
    where p.id=p_paper_id and p.author_id=v_actor for update;
  if not found or v_paper.status<>'published' then
    raise exception 'Active paper not found for this author' using errcode='42501';
  end if;
  if v_paper.current_edition<>p_expected_edition then
    raise exception 'Paper edition changed; verify before withdrawal' using errcode='40001';
  end if;
  update public.dd_cr_publications p
     set status='withdrawn',changed_at=pg_catalog.clock_timestamp()
     where p.id=p_paper_id and p.author_id=v_actor;
  insert into dd_cr_private.publication_events(
    paper_id,actor_id,event_type,edition,consent_confirmed)
    values(p_paper_id,v_actor,'withdraw',p_expected_edition,true);
  return pg_catalog.jsonb_build_object(
    'paper_id',p_paper_id,'edition',p_expected_edition,'status','withdrawn');
end
$fn$;
revoke all on function dd_cr_private.withdraw_paper(uuid,integer,boolean)
  from public,anon,authenticated;
grant execute on function dd_cr_private.withdraw_paper(uuid,integer,boolean)
  to authenticated;

-- PostgREST-visible wrappers have only INVOKER permissions.
-- Never expose dd_cr_private in Supabase Data API schema configuration.
create function public.dd_cr_publish_copy(
  p_draft_id uuid,
  p_expected_revision integer,
  p_confirm_publication boolean,
  p_paper_id uuid default null,
  p_expected_edition integer default null
) returns jsonb
language sql security invoker set search_path=''
as $fn$
 select dd_cr_private.publish_saved_copy(
   p_draft_id,p_expected_revision,p_confirm_publication,p_paper_id,p_expected_edition);
$fn$;
revoke all on function public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)
  from public,anon,authenticated;
grant execute on function public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)
  to authenticated;

create function public.dd_cr_withdraw_paper(
  p_paper_id uuid,
  p_expected_edition integer,
  p_confirm_withdrawal boolean
) returns jsonb
language sql security invoker set search_path=''
as $fn$
 select dd_cr_private.withdraw_paper(
   p_paper_id,p_expected_edition,p_confirm_withdrawal);
$fn$;
revoke all on function public.dd_cr_withdraw_paper(uuid,integer,boolean)
  from public,anon,authenticated;
grant execute on function public.dd_cr_withdraw_paper(uuid,integer,boolean)
  to authenticated;

-- No direct grants for ordinary clients to write paper or edition rows.
-- No seed publications, accounts, posts, votes, comments, or reports created.
-- No automatic imports; source draft can be deleted independently of its public
-- published copy (mapping then disappears, public edition remains until withdrawn).


-- M04 | MY RESEARCH RECOVERY API — DESIGN ONLY / NO PRODUCTION DEPLOYMENT
-- Apply AFTER M02 and M03 *only* on disposable PostgreSQL in GitHub CI.
-- Exposes no private W.NE file, raw vote identity, actor email or audit events.
-- Do not expose dd_cr_private as a Supabase Data API schema.
-- Existing M03 owner-verified published/withdrawn editions remain immutable.

create function dd_cr_private.list_my_papers(p_limit integer default 20,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_actor uuid:=auth.uid();
 v_result jsonb;
begin
 if v_actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
   raise exception 'Registered account required for My Research' using errcode='42501';
 end if;
 if p_limit is null or p_limit<1 or p_limit>25 or
    p_offset is null or p_offset<0 or p_offset>500 then
   raise exception 'Invalid My Research page bounds' using errcode='22023';
 end if;
 -- The caller NEVER supplies an author ID. We filter by the verified token.
 -- Include withdrawn and draft-deleted/orphan papers so a lost browser tab
 -- cannot make a previously published work disappear from author history.
 select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)
    order by x.published_at desc,x.paper_id desc),'[]'::jsonb)
 into v_result
 from (
  select p.id as paper_id,l.draft_id,p.status,p.current_edition,
         p.published_at,p.changed_at,e.title,e.abstract,e.paper_type,
         pg_catalog.cardinality(e.source_urls) as source_count
  from public.dd_cr_publications p
  join public.dd_cr_editions e on e.paper_id=p.id and e.edition=p.current_edition
  left join dd_cr_private.draft_papers l on l.paper_id=p.id
  where p.author_id=v_actor
  order by p.published_at desc,p.id desc
  limit p_limit offset p_offset
 ) as x;
 return v_result;
end
$fn$;
revoke all on function dd_cr_private.list_my_papers(integer,integer) from public,anon,authenticated;
grant execute on function dd_cr_private.list_my_papers(integer,integer) to authenticated;

-- Public RPC wrapper is SECURITY INVOKER, not an RLS bypass.
create function public.dd_cr_my_papers(p_limit integer default 20,p_offset integer default 0)
returns jsonb language sql security invoker set search_path=''
as $fn$
 select dd_cr_private.list_my_papers(p_limit,p_offset);
$fn$;
revoke all on function public.dd_cr_my_papers(integer,integer) from public,anon,authenticated;
grant execute on function public.dd_cr_my_papers(integer,integer) to authenticated;

-- Do NOT grant client SELECT on dd_cr_private.draft_papers or events.
-- Public published paper / edition reads and own withdrawn reads remain
-- governed by M02 RLS; no new broad read/write policy is introduced.
-- TEMPORARY PILOT LOCK: No website member, guest or anonymous session can
-- query, save drafts, publish, vote, comment, flag, withdraw or browse My Research.
-- Do not remove until an explicit allowlisted-account RLS pilot is independently tested.
REVOKE ALL ON TABLE
 public.dd_cr_drafts,public.dd_cr_publications,public.dd_cr_editions,
 public.dd_cr_votes,public.dd_cr_comments,public.dd_cr_reports
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA dd_cr_private FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA dd_cr_private FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SCHEMA dd_cr_private FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION
 public.dd_cr_links_ok(text[]),
 public.dd_cr_guard_draft(),
 public.dd_cr_guard_vote(),
 public.dd_cr_comment_parent_guard(),
 public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer),
 public.dd_cr_withdraw_paper(uuid,integer,boolean),
 public.dd_cr_my_papers(integer,integer)
 FROM PUBLIC,anon,authenticated;
DO $assert$
BEGIN
 IF (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename LIKE 'dd_cr_%')<>6
 OR (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname='dd_cr_private')<>2
 THEN RAISE EXCEPTION 'Unexpected Community Research table count'; END IF;
 IF has_table_privilege('authenticated','public.dd_cr_drafts','SELECT')
 OR has_table_privilege('authenticated','public.dd_cr_drafts','INSERT')
 OR has_table_privilege('authenticated','public.dd_cr_publications','SELECT')
 OR has_table_privilege('anon','public.dd_cr_editions','SELECT')
 OR has_table_privilege('authenticated','public.dd_cr_comments','INSERT')
 OR has_schema_privilege('authenticated','dd_cr_private','USAGE')
 OR has_function_privilege('authenticated','public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)','EXECUTE')
 OR has_function_privilege('anon','public.dd_cr_my_papers(integer,integer)','EXECUTE')
 THEN RAISE EXCEPTION 'Locked schema still exposes unfinished Community Research'; END IF;
 IF (SELECT count(*) FROM public.dd_cr_drafts)<>0
 OR (SELECT count(*) FROM public.dd_cr_publications)<>0
 OR (SELECT count(*) FROM public.dd_cr_editions)<>0
 THEN RAISE EXCEPTION 'Unexpected Community Research data introduced'; END IF;
END $assert$;
COMMIT;
SELECT (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename LIKE 'dd_cr_%') AS public_research_tables,
       (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname='dd_cr_private') AS private_research_tables,
       NOT has_table_privilege('authenticated','public.dd_cr_drafts','SELECT') AS member_drafts_api_closed,
       NOT has_function_privilege('authenticated','public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)','EXECUTE') AS publish_rpc_closed,
       NOT has_schema_privilege('authenticated','dd_cr_private','USAGE') AS private_schema_closed;
