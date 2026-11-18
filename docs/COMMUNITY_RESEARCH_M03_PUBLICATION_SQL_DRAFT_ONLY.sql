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
