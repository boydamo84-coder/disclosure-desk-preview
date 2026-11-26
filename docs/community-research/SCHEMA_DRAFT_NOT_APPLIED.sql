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
 status text not null default 'pending' check(status in ('pending','published','flagged','rejected','withdrawn')),
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
-- Initial insert policy is replaced below by the checked revision trigger.
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
-- Second-stage draft: privileged operations are in a non-exposed schema.
create schema dd_cr_private;
revoke all on schema dd_cr_private from public,anon,authenticated;
grant usage on schema dd_cr_private to authenticated;
create table dd_cr_private.audit (
 id bigint generated always as identity primary key,
 actor uuid not null,
 report_id uuid not null references public.dd_cr_submissions(id),
 action text not null,
 reason text not null default '',
 occurred_at timestamptz not null default clock_timestamp()
);
alter table dd_cr_private.audit enable row level security;
revoke all on dd_cr_private.audit from public,anon,authenticated;
alter table public.dd_cr_submissions add column version_no integer not null default 1 check(version_no between 1 and 100);
grant select(version_no) on public.dd_cr_submissions to anon,authenticated;
alter table public.dd_cr_submissions add column flag_round integer not null default 1 check(flag_round>0);
create table dd_cr_private.flags (
 report_id uuid not null references public.dd_cr_submissions(id),
 flag_round integer not null,
 reporter uuid not null,
 reason text not null check(char_length(btrim(reason)) between 1 and 1000),
 created_at timestamptz not null default clock_timestamp(),
 primary key(report_id,flag_round,reporter)
);
create index dd_cr_flags_reporter_time on dd_cr_private.flags(reporter,created_at);
alter table dd_cr_private.flags enable row level security;
revoke all on dd_cr_private.flags from public,anon,authenticated;
create unique index dd_cr_one_successor on public.dd_cr_submissions(revision_of)
 where revision_of is not null and status in ('pending','published','flagged');
-- Resolve identity from the authenticated session only; no client UUID accepted.
create function dd_cr_private.member()
returns uuid language plpgsql stable set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or coalesce(auth.jwt()->>'is_anonymous','true')<>'false' then
  raise exception 'Member access required' using errcode='42501';
 end if;
 return actor;
end $$;
create function dd_cr_private.owner()
returns uuid language plpgsql stable set search_path='' as $$
declare actor uuid:=dd_cr_private.member();
begin
 if not exists(select 1 from public.dd_forum_owner_admins a where a.user_id=actor) then
  raise exception 'Moderator access required' using errcode='42501';
 end if;
 return actor;
end $$;
-- Serialize operations per author (including review and whole-chain withdrawal).
create function dd_cr_private.before_submit()
returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid:=dd_cr_private.member(); parent public.dd_cr_submissions%rowtype;
begin
 if new.author_id<>actor or new.status<>'pending' then raise exception 'Invalid submission identity or status' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,93271));
 if (select count(*) from public.dd_cr_submissions where author_id=actor and created_at>now()-interval '24 hours')>=5 then
  raise exception 'Daily submission limit reached';
 end if;
 if new.revision_of is not null then
  select * into parent from public.dd_cr_submissions where id=new.revision_of and author_id=actor and status='published';
  if not found then raise exception 'Revision requires your own published version' using errcode='42501'; end if;
  new.version_no:=parent.version_no+1;
 else new.version_no:=1;
 end if;
 -- Explicit text-only submissions become public after the consent and validation constraints pass.
 new.status:='published';
 return new;
end $$;
create trigger dd_cr_check_submission before insert on public.dd_cr_submissions for each row execute function dd_cr_private.before_submit();
drop policy dd_cr_submit on public.dd_cr_submissions;
create policy dd_cr_submit on public.dd_cr_submissions for insert to authenticated
 with check(author_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false' and status='published');
-- One flag per genuine signed-in member per review round. No self-flags.
-- Per-reporter and per-author transaction locks prevent threshold races and repeat spam.
create function dd_cr_private.flag(p_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=dd_cr_private.member(); item public.dd_cr_submissions%rowtype; tally integer; added integer;
begin
 if p_reason is null or char_length(btrim(p_reason)) not between 1 and 1000 then raise exception 'Flag reason required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,93272));
 select * into item from public.dd_cr_submissions where id=p_id;
 if not found or item.author_id=actor then raise exception 'Cannot flag this research' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(item.author_id::text,93271));
 select * into item from public.dd_cr_submissions where id=p_id for update;
 if item.status<>'published' then raise exception 'Research is not publicly available' using errcode='42501'; end if;
 if exists(select 1 from dd_cr_private.flags f where f.report_id=p_id and f.flag_round=item.flag_round and f.reporter=actor) then
  return jsonb_build_object('accepted',false,'hidden',false);
 end if;
 if (select count(*) from dd_cr_private.flags where reporter=actor and created_at>now()-interval '24 hours')>=10 then raise exception 'Daily flag limit reached'; end if;
 insert into dd_cr_private.flags(report_id,flag_round,reporter,reason) values(p_id,item.flag_round,actor,btrim(p_reason)) on conflict do nothing;
 get diagnostics added=row_count;
 select count(*)::integer into tally from dd_cr_private.flags where report_id=p_id and flag_round=item.flag_round;
 if tally>=5 then
  update public.dd_cr_submissions set status='flagged' where id=p_id;
  insert into dd_cr_private.audit(actor,report_id,action,reason) values(actor,p_id,'auto_hide','Five distinct member flags');
 end if;
 return jsonb_build_object('accepted',added=1,'hidden',tally>=5);
end $$;
create function dd_cr_private.review(p_id uuid,p_action text,p_reason text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=dd_cr_private.owner(); item public.dd_cr_submissions%rowtype; next_state text;
begin
 if p_action not in ('restore','reject') or p_action is null or p_reason is null or char_length(btrim(p_reason)) not between 1 and 1000 then raise exception 'Review action and reason required'; end if;
 select * into item from public.dd_cr_submissions where id=p_id;
 if not found or item.author_id=actor then raise exception 'Cannot review this submission' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(item.author_id::text,93271));
 select * into item from public.dd_cr_submissions where id=p_id for update;
 if item.status<>'flagged' then raise exception 'Submission is not pending flag review'; end if;
 next_state:=case when p_action='restore' then 'published' else 'rejected' end;
 -- Restoring starts a fresh review round; old flags are retained for audit, not counted twice.
 update public.dd_cr_submissions set status=next_state,reviewed_at=now(),flag_round=flag_round+case when p_action='restore' then 1 else 0 end where id=p_id;
 insert into dd_cr_private.audit(actor,report_id,action,reason) values(actor,p_id,p_action,btrim(p_reason));
 return true;
end $$;
create function dd_cr_private.withdraw(p_id uuid,p_reason text)
returns integer language plpgsql security definer set search_path='' as $$
declare actor uuid:=dd_cr_private.member(); item public.dd_cr_submissions%rowtype; root_id uuid; changed integer;
begin
 if p_reason is null or char_length(btrim(p_reason)) not between 1 and 1000 then raise exception 'Withdrawal reason required'; end if;
 select * into item from public.dd_cr_submissions where id=p_id;
 if not found or (item.author_id<>actor and not exists(select 1 from public.dd_forum_owner_admins where user_id=actor)) then raise exception 'Withdrawal access required' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(item.author_id::text,93271));
 with recursive ancestors as (
  select id,revision_of from public.dd_cr_submissions where id=p_id
  union all select p.id,p.revision_of from public.dd_cr_submissions p join ancestors a on p.id=a.revision_of
 ) select id into root_id from ancestors where revision_of is null;
 with recursive chain as (
  select id from public.dd_cr_submissions where id=root_id
  union all select p.id from public.dd_cr_submissions p join chain c on p.revision_of=c.id
 ) update public.dd_cr_submissions set status='withdrawn',reviewed_at=now()
 where id in(select id from chain) and status in ('pending','published','flagged');
 get diagnostics changed=row_count;
 if changed>0 then insert into dd_cr_private.audit(actor,report_id,action,reason) values(actor,root_id,'withdraw_chain',btrim(p_reason)); end if;
 return changed;
end $$;
create function dd_cr_private.queue()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform dd_cr_private.owner();
 return (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at),'[]'::jsonb) from
 (select p.id,p.author_label,p.title,p.abstract,p.category,p.body_text,p.references_text,p.version_no,p.revision_of,p.created_at,
 (select count(*) from dd_cr_private.flags f where f.report_id=p.id and f.flag_round=p.flag_round) as flag_count,
 (select coalesce(jsonb_agg(f.reason order by f.created_at),'[]'::jsonb) from dd_cr_private.flags f where f.report_id=p.id and f.flag_round=p.flag_round) as flag_reasons
 from public.dd_cr_submissions p where p.status='flagged' order by p.created_at limit 30) s);
end $$;
-- Only invoker wrappers are exposed via the public API. Underlying private helpers
-- independently check authenticated identity and authorization; no default public EXECUTE.
create function public.dd_cr_flag(p_id uuid,p_reason text)
returns jsonb language sql security invoker set search_path='' as $$select dd_cr_private.flag(p_id,p_reason)$$;
create function public.dd_cr_review(p_id uuid,p_action text,p_reason text)
returns boolean language sql security invoker set search_path='' as $$select dd_cr_private.review(p_id,p_action,p_reason)$$;
create function public.dd_cr_withdraw(p_id uuid,p_reason text)
returns integer language sql security invoker set search_path='' as $$select dd_cr_private.withdraw(p_id,p_reason)$$;
create function public.dd_cr_moderation_queue()
returns jsonb language sql stable security invoker set search_path='' as $$select dd_cr_private.queue()$$;
revoke all on all functions in schema dd_cr_private from public,anon,authenticated;
grant execute on function dd_cr_private.flag(uuid,text),dd_cr_private.review(uuid,text,text),dd_cr_private.withdraw(uuid,text),dd_cr_private.queue() to authenticated;
revoke all on function public.dd_cr_flag(uuid,text),public.dd_cr_review(uuid,text,text),public.dd_cr_withdraw(uuid,text),public.dd_cr_moderation_queue() from public,anon,authenticated;
grant execute on function public.dd_cr_flag(uuid,text),public.dd_cr_review(uuid,text,text),public.dd_cr_withdraw(uuid,text),public.dd_cr_moderation_queue() to authenticated;

-- Remaining gates: server-derived profile labels, comment/reaction rate limits,
-- profile verification/anti-brigading, pagination, UI wiring and genuine account tests.
-- Do not expose this draft on a live project until those gates pass.
commit;
