-- STAGED: Disclosure Desk public witness reports, community flags and shared vote APIs.
-- Review and run as ONE additive migration on existing Disclosure Desk Supabase ONLY.
-- Not applied by this GitHub commit; original Boards, comments and W.NE tables remain untouched.
-- Defaults: 3 witness submissions / rolling 24h, auto-publish, hide after 5 unique flags,
-- 1 like/dislike per authenticated, registered (non-anonymous) account per item.

create table if not exists public.dd_witness_reports (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 category text not null check (category in ('UAP / lights','Unusual drones','Unexplained encounter','Animal-related mystery','Other unexplained experience')),
 event_date date not null,
 approximate_time time without time zone,
 city text not null check (char_length(btrim(city)) between 2 and 80 and city !~ '[0-9@]'),
 country text not null check (char_length(btrim(country)) between 2 and 80 and country !~ '[0-9@]'),
 story text not null check (char_length(btrim(story)) between 25 and 3500),
 anonymous boolean not null default true,
 -- City centre from server-side place-name lookup only; do not collect GPS or addresses.
 -- Server trigger further rounds every coordinate to 0.1 degree (~11km north/south).
 lat numeric(5,2) not null check (lat between -90 and 90),
 lon numeric(5,2) not null check (lon between -180 and 180),
 status text not null default 'published' check (status in ('published','hidden','removed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 hidden_at timestamptz
);
create index if not exists dd_witness_public_created on public.dd_witness_reports(created_at desc) where status='published';
create index if not exists dd_witness_author_time on public.dd_witness_reports(author_id,created_at desc);

create table if not exists public.dd_witness_report_flags (
 report_id uuid not null references public.dd_witness_reports(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check (reason in ('spam','abuse','privacy','harassment','other')),
 created_at timestamptz not null default now(),
 primary key(report_id,reporter_id)
);
create index if not exists dd_witness_flags_time on public.dd_witness_report_flags(reporter_id,created_at desc);

-- Polymorphic votes do not expose individual voter identities.
-- RPCs below are the only permitted path; total counts are returned without voter lists.
create table if not exists public.dd_content_votes (
 target_kind text not null check (target_kind in ('witness','comment')),
 target_id uuid not null,
 voter_id uuid not null references auth.users(id) on delete cascade,
 value smallint not null check (value in (-1,1)),
 updated_at timestamptz not null default now(),
 primary key(target_kind,target_id,voter_id)
);
create index if not exists dd_content_vote_counts on public.dd_content_votes(target_kind,target_id,value);

alter table public.dd_witness_reports enable row level security;
alter table public.dd_witness_report_flags enable row level security;
alter table public.dd_content_votes enable row level security;
revoke all on table public.dd_witness_reports,public.dd_witness_report_flags,public.dd_content_votes from public,anon,authenticated;
grant select on public.dd_witness_reports to authenticated;
-- Report creation is server-geocoded by our Edge Function with a service-role credential.
-- Never grant browser direct INSERT: that would allow fabricated latitude/longitude.
-- The public read-only view omits author identity and hidden reports.
grant insert on public.dd_witness_report_flags to authenticated;

drop policy if exists dd_witness_public_select on public.dd_witness_reports;
create policy dd_witness_public_select on public.dd_witness_reports for select to authenticated
 using ((select auth.uid())=author_id);

-- Public projection never contains author_id, private flags or moderation metadata.
-- Unlike a definer view, this is a real RLS-protected table with a strict column set.
create table if not exists public.dd_public_witness_reports (
 id uuid primary key references public.dd_witness_reports(id) on delete cascade,
 category text not null,
 event_date date not null,
 approximate_time time without time zone,
 city text not null,
 country text not null,
 story text not null,
 anonymous boolean not null default true,
 lat numeric(5,2) not null,
 lon numeric(5,2) not null,
 created_at timestamptz not null
);
create index if not exists dd_public_witness_recent on public.dd_public_witness_reports(created_at desc);
alter table public.dd_public_witness_reports enable row level security;
revoke all on table public.dd_public_witness_reports from public,anon,authenticated;
grant select on public.dd_public_witness_reports to anon,authenticated;
drop policy if exists dd_public_witness_read on public.dd_public_witness_reports;
create policy dd_public_witness_read on public.dd_public_witness_reports
 for select to anon,authenticated using (true);

-- Internal sync runs only on trusted DB changes; public users cannot write projection.
create or replace function public.dd_sync_public_witness()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='published' then
  insert into public.dd_public_witness_reports
   (id,category,event_date,approximate_time,city,country,story,anonymous,lat,lon,created_at)
  values(new.id,new.category,new.event_date,new.approximate_time,new.city,new.country,
    new.story,new.anonymous,new.lat,new.lon,new.created_at)
  on conflict(id) do update set category=excluded.category,
    event_date=excluded.event_date,approximate_time=excluded.approximate_time,
    city=excluded.city,country=excluded.country,story=excluded.story,
    anonymous=excluded.anonymous,lat=excluded.lat,lon=excluded.lon,
    created_at=excluded.created_at;
 else
  delete from public.dd_public_witness_reports where id=new.id;
 end if;
 return new;
end $$;
drop trigger if exists dd_witness_sync_public on public.dd_witness_reports;
create trigger dd_witness_sync_public after insert or update on public.dd_witness_reports
for each row execute function public.dd_sync_public_witness();

drop policy if exists dd_witness_owner_insert on public.dd_witness_reports;
-- Intentionally NO authenticated/anon INSERT policy on reports.
-- Only the Edge Function's private service-role client may create a new record.
drop policy if exists dd_witness_flag_owner_read on public.dd_witness_report_flags;
-- The flagging table is not publicly queryable; unique reports are counted privately.
-- Clients receive confirmation from INSERT, not a public list of who reported.
-- A private eligibility check avoids disclosing author IDs to other viewers.
create or replace function public.dd_witness_can_flag(p_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and exists (select 1 from public.dd_witness_reports r
    where r.id=p_id and r.status='published' and r.author_id<>auth.uid())
$$;
revoke all on function public.dd_witness_can_flag(uuid) from public,anon;
grant execute on function public.dd_witness_can_flag(uuid) to authenticated;

drop policy if exists dd_witness_flag_submit on public.dd_witness_report_flags;
create policy dd_witness_flag_submit on public.dd_witness_report_flags for insert to authenticated
 with check (
  reporter_id=(select auth.uid())
  and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and public.dd_witness_can_flag(report_id)
 );

-- Admission guard runs on the database, not in JavaScript.
create or replace function public.dd_witness_report_guard()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if current_user <> 'service_role' or new.author_id is null then
  raise exception 'Reports may only be published by the verified server';
 end if;
 -- The Edge Function verifies the user's bearer token, resolves the typed city
 -- and sets author_id. The service role is never available to a browser.
 perform pg_advisory_xact_lock(hashtext('witness:'||new.author_id::text));
 if (select count(*) from public.dd_witness_reports r
     where r.author_id=new.author_id and r.created_at>now()-interval '24 hours')>=3 then
  raise exception 'Witness report limit reached: maximum 3 in a rolling 24-hour period';
 end if;
 if new.event_date>current_date then raise exception 'Event date cannot be in the future';end if;
 if new.city~'[0-9@]' or new.country~'[0-9@]'
    or new.city~* '\m(street|st\.|road|rd\.|lane|postcode|zip|apartment|building|house|flat)\M'
    or new.story~* '[A-Za-z0-9_.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
    or new.story~* '\m[0-9]{1,5}[[:space:]]+[A-Za-z]+[[:space:]]+(street|road|lane|avenue|drive|place)\M'
    or new.story~* '\m[A-Z]{1,2}[0-9][A-Z0-9]?[[:space:]]*[0-9][A-Z]{2}\M' then
  raise exception 'Please remove identifying location or contact information before publishing';
 end if;
 new.city=btrim(new.city);
 new.country=btrim(new.country);
 new.story=btrim(new.story);
 new.lat=round(new.lat*10)/10;
 new.lon=round(new.lon*10)/10;
 new.created_at=now();
 new.updated_at=now();
 new.status='published';
 new.hidden_at=null;
 return new;
end $$;
drop trigger if exists dd_witness_guard_before_insert on public.dd_witness_reports;
create trigger dd_witness_guard_before_insert before insert on public.dd_witness_reports
for each row execute function public.dd_witness_report_guard();

-- Limit malicious mass flagging. Each individual report can only be flagged once.
create or replace function public.dd_witness_flag_guard()
returns trigger language plpgsql security definer set search_path=public as $
begin
 if new.reporter_id is distinct from auth.uid() or auth.uid() is null
    or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true then
  raise exception 'A registered account is required to flag';
 end if;
 perform pg_advisory_xact_lock(hashtext('witness-flag-user:'||new.reporter_id::text));
 if (select count(*) from public.dd_witness_report_flags f
    where f.reporter_id=new.reporter_id
      and f.created_at>now()-interval '1 hour')>=20 then
  raise exception 'Flagging limit reached. Try again later';
 end if;
 new.created_at=now();
 return new;
end $;
drop trigger if exists dd_witness_flag_guard_before on public.dd_witness_report_flags;
create trigger dd_witness_flag_guard_before before insert on public.dd_witness_report_flags
for each row execute function public.dd_witness_flag_guard();

-- A flag from one account counts once, enforced by PK(report_id,reporter_id).
-- Five distinct flagging accounts temporarily hide the report from both public list/map.
create or replace function public.dd_witness_autohide()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtext('witness-flags:'||new.report_id::text));
 if (select count(*) from public.dd_witness_report_flags f where f.report_id=new.report_id)>=5 then
  update public.dd_witness_reports
   set status='hidden',hidden_at=now(),updated_at=now()
   where id=new.report_id and status='published';
 end if;
 return new;
end $$;
drop trigger if exists dd_witness_autohide_after_flag on public.dd_witness_report_flags;
create trigger dd_witness_autohide_after_flag after insert on public.dd_witness_report_flags
for each row execute function public.dd_witness_autohide();

-- The existing independent comment moderation allowlist decides who may restore/hide.
create or replace function public.dd_moderate_witness(p_id uuid,p_action text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not public.dd_is_comment_moderator() then
  raise exception 'Not authorised';
 end if;
 if p_action not in ('published','hidden','removed') then raise exception 'Invalid status'; end if;
 update public.dd_witness_reports set status=p_action,updated_at=now(),
 hidden_at=case when p_action='published' then null else coalesce(hidden_at,now()) end
 where id=p_id;
 if not found then raise exception 'Report not found';end if;
end $$;
revoke all on function public.dd_moderate_witness(uuid,text) from public,anon;
grant execute on function public.dd_moderate_witness(uuid,text) to authenticated;

-- Individual votes are private; the functions only return totals + YOUR own vote.
create or replace function public.dd_vote_set(p_kind text,p_id uuid,p_value smallint)
returns table(likes bigint,dislikes bigint,my_vote smallint)
language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();
begin
 if v_uid is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=true then
  raise exception 'Sign in to vote';
 end if;
 if p_kind not in ('witness','comment') or p_id is null or p_value not in (-1,0,1) then
  raise exception 'Invalid vote';
 end if;
 if not (
   (p_kind='witness' and exists(select 1 from public.dd_witness_reports w where w.id=p_id and w.status='published'))
   or (p_kind='comment' and exists(select 1 from public.dd_case_comments c where c.id=p_id and c.status='approved'))
 ) then
  raise exception 'Item is not available for voting';
 end if;
 perform pg_advisory_xact_lock(hashtext('vote:'||v_uid::text||':'||p_kind||':'||p_id::text));
 if p_value=0 then
  delete from public.dd_content_votes v
   where v.voter_id=v_uid and v.target_kind=p_kind and v.target_id=p_id;
 else
  insert into public.dd_content_votes(target_kind,target_id,voter_id,value)
  values(p_kind,p_id,v_uid,p_value)
  on conflict(target_kind,target_id,voter_id)
  do update set value=excluded.value,updated_at=now();
 end if;
 return query
 select count(*) filter(where v.value=1),count(*) filter(where v.value=-1),
        coalesce(max(v.value) filter(where v.voter_id=v_uid),0)::smallint
 from public.dd_content_votes v where v.target_kind=p_kind and v.target_id=p_id;
end $$;
revoke all on function public.dd_vote_set(text,uuid,smallint) from public,anon;
grant execute on function public.dd_vote_set(text,uuid,smallint) to authenticated;

create or replace function public.dd_vote_summary(p_kind text,p_ids uuid[])
returns table(target_id uuid,likes bigint,dislikes bigint,my_vote smallint)
language plpgsql stable security definer set search_path=public as $$
begin
 if p_kind not in ('witness','comment') or p_ids is null or cardinality(p_ids)>100 then
  raise exception 'Invalid vote summary request';
 end if;
 return query
 select requested.id,
   count(v.*) filter(where v.value=1),
   count(v.*) filter(where v.value=-1),
   coalesce(max(v.value) filter(where v.voter_id=auth.uid()),0)::smallint
 from (select distinct unnest(p_ids) as id) requested
 left join public.dd_content_votes v on v.target_kind=p_kind and v.target_id=requested.id
 where (p_kind='witness' and exists(select 1 from public.dd_witness_reports w where w.id=requested.id and w.status='published'))
    or (p_kind='comment' and exists(select 1 from public.dd_case_comments c where c.id=requested.id and c.status='approved'))
 group by requested.id;
end $$;
revoke all on function public.dd_vote_summary(text,uuid[]) from public;
grant execute on function public.dd_vote_summary(text,uuid[]) to anon,authenticated;

-- Avoid old orphan vote records when a comment or witness report is deleted.
create or replace function public.dd_delete_target_votes()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 delete from public.dd_content_votes v
 where v.target_id=old.id and v.target_kind=tg_argv[0];
 return old;
end $$;
drop trigger if exists dd_witness_delete_votes on public.dd_witness_reports;
create trigger dd_witness_delete_votes after delete on public.dd_witness_reports
for each row execute function public.dd_delete_target_votes('witness');
drop trigger if exists dd_comment_delete_votes on public.dd_case_comments;
create trigger dd_comment_delete_votes after delete on public.dd_case_comments
for each row execute function public.dd_delete_target_votes('comment');
