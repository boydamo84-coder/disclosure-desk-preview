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
