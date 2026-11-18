-- Community Research M07: ACTIVE TESTER ALLOWLIST ON EXISTING SUPABASE. NEVER A PUBLIC LAUNCH.
-- Based on the installed M06 sealed schema. No user emails or account IDs embedded in GitHub.
-- Creates NO public content; default pilot roster EMPTY (fail closed).
-- User-selected test identities are inserted separately through an audited Supabase operation.
-- NOT FOR CHANGING OTHER WEBSITE TABLES, LOGINS, W.NE DOCUMENTS OR OTHER AUTH DETAILS.
begin;
set local statement_timeout='60s';
set local lock_timeout='3s';
do $guard$
begin
 if to_regclass('public.dd_cr_drafts') is null
 or to_regclass('public.dd_cr_publications') is null
 or to_regnamespace('dd_cr_private') is null
 or to_regclass('dd_cr_private.pilot_members') is not null
 then raise exception 'M07 requires exactly the sealed M06 tables and no existing pilot roster'; end if;
 if has_table_privilege('authenticated','public.dd_cr_drafts','SELECT')
 or has_function_privilege('authenticated','public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)','EXECUTE')
 then raise exception 'M06 access seal is not intact; abort M07'; end if;
end $guard$;

create table dd_cr_private.pilot_members(
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true,
 enrolled_at timestamptz not null default now()
);
alter table dd_cr_private.pilot_members enable row level security;
revoke all on table dd_cr_private.pilot_members from public,anon,authenticated;

-- No way for users to self-enrol. The function runs as database owner and
-- only tests auth.uid() against admin-maintained private roster.
create function dd_cr_private.is_pilot()
returns boolean language sql stable security definer set search_path=''
as $fn$
 select auth.uid() is not null
 and coalesce(auth.jwt()->>'is_anonymous','false') <> 'true'
 and exists(select 1 from dd_cr_private.pilot_members x
            where x.user_id=auth.uid() and x.active);
$fn$;
revoke all on function dd_cr_private.is_pilot() from public,anon,authenticated;
grant usage on schema dd_cr_private to authenticated;
grant execute on function dd_cr_private.is_pilot() to authenticated;

-- Defensive restrictive policies AND with the existing M02 row ownership policies.
-- No user ID supplied by the browser can bypass this additional test.
create policy dd_cr_m07_pilot_member on public.dd_cr_drafts as restrictive for all to authenticated
 using ((select dd_cr_private.is_pilot())) with check ((select dd_cr_private.is_pilot()));
create policy dd_cr_m07_pilot_member on public.dd_cr_publications as restrictive for all to authenticated
 using ((select dd_cr_private.is_pilot())) with check ((select dd_cr_private.is_pilot()));
create policy dd_cr_m07_pilot_member on public.dd_cr_editions as restrictive for all to authenticated
 using ((select dd_cr_private.is_pilot())) with check ((select dd_cr_private.is_pilot()));
create policy dd_cr_m07_pilot_member on public.dd_cr_votes as restrictive for all to authenticated
 using ((select dd_cr_private.is_pilot())) with check ((select dd_cr_private.is_pilot()));
create policy dd_cr_m07_pilot_member on public.dd_cr_comments as restrictive for all to authenticated
 using ((select dd_cr_private.is_pilot())) with check ((select dd_cr_private.is_pilot()));
create policy dd_cr_m07_pilot_member on public.dd_cr_reports as restrictive for all to authenticated
 using ((select dd_cr_private.is_pilot())) with check ((select dd_cr_private.is_pilot()));

-- Update all privileged routines to VERIFY the server-side pilot roster.
create or replace function dd_cr_private.publish_saved_copy(
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
  if v_actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' or not dd_cr_private.is_pilot() then
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

create or replace function dd_cr_private.withdraw_paper(
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
  if v_actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' or not dd_cr_private.is_pilot() then
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

create or replace function dd_cr_private.list_my_papers(p_limit integer default 20,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_actor uuid:=auth.uid();
 v_result jsonb;
begin
 if v_actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' or not dd_cr_private.is_pilot() then
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

-- Only limited draft + paper-read functions open to authenticated Postgres role.
-- RLS and the SECURITY DEFINER roster guard still deny all nonpilot accounts.
-- No comments, votes or moderation writes in this pilot.
grant select,delete on table public.dd_cr_drafts to authenticated;
grant insert(title,abstract,body,paper_type,source_urls) on table public.dd_cr_drafts to authenticated;
grant update(title,abstract,body,paper_type,source_urls) on table public.dd_cr_drafts to authenticated;
grant select on table public.dd_cr_publications,public.dd_cr_editions to authenticated;
grant execute on function public.dd_cr_links_ok(text[]) to authenticated;
grant execute on function dd_cr_private.publish_saved_copy(uuid,integer,boolean,uuid,integer),
 dd_cr_private.withdraw_paper(uuid,integer,boolean),
 dd_cr_private.list_my_papers(integer,integer) to authenticated;
grant execute on function public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer),
 public.dd_cr_withdraw_paper(uuid,integer,boolean),
 public.dd_cr_my_papers(integer,integer) to authenticated;

-- Do not touch existing site grants, site role profiles, sessions, or Auth configuration.
-- Publication is only visible to allowlisted testers; other members see no papers.
do $verify$
begin
 if (select count(*) from dd_cr_private.pilot_members)<>0 then
  raise exception 'Pilot roster must start empty';end if;
 if has_table_privilege('anon','public.dd_cr_drafts','SELECT')
 or has_table_privilege('anon','public.dd_cr_editions','SELECT')
 or has_function_privilege('anon','public.dd_cr_my_papers(integer,integer)','EXECUTE')
 or has_table_privilege('authenticated','public.dd_cr_votes','INSERT')
 or has_table_privilege('authenticated','public.dd_cr_comments','INSERT')
 or has_table_privilege('authenticated','public.dd_cr_reports','INSERT')
 or has_table_privilege('authenticated','dd_cr_private.pilot_members','SELECT')
 then raise exception 'Pilot privilege boundary too broad';end if;
 if (select count(*) from public.dd_cr_drafts)<>0
 or (select count(*) from public.dd_cr_publications)<>0
 then raise exception 'Unexpected researcher data at M07 activation';end if;
end $verify$;
commit;
-- DBA-only cross-check; this does not impersonate or log in as a member.
select (select count(*) from dd_cr_private.pilot_members) as enrolled_pilots,
 (select count(*) from public.dd_cr_drafts) as existing_drafts,
 (select count(*) from public.dd_cr_publications) as existing_papers,
 not has_table_privilege('anon','public.dd_cr_editions','SELECT') as public_read_locked,
 not has_table_privilege('authenticated','dd_cr_private.pilot_members','SELECT') as roster_read_locked;
