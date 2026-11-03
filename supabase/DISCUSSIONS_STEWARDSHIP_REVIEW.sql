-- DISCLOSURE DESK — UNAPPLIED DISCUSSIONS / SECTION STEWARDSHIP REVIEW
-- TARGET: Disclosure Desk Supabase omqxizswzcwgzqaczlhe ONLY.
-- REVIEW SOURCE; NOT AN INSTALLED MIGRATION. DO NOT RUN ON PRODUCTION.
-- Requires isolated PostgreSQL/Supabase role/trigger/guest tests before applying.
-- Section creators organise and escalate. They cannot ban, preapprove, or remove
-- another author's content. Five DISTINCT registered flags only temporarily hide.
-- Owner admin enrolment must be performed separately; never hardcode user IDs.
begin;
create table if not exists public.dd_forum_sections(
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(btrim(title)) between 4 and 60),
 name_key text generated always as (lower(regexp_replace(title,'[^A-Za-z0-9]','','g'))) stored unique,
 description text not null default '' check(char_length(description)<=400),
 topic text not null default '' check(char_length(topic)<=40),
 creator_id uuid references auth.users(id) on delete set null,
 steward_id uuid references auth.users(id) on delete set null,
 status text not null default 'published' check(status in ('published','hidden','removed')),
 reviewed_flag_count integer not null default 0 check(reviewed_flag_count>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(char_length(name_key)>=3)
);
create index if not exists dd_forum_sections_created_idx on public.dd_forum_sections(created_at desc);

create table if not exists public.dd_forum_threads(
 id uuid primary key default gen_random_uuid(),
 section_id uuid not null references public.dd_forum_sections(id) on delete cascade,
 author_id uuid references auth.users(id) on delete set null,
 title text not null check(char_length(btrim(title)) between 4 and 150),
 body text not null default '' check(char_length(body)<=5000),
 link_url text check(link_url is null or char_length(link_url)<=1000),
 status text not null default 'published' check(status in ('published','hidden','removed')),
 is_pinned boolean not null default false,
 reviewed_flag_count integer not null default 0 check(reviewed_flag_count>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(char_length(btrim(body))>0 or link_url is not null)
);
create index if not exists dd_forum_threads_section_idx on public.dd_forum_threads(section_id,created_at desc);

create table if not exists public.dd_forum_replies(
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.dd_forum_threads(id) on delete cascade,
 parent_id uuid references public.dd_forum_replies(id) on delete set null,
 author_id uuid references auth.users(id) on delete set null,
 body text not null check(char_length(btrim(body)) between 2 and 2000),
 status text not null default 'published' check(status in ('published','hidden','removed')),
 reviewed_flag_count integer not null default 0 check(reviewed_flag_count>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(id is distinct from parent_id)
);
create index if not exists dd_forum_replies_thread_idx on public.dd_forum_replies(thread_id,created_at);

create table if not exists public.dd_forum_flags(
 target_kind text not null check(target_kind in ('thread','reply')),
 target_id uuid not null,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(reason in ('spam','abuse','privacy','harassment','harmful','other')),
 created_at timestamptz not null default now(),
 primary key(target_kind,target_id,reporter_id)
);
create index if not exists dd_forum_flags_author_idx on public.dd_forum_flags(reporter_id,created_at desc);

create table if not exists public.dd_forum_votes(
 target_kind text not null check(target_kind in ('thread','reply')),
 target_id uuid not null,
 voter_id uuid not null references auth.users(id) on delete cascade,
 value smallint not null check(value in (-1,1)),
 updated_at timestamptz not null default now(),
 primary key(target_kind,target_id,voter_id)
);
create index if not exists dd_forum_votes_target_idx on public.dd_forum_votes(target_kind,target_id,value);

create table if not exists public.dd_forum_escalations(
 id uuid primary key default gen_random_uuid(),
 section_id uuid not null references public.dd_forum_sections(id) on delete cascade,
 target_kind text not null check(target_kind in ('thread','reply')),
 target_id uuid not null,
 submitted_by uuid references auth.users(id) on delete set null,
 reason text not null check(char_length(btrim(reason)) between 10 and 500),
 status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now()
);

-- NOT inherited from section creators or the public-comment moderator table.
-- Seed site-owner IDs only via a separately authorised server-admin operation.
create table if not exists public.dd_forum_owner_admins(
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.dd_forum_audit(
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 section_id uuid references public.dd_forum_sections(id) on delete set null,
 action text not null,
 target_kind text not null,
 target_id uuid,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

-- Private write model + safe projection RPCs; do not expose raw author IDs.
alter table public.dd_forum_sections enable row level security;
alter table public.dd_forum_threads enable row level security;
alter table public.dd_forum_replies enable row level security;
alter table public.dd_forum_flags enable row level security;
alter table public.dd_forum_votes enable row level security;
alter table public.dd_forum_escalations enable row level security;
alter table public.dd_forum_owner_admins enable row level security;
alter table public.dd_forum_audit enable row level security;
revoke all on table
 public.dd_forum_sections,public.dd_forum_threads,public.dd_forum_replies,
 public.dd_forum_flags,public.dd_forum_votes,public.dd_forum_escalations,
 public.dd_forum_owner_admins,public.dd_forum_audit from PUBLIC,anon,authenticated;
grant all on table
 public.dd_forum_sections,public.dd_forum_threads,public.dd_forum_replies,
 public.dd_forum_flags,public.dd_forum_votes,public.dd_forum_escalations,
 public.dd_forum_owner_admins,public.dd_forum_audit to service_role;
-- No RLS policies grant browsers direct access; functions below enforce roles.

create or replace function public.dd_discussions_require_registered()
returns uuid language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 then raise exception 'Registered account required'; end if;
 if not exists(select 1 from auth.users u where u.id=actor and u.email_confirmed_at is not null)
 then raise exception 'Verified account required';end if;
 return actor;
end $$;

create or replace function public.dd_discussions_is_owner()
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null and exists(
  select 1 from public.dd_forum_owner_admins a where a.user_id=auth.uid()
 ) and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
$$;

create or replace function public.dd_discussions_sections(p_limit integer default 100)
returns table(id uuid,title text,slug text,description text,topic text,
 thread_count bigint,is_steward boolean,created_at timestamptz)
language sql stable security definer set search_path=pg_catalog,public as $$
 select s.id,s.title,
 lower(regexp_replace(btrim(s.title),'[^A-Za-z0-9]+','-','g')) as slug,
 s.description,s.topic,
 (select count(*) from public.dd_forum_threads t
  where t.section_id=s.id and t.status='published') as thread_count,
 (auth.uid() is not null and s.steward_id=auth.uid()) as is_steward,s.created_at
 from public.dd_forum_sections s where s.status='published'
 order by s.created_at desc limit least(greatest(coalesce(p_limit,50),1),100)
$$;

create or replace function public.dd_discussions_threads(
 p_section_id uuid,p_limit integer default 100,p_sort text default 'recent')
returns table(id uuid,title text,body text,link_url text,author_name text,
 is_pinned boolean,created_at timestamptz,likes bigint,dislikes bigint,is_mine boolean,my_vote smallint)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if p_section_id is null or coalesce(p_limit,0) not between 1 and 100
  or p_sort not in ('recent','active','top') then raise exception 'Invalid thread query';end if;
 return query select t.id,t.title,t.body,t.link_url,
  case when n.is_public then n.display_name else 'Community member' end,
  t.is_pinned,t.created_at,
  (select count(*) from public.dd_forum_votes v
    where v.target_kind='thread' and v.target_id=t.id and v.value=1),
  (select count(*) from public.dd_forum_votes v
    where v.target_kind='thread' and v.target_id=t.id and v.value=-1),
  coalesce(auth.uid()=t.author_id,false),
  coalesce((select v.value from public.dd_forum_votes v where
   v.target_kind='thread' and v.target_id=t.id and v.voter_id=auth.uid()),0)::smallint
 from public.dd_forum_threads t
 join public.dd_forum_sections s on s.id=t.section_id
 left join public.dd_public_names n on n.user_id=t.author_id
 where t.section_id=p_section_id and t.status='published' and s.status='published'
 order by t.is_pinned desc,
  case when p_sort='top' then
   (select count(*) from public.dd_forum_votes v where
    v.target_kind='thread' and v.target_id=t.id and v.value=1) end desc nulls last,
  case when p_sort='active' then t.updated_at end desc nulls last,
  t.created_at desc,t.id desc limit p_limit;
end $$;

create or replace function public.dd_discussions_replies(
 p_thread_id uuid,p_limit integer default 100)
returns table(id uuid,parent_id uuid,body text,author_name text,
 created_at timestamptz,likes bigint,dislikes bigint,is_mine boolean,my_vote smallint)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if p_thread_id is null or coalesce(p_limit,0) not between 1 and 100
 then raise exception 'Invalid replies query';end if;
 return query select r.id,r.parent_id,r.body,
  case when n.is_public then n.display_name else 'Community member' end,
  r.created_at,
  (select count(*) from public.dd_forum_votes v where
   v.target_kind='reply' and v.target_id=r.id and v.value=1),
  (select count(*) from public.dd_forum_votes v where
   v.target_kind='reply' and v.target_id=r.id and v.value=-1),
  coalesce(auth.uid()=r.author_id,false),
  coalesce((select v.value from public.dd_forum_votes v where
   v.target_kind='reply' and v.target_id=r.id and v.voter_id=auth.uid()),0)::smallint
 from public.dd_forum_replies r
 join public.dd_forum_threads t on t.id=r.thread_id
 join public.dd_forum_sections s on s.id=t.section_id
 left join public.dd_public_names n on n.user_id=r.author_id
 where r.thread_id=p_thread_id and r.status='published'
  and t.status='published' and s.status='published'
 order by r.created_at asc,r.id asc limit p_limit;
end $$;

create or replace function public.dd_discussions_create_section(
 p_title text,p_description text default '',p_topic text default '')
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); made uuid;
begin
 if p_title is null or char_length(btrim(p_title)) not between 4 and 60
  or btrim(p_title) !~ '^[A-Za-z][A-Za-z0-9 _-]*$'
  or coalesce(char_length(p_description),0)>400 or coalesce(char_length(p_topic),0)>40
 then raise exception 'Invalid section name, description or topic';end if;
 if not exists(select 1 from auth.users u where u.id=actor
  and u.created_at<=now()-interval '24 hours')
 then raise exception 'New accounts must be at least 24 hours old to create sections';end if;
 perform pg_advisory_xact_lock(hashtext('dd-forum-section:'||actor::text));
 if (select count(*) from public.dd_forum_sections s
  where s.creator_id=actor and s.created_at>now()-interval '24 hours')>=2
 then raise exception 'Maximum two new sections per account in 24 hours';end if;
 insert into public.dd_forum_sections(title,description,topic,creator_id,steward_id)
 values(btrim(p_title),btrim(coalesce(p_description,'')),btrim(coalesce(p_topic,'')),actor,actor)
 returning id into made;
 insert into public.dd_forum_audit(actor_id,section_id,action,target_kind,target_id)
 values(actor,made,'created_section','section',made);
 return made;
end $$;

create or replace function public.dd_discussions_create_thread(
 p_section_id uuid,p_title text,p_body text,p_url text default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); made uuid; url text:=nullif(btrim(p_url),'');
begin
 if p_section_id is null or p_title is null
  or char_length(btrim(p_title)) not between 4 and 150
  or coalesce(char_length(p_body),0)>5000
  or (char_length(btrim(coalesce(p_body,'')))=0 and url is null)
 then raise exception 'Invalid title or post';end if;
 if url is not null and (char_length(url)>1000
  or url !~* '^https?://[A-Za-z0-9][-A-Za-z0-9.]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$')
 then raise exception 'Invalid public source URL';end if;
 if not exists(select 1 from public.dd_forum_sections s
  where s.id=p_section_id and s.status='published')
 then raise exception 'Public section unavailable';end if;
 perform pg_advisory_xact_lock(hashtext('dd-forum-post:'||actor::text));
 if (select count(*) from public.dd_forum_threads t
   where t.author_id=actor and t.created_at>now()-interval '24 hours')>=15
 then raise exception 'Daily topic limit reached';end if;
 insert into public.dd_forum_threads(section_id,author_id,title,body,link_url)
 values(p_section_id,actor,btrim(p_title),btrim(coalesce(p_body,'')),url)
 returning id into made;
 return made;
end $$;

create or replace function public.dd_discussions_reply(
 p_thread_id uuid,p_body text,p_parent_id uuid default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); made uuid;
begin
 if p_thread_id is null or p_body is null
  or char_length(btrim(p_body)) not between 2 and 2000
 then raise exception 'Reply must contain 2–2000 characters';end if;
 if not exists(select 1 from public.dd_forum_threads t
  join public.dd_forum_sections s on s.id=t.section_id
  where t.id=p_thread_id and t.status='published' and s.status='published')
 then raise exception 'Discussion unavailable';end if;
 if p_parent_id is not null and not exists(
  select 1 from public.dd_forum_replies r
   where r.id=p_parent_id and r.thread_id=p_thread_id and r.status='published')
 then raise exception 'Reply parent unavailable';end if;
 perform pg_advisory_xact_lock(hashtext('dd-forum-reply:'||actor::text));
 if (select count(*) from public.dd_forum_replies r
   where r.author_id=actor and r.created_at>now()-interval '10 minutes')>=15
 then raise exception 'Reply rate limit reached';end if;
 insert into public.dd_forum_replies(thread_id,parent_id,author_id,body)
 values(p_thread_id,p_parent_id,actor,btrim(p_body))
 returning id into made;
 update public.dd_forum_threads set updated_at=now() where id=p_thread_id;
 return made;
end $$;

-- Validate a published target without exposing its author's raw identity.
create or replace function public.dd_discussions_target_author(p_kind text,p_id uuid)
returns uuid language sql stable security definer set search_path=pg_catalog,public as $$
 select case when p_kind='thread' then (
  select t.author_id from public.dd_forum_threads t
   join public.dd_forum_sections s on s.id=t.section_id
   where t.id=p_id and t.status='published' and s.status='published')
 when p_kind='reply' then (
  select r.author_id from public.dd_forum_replies r
   join public.dd_forum_threads t on t.id=r.thread_id
   join public.dd_forum_sections s on s.id=t.section_id
   where r.id=p_id and r.status='published'
     and t.status='published' and s.status='published')
 else null end
$$;

create or replace function public.dd_discussions_vote(
 p_kind text,p_id uuid,p_value smallint)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered();
begin
 if p_kind not in ('thread','reply') or p_id is null or p_value not in (-1,0,1)
 then raise exception 'Invalid vote';end if;
 if public.dd_discussions_target_author(p_kind,p_id) is null
 then raise exception 'Discussion unavailable';end if;
 if p_value=0 then
  delete from public.dd_forum_votes where target_kind=p_kind and target_id=p_id and voter_id=actor;
 else
  insert into public.dd_forum_votes(target_kind,target_id,voter_id,value)
  values(p_kind,p_id,actor,p_value)
  on conflict(target_kind,target_id,voter_id)
  do update set value=excluded.value,updated_at=now();
 end if;
 return true;
end $$;

create or replace function public.dd_discussions_flag(
 p_kind text,p_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered();
 original_author uuid; flags integer; baseline integer;
begin
 if p_kind not in ('thread','reply') or p_id is null
  or p_reason not in ('spam','abuse','privacy','harassment','harmful','other')
 then raise exception 'Invalid report';end if;
 -- One target-row lock serialises concurrent 5th-flag decisions.
 if p_kind='thread' then
  select t.author_id,t.reviewed_flag_count into original_author,baseline from public.dd_forum_threads t
   join public.dd_forum_sections s on s.id=t.section_id
   where t.id=p_id and t.status='published' and s.status='published'
   for update of t;
 else
  select r.author_id,r.reviewed_flag_count into original_author,baseline from public.dd_forum_replies r
   join public.dd_forum_threads t on t.id=r.thread_id
   join public.dd_forum_sections s on s.id=t.section_id
   where r.id=p_id and r.status='published'
     and t.status='published' and s.status='published'
   for update of r;
 end if;
 if not found then raise exception 'Discussion unavailable';end if;
 if original_author=actor then raise exception 'You cannot flag your own content';end if;
 perform pg_advisory_xact_lock(hashtext('dd-forum-flag:'||actor::text));
 if (select count(*) from public.dd_forum_flags f
  where f.reporter_id=actor and f.created_at>now()-interval '24 hours')>=30
 then raise exception 'Daily report limit reached';end if;
 insert into public.dd_forum_flags(target_kind,target_id,reporter_id,reason)
 values(p_kind,p_id,actor,p_reason);
 select count(*) into flags from public.dd_forum_flags f
 where f.target_kind=p_kind and f.target_id=p_id;
 if flags-coalesce(baseline,0)>=5 then
  if p_kind='thread' then
   update public.dd_forum_threads set status='hidden',updated_at=now() where id=p_id;
  else
   update public.dd_forum_replies set status='hidden',updated_at=now() where id=p_id;
  end if;
  insert into public.dd_forum_audit(actor_id,action,target_kind,target_id,details)
  values(actor,'auto_hidden_five_distinct_flags',p_kind,p_id,jsonb_build_object('flags',flags));
 end if;
 return true;
end $$;

create or replace function public.dd_discussions_pin(
 p_thread_id uuid,p_pinned boolean)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered();
 v_section_id uuid; steward uuid; pinned boolean;
begin
 if p_thread_id is null or p_pinned is null then raise exception 'Invalid pin request';end if;
 select t.section_id into v_section_id from public.dd_forum_threads t
  join public.dd_forum_sections s on s.id=t.section_id
  where t.id=p_thread_id and t.status='published' and s.status='published';
 if v_section_id is null then raise exception 'Public topic unavailable';end if;
 select s.steward_id into steward from public.dd_forum_sections s
 where s.id=v_section_id for update;
 if actor is distinct from steward and not public.dd_discussions_is_owner()
 then raise exception 'Section steward or site admin required';end if;
 if p_pinned and (select count(*) from public.dd_forum_threads t
  where t.section_id=v_section_id and t.is_pinned and t.status='published'
   and t.id<>p_thread_id)>=3
 then raise exception 'Maximum three pinned topics per section';end if;
 update public.dd_forum_threads set is_pinned=p_pinned,updated_at=now() where id=p_thread_id;
 insert into public.dd_forum_audit(actor_id,section_id,action,target_kind,target_id)
 values(actor,v_section_id,case when p_pinned then 'pin' else 'unpin' end,'thread',p_thread_id);
 return true;
end $$;

create or replace function public.dd_discussions_escalate(
 p_kind text,p_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered();
 v_section_id uuid; steward uuid;
begin
 if p_kind not in ('thread','reply') or p_id is null or p_reason is null
   or char_length(btrim(p_reason)) not between 10 and 500
 then raise exception 'Reason required (10–500 characters)';end if;
 if p_kind='thread' then
  select t.section_id into v_section_id from public.dd_forum_threads t
  where t.id=p_id and t.status<>'removed';
 else
  select t.section_id into v_section_id from public.dd_forum_replies r
  join public.dd_forum_threads t on t.id=r.thread_id
  where r.id=p_id and r.status<>'removed';
 end if;
 if v_section_id is null then raise exception 'Target unavailable';end if;
 select s.steward_id into steward from public.dd_forum_sections s where s.id=v_section_id;
 if actor is distinct from steward and not public.dd_discussions_is_owner()
 then raise exception 'Escalation is limited to the section steward or site admin';end if;
 perform pg_advisory_xact_lock(hashtext('dd-forum-escalate:'||actor::text));
 if (select count(*) from public.dd_forum_escalations e
  where e.submitted_by=actor and e.created_at>now()-interval '24 hours')>=10
 then raise exception 'Daily escalation limit reached';end if;
 insert into public.dd_forum_escalations(section_id,target_kind,target_id,submitted_by,reason)
 values(v_section_id,p_kind,p_id,actor,btrim(p_reason));
 insert into public.dd_forum_audit(actor_id,section_id,action,target_kind,target_id)
 values(actor,v_section_id,'escalate_to_site_owner',p_kind,p_id);
 return true;
end $$;

-- Section stewards may update description/topic, never membership or bans.
create or replace function public.dd_discussions_update_section(
 p_section_id uuid,p_description text,p_topic text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); affected integer;
begin
 if p_section_id is null or coalesce(char_length(p_description),0)>400
  or coalesce(char_length(p_topic),0)>40 then raise exception 'Invalid description or topic';end if;
 update public.dd_forum_sections s set description=btrim(coalesce(p_description,'')),
  topic=btrim(coalesce(p_topic,'')),updated_at=now()
 where s.id=p_section_id and s.status='published'
 and (s.steward_id=actor or public.dd_discussions_is_owner());
 get diagnostics affected=row_count;
 if affected=1 then
  insert into public.dd_forum_audit(actor_id,section_id,action,target_kind,target_id)
  values(actor,p_section_id,'update_section_description','section',p_section_id);
 end if;
 return affected=1;
end $$;

-- Content authors can edit within 30min if no formal flags, or withdraw their own post.
create or replace function public.dd_discussions_edit_own(
 p_kind text,p_id uuid,p_body text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); affected integer;
begin
 if p_kind not in ('thread','reply') or p_id is null or p_body is null
   or char_length(btrim(p_body))<2
   or (p_kind='thread' and char_length(btrim(p_body))>5000)
   or (p_kind='reply' and char_length(btrim(p_body))>2000)
 then raise exception 'Invalid edit';end if;
 if p_kind='thread' then
  update public.dd_forum_threads t set body=btrim(p_body),updated_at=now()
  where t.id=p_id and t.author_id=actor and t.status='published'
   and t.created_at>now()-interval '30 minutes'
   and not exists(select 1 from public.dd_forum_flags f where
    f.target_kind='thread' and f.target_id=t.id);
 else
  update public.dd_forum_replies r set body=btrim(p_body),updated_at=now()
  where r.id=p_id and r.author_id=actor and r.status='published'
   and r.created_at>now()-interval '30 minutes'
   and not exists(select 1 from public.dd_forum_flags f where
    f.target_kind='reply' and f.target_id=r.id);
 end if;
 get diagnostics affected=row_count;
 return affected=1;
end $$;

create or replace function public.dd_discussions_withdraw_own(p_kind text,p_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); affected integer;
begin
 if p_kind not in ('thread','reply') or p_id is null then raise exception 'Invalid removal';end if;
 if p_kind='thread' then
  update public.dd_forum_threads t set status='removed',body='[Removed by author]',link_url=null,is_pinned=false,updated_at=now()
   where t.id=p_id and t.author_id=actor and t.status<>'removed';
 else
  update public.dd_forum_replies r set status='removed',body='[Removed by author]',updated_at=now()
   where r.id=p_id and r.author_id=actor and r.status<>'removed';
 end if;
 get diagnostics affected=row_count;
 return affected=1;
end $$;

create or replace function public.dd_discussions_owner_review(
 p_kind text,p_id uuid,p_status text,p_reason text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered(); affected integer;
begin
 if not public.dd_discussions_is_owner() then raise exception 'Overall site owner required';end if;
 if p_kind not in ('section','thread','reply') or p_id is null
  or p_status not in ('published','hidden','removed')
  or char_length(btrim(coalesce(p_reason,''))) not between 8 and 500
 then raise exception 'Invalid owner review';end if;
 if p_kind='section' then
  update public.dd_forum_sections s set status=p_status,updated_at=now() where s.id=p_id;
 elsif p_kind='thread' then
  update public.dd_forum_threads t set status=p_status,
   reviewed_flag_count=case when p_status='published' then
    (select count(*)::integer from public.dd_forum_flags f where f.target_kind='thread' and f.target_id=t.id)
    else t.reviewed_flag_count end,
   is_pinned=case when p_status='published' then t.is_pinned else false end,updated_at=now()
   where t.id=p_id;
 else
  update public.dd_forum_replies r set status=p_status,
   reviewed_flag_count=case when p_status='published' then
    (select count(*)::integer from public.dd_forum_flags f where f.target_kind='reply' and f.target_id=r.id)
    else r.reviewed_flag_count end,
   updated_at=now() where r.id=p_id;
 end if;
 get diagnostics affected=row_count;
 if affected=1 then
  insert into public.dd_forum_audit(actor_id,action,target_kind,target_id,details)
  values(actor,'owner_status_review',p_kind,p_id,jsonb_build_object('status',p_status,'reason',btrim(p_reason)));
 end if;
 return affected=1;
end $$;

create or replace function public.dd_discussions_owner_set_steward(
 p_section_id uuid,p_steward_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.dd_discussions_require_registered();affected integer;
begin
 if not public.dd_discussions_is_owner() then raise exception 'Overall site owner required';end if;
 if p_section_id is null or char_length(btrim(coalesce(p_reason,''))) not between 8 and 500
 then raise exception 'Reason required';end if;
 if p_steward_id is not null and not exists(select 1 from auth.users u
  where u.id=p_steward_id and u.email_confirmed_at is not null)
 then raise exception 'New steward is not a verified registered account';end if;
 update public.dd_forum_sections s set steward_id=p_steward_id,updated_at=now()
 where s.id=p_section_id;
 get diagnostics affected=row_count;
 if affected=1 then
  insert into public.dd_forum_audit(actor_id,section_id,action,target_kind,target_id,details)
  values(actor,p_section_id,'owner_changed_steward','section',p_section_id,jsonb_build_object('reason',btrim(p_reason)));
 end if;
 return affected=1;
end $$;

create or replace function public.dd_discussions_owner_queue(p_limit integer default 50)
returns table(target_kind text,target_id uuid,section_title text,
 flag_count bigint,escalation_count bigint,content_preview text,latest_escalation_reason text)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if not public.dd_discussions_is_owner() then raise exception 'Overall site owner required';end if;
 if coalesce(p_limit,0) not between 1 and 100 then raise exception 'Invalid queue limit';end if;
 -- Only overall site owner sees the reported text and reported concern. No author or flagger identity leaks.
 return query
 select q.kind,q.item_id,q.title,q.flags,q.escalations,q.excerpt,q.last_reason
 from (
  select 'thread'::text as kind,t.id as item_id,s.title,
   (select count(*) from public.dd_forum_flags f where
     f.target_kind='thread' and f.target_id=t.id) as flags,
   (select count(*) from public.dd_forum_escalations e where
     e.target_kind='thread' and e.target_id=t.id and e.status='open') as escalations,
   left(t.body,600) as excerpt,
   (select e.reason from public.dd_forum_escalations e where
    e.target_kind='thread' and e.target_id=t.id and e.status='open'
    order by e.created_at desc limit 1) as last_reason,
   t.updated_at as changed_at
  from public.dd_forum_threads t join public.dd_forum_sections s on s.id=t.section_id
  where t.status='hidden' or exists(
   select 1 from public.dd_forum_escalations e where
   e.target_kind='thread' and e.target_id=t.id and e.status='open')
  union all
  select 'reply'::text as kind,r.id as item_id,s.title,
   (select count(*) from public.dd_forum_flags f where
     f.target_kind='reply' and f.target_id=r.id) as flags,
   (select count(*) from public.dd_forum_escalations e where
     e.target_kind='reply' and e.target_id=r.id and e.status='open') as escalations,
   left(r.body,600) as excerpt,
   (select e.reason from public.dd_forum_escalations e where
    e.target_kind='reply' and e.target_id=r.id and e.status='open'
    order by e.created_at desc limit 1) as last_reason,
   r.updated_at as changed_at
  from public.dd_forum_replies r
  join public.dd_forum_threads t on t.id=r.thread_id
  join public.dd_forum_sections s on s.id=t.section_id
  where r.status='hidden' or exists(
   select 1 from public.dd_forum_escalations e where
   e.target_kind='reply' and e.target_id=r.id and e.status='open')
 ) q
 order by q.changed_at desc limit p_limit;
end $$;

create or replace function public.dd_discussions_owner_sections(p_limit integer default 100)
returns table(section_id uuid,title text,steward_name text,has_steward boolean)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if not public.dd_discussions_is_owner() then raise exception 'Overall site owner required';end if;
 if coalesce(p_limit,0) not between 1 and 100 then raise exception 'Invalid limit';end if;
 return query
 select s.id,s.title,
  case when n.is_public then n.display_name else 'Private alias' end,
  s.steward_id is not null
 from public.dd_forum_sections s
 left join public.dd_public_names n on n.user_id=s.steward_id
 order by s.created_at desc limit p_limit;
end $$;

-- Block implicit PUBLIC execute on EVERY security-definer function,
-- even internal helpers, and grant precisely selected safe public reads.
revoke all on function public.dd_discussions_require_registered() from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_is_owner() from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_target_author(text,uuid) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_sections(integer) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_threads(uuid,integer,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_replies(uuid,integer) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_create_section(text,text,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_create_thread(uuid,text,text,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_reply(uuid,text,uuid) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_vote(text,uuid,smallint) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_flag(text,uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_pin(uuid,boolean) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_escalate(text,uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_update_section(uuid,text,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_edit_own(text,uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_withdraw_own(text,uuid) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_owner_review(text,uuid,text,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_owner_set_steward(uuid,uuid,text) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_owner_queue(integer) from PUBLIC,anon,authenticated;
revoke all on function public.dd_discussions_owner_sections(integer) from PUBLIC,anon,authenticated;
grant execute on function public.dd_discussions_sections(integer) to anon,authenticated;
grant execute on function public.dd_discussions_threads(uuid,integer,text) to anon,authenticated;
grant execute on function public.dd_discussions_replies(uuid,integer) to anon,authenticated;
grant execute on function public.dd_discussions_create_section(text,text,text) to authenticated;
grant execute on function public.dd_discussions_create_thread(uuid,text,text,text) to authenticated;
grant execute on function public.dd_discussions_reply(uuid,text,uuid) to authenticated;
grant execute on function public.dd_discussions_vote(text,uuid,smallint) to authenticated;
grant execute on function public.dd_discussions_flag(text,uuid,text) to authenticated;
grant execute on function public.dd_discussions_pin(uuid,boolean) to authenticated;
grant execute on function public.dd_discussions_escalate(text,uuid,text) to authenticated;
grant execute on function public.dd_discussions_update_section(uuid,text,text) to authenticated;
grant execute on function public.dd_discussions_edit_own(text,uuid,text) to authenticated;
grant execute on function public.dd_discussions_withdraw_own(text,uuid) to authenticated;
grant execute on function public.dd_discussions_owner_review(text,uuid,text,text) to authenticated;
grant execute on function public.dd_discussions_owner_set_steward(uuid,uuid,text) to authenticated;
grant execute on function public.dd_discussions_owner_queue(integer) to authenticated;
grant execute on function public.dd_discussions_owner_sections(integer) to authenticated;
commit;
