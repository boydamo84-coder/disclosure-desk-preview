-- Isolated acceptance draft for issue #17. This file creates no cron job.
-- Run only in a disposable database until the owner separately approves activation.
begin;
create schema dd_host_private;
revoke all on schema dd_host_private from public, anon, authenticated, service_role;

create table dd_host_private.trial (
  singleton boolean primary key default true check (singleton),
  enabled_by_operator boolean not null default false,
  paused boolean not null default true,
  starts_on date
);
insert into dd_host_private.trial default values;

create table dd_host_private.queue (
  id uuid primary key default gen_random_uuid(),
  day integer not null check (day between 1 and 14),
  slot integer not null check (slot between 1 and 3),
  minute integer not null check (
    (slot=1 and minute between 360 and 719) or
    (slot=2 and minute between 720 and 1019) or
    (slot=3 and minute between 1020 and 1380)
  ),
  host text not null check (host in ('investigator','scientist','historian','sceptic','explorer')),
  section_key text not null check (section_key ~ '^[a-z0-9-]{3,60}$'),
  title text not null check (char_length(btrim(title)) between 4 and 150),
  body text not null check (char_length(btrim(body)) between 20 and 4700),
  source text check (source is null or (
    char_length(source)<=1000 and
    source ~ '^https://(uapdisclosuredesk[.]com|www[.](war[.]gov|defense[.]gov|energy[.]gov|archives[.]gov|aaro[.]mil|cia[.]gov|nasa[.]gov|dvidshub[.]net)|www[.]esd[.]whs[.]mil)/[^[:space:]]*$'
  )),
  state text not null default 'draft' check (state in ('draft','approved','published','cancelled','removed','expired')),
  posted_at timestamptz,
  unique(day,slot)
);
create unique index dd_host_queue_title_unique on dd_host_private.queue (lower(btrim(title)));
create table dd_host_private.audit (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default clock_timestamp(),
  actor uuid,
  item uuid,
  action text not null,
  detail jsonb not null default '{}'::jsonb
);
revoke all on all tables in schema dd_host_private from public, anon, authenticated, service_role;

create function dd_host_private.host_name(p_host text)
returns text language sql immutable set search_path = '' as $$
  select case p_host when 'investigator' then 'The Investigator'
    when 'scientist' then 'The Scientist' when 'historian' then 'The Historian'
    when 'sceptic' then 'The Sceptic' when 'explorer' then 'The Explorer' end
$$;

create function dd_host_private.require_owner()
returns uuid language plpgsql stable set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or coalesce(auth.jwt()->>'is_anonymous','false') <> 'false' or
     not exists (select 1 from public.dd_forum_owner_admins a where a.user_id=actor) then
    raise exception 'Discussion Host owner access required' using errcode='42501';
  end if;
  return actor;
end
$$;

create function dd_host_private.seed(p_posts jsonb)
returns integer language plpgsql set search_path = '' as $$
declare added integer;
begin
  perform 1 from dd_host_private.trial where singleton and not enabled_by_operator for update;
  if not found or exists (select 1 from dd_host_private.queue) or
     jsonb_typeof(p_posts) is distinct from 'array' or jsonb_array_length(p_posts) <> 42 then
    raise exception 'Only a new, disabled 42-post trial can be seeded';
  end if;
  insert into dd_host_private.queue(day,slot,minute,host,section_key,title,body,source)
  select day,slot,minute,host,"sectionKey",title,body,source
  from jsonb_to_recordset(p_posts) as x(day integer,slot integer,minute integer,host text,"sectionKey" text,title text,body text,source text);
  get diagnostics added = row_count;
  insert into dd_host_private.audit(action,detail) values ('seeded',jsonb_build_object('count',added));
  return added;
end
$$;

create function public.dd_host_admin_queue()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform dd_host_private.require_owner();
  return jsonb_build_object(
    'trial',(select to_jsonb(t) - 'singleton' from dd_host_private.trial t),
    'posts',(select coalesce(jsonb_agg(to_jsonb(q) order by q.day,q.slot),'[]'::jsonb) from dd_host_private.queue q),
    'sections',(select coalesce(jsonb_agg(jsonb_build_object('key',s.name_key,'title',s.title) order by s.title),'[]'::jsonb)
      from public.dd_forum_sections s where s.status='published' and s.name_key is not null),
    'audit',(select coalesce(jsonb_agg(to_jsonb(a) - 'actor' order by a.id desc),'[]'::jsonb)
      from (select * from dd_host_private.audit order by id desc limit 30) a)
  );
end
$$;

create function public.dd_host_admin_control(p_action text, p_day_one date default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid := dd_host_private.require_owner();
declare t dd_host_private.trial%rowtype;
declare today date := (clock_timestamp() at time zone 'UTC')::date;
begin
  select * into strict t from dd_host_private.trial where singleton for update;
  case p_action
    when 'schedule' then
      if p_day_one is null or p_day_one <= today or not t.paused or
         exists (select 1 from dd_host_private.queue where posted_at is not null) then
        raise exception 'Choose a future UTC start date while paused and before any posts publish';
      end if;
      update dd_host_private.trial set starts_on=p_day_one where singleton;
    when 'pause' then update dd_host_private.trial set paused=true where singleton;
    when 'resume' then
      if not t.enabled_by_operator or t.starts_on is null or today-t.starts_on not between -366 and 13 then
        raise exception 'The server trial needs operator activation and an available schedule';
      end if;
      if not exists (select 1 from dd_host_private.queue where state='approved') then
        raise exception 'Approve a post before resuming the trial';
      end if;
      update dd_host_private.trial set paused=false where singleton;
    else raise exception 'Unknown trial action';
  end case;
  insert into dd_host_private.audit(actor,action,detail)
  values (actor,p_action,jsonb_build_object('starts_on',coalesce(p_day_one,t.starts_on)));
  return true;
end
$$;

create function public.dd_host_admin_edit(p_id uuid,p_title text,p_body text,p_source text,p_section text,p_minute integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid := dd_host_private.require_owner();
begin
  perform 1 from dd_host_private.trial where singleton for update;
  if not exists (select 1 from public.dd_forum_sections where name_key=p_section and status='published') then
    raise exception 'Choose an existing published subject';
  end if;
  update dd_host_private.queue set title=btrim(p_title),body=btrim(p_body),source=nullif(btrim(p_source),''),
    section_key=p_section,minute=p_minute,state='draft'
  where id=p_id and state in ('draft','approved');
  if not found then raise exception 'Only pending posts can be edited'; end if;
  insert into dd_host_private.audit(actor,item,action) values(actor,p_id,'edited');
  return true;
end
$$;

create function public.dd_host_admin_post(p_id uuid,p_action text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid := dd_host_private.require_owner();
declare status_before text;
begin
  perform 1 from dd_host_private.trial where singleton for update;
  select state into status_before from dd_host_private.queue where id=p_id;
  case p_action
    when 'approve' then
      update dd_host_private.queue q set state='approved' where q.id=p_id and q.state='draft'
        and exists(select 1 from public.dd_forum_sections s where s.name_key=q.section_key and s.status='published');
    when 'cancel' then
      update dd_host_private.queue set state='cancelled' where id=p_id and state in ('draft','approved');
    when 'remove' then
      if status_before is distinct from 'published' then raise exception 'Only published host posts can be removed'; end if;
      update public.dd_forum_threads set status='removed',updated_at=clock_timestamp() where id=p_id and author_id is null;
      if not found then raise exception 'The published host thread is missing'; end if;
      update dd_host_private.queue set state='removed' where id=p_id;
    else raise exception 'Unknown post action';
  end case;
  if not found then raise exception 'This action is unavailable for the current state'; end if;
  insert into dd_host_private.audit(actor,item,action) values(actor,p_id,p_action);
  return true;
end
$$;

-- Called by the database scheduler only. Single trial-row lock serializes
-- retries, moderation and overlapping cron ticks. A queue UUID is the thread UUID.
create function dd_host_private.publish_due(p_now timestamptz default clock_timestamp())
returns uuid language plpgsql set search_path = '' as $$
declare t dd_host_private.trial%rowtype;
declare item dd_host_private.queue%rowtype;
declare timestamp_utc timestamp := p_now at time zone 'UTC';
declare trial_day integer;
declare current_minute integer := extract(hour from timestamp_utc)::integer*60 + extract(minute from timestamp_utc)::integer;
declare subject uuid;
begin
  select * into strict t from dd_host_private.trial where singleton for update;
  if not t.enabled_by_operator or t.starts_on is null then return null; end if;
  trial_day := timestamp_utc::date-t.starts_on+1;
  if trial_day>14 then
    update dd_host_private.queue set state='expired' where state in ('draft','approved');
    if not t.paused then
      update dd_host_private.trial set paused=true where singleton;
      insert into dd_host_private.audit(action) values ('trial ended');
    end if;
    return null;
  end if;
  if t.paused or trial_day<1 then return null; end if;
  update dd_host_private.queue set state='expired' where day<trial_day and state in ('draft','approved');
  if exists(select 1 from dd_host_private.queue where posted_at>p_now-interval '30 minutes') then
    return null;
  end if;
  select q.* into item from dd_host_private.queue q
  join public.dd_forum_sections s on s.name_key=q.section_key and s.status='published'
  where q.day=trial_day and q.state='approved' and q.minute<=current_minute and q.minute>current_minute-60
  order by q.minute,q.slot limit 1;
  if not found then return null; end if;
  select id into subject from public.dd_forum_sections
    where name_key=item.section_key and status='published' for share;
  if not found then return null; end if;
  insert into public.dd_forum_threads(id,section_id,author_id,title,body,link_url,post_tone)
  values(item.id,subject,null,item.title,'Automated discussion host · '||dd_host_private.host_name(item.host)||E'\n\n'||item.body,item.source,'serious');
  update dd_host_private.queue set state='published',posted_at=p_now where id=item.id;
  insert into dd_host_private.audit(item,action) values(item.id,'published');
  return item.id;
end
$$;

create function public.dd_discussions_host_labels(p_ids uuid[])
returns table(id uuid, host text)
language sql stable security definer set search_path = '' as $$
  select q.id,q.host from dd_host_private.queue q
  join public.dd_forum_threads t on t.id=q.id and t.author_id is null and t.status='published'
  join public.dd_forum_sections s on s.id=t.section_id and s.status='published'
  where coalesce(cardinality(p_ids),0) between 1 and 30 and q.id=any(p_ids) and q.state='published'
$$;

revoke all on all functions in schema dd_host_private from public, anon, authenticated, service_role;
revoke all on function public.dd_host_admin_queue(),public.dd_host_admin_control(text,date),
  public.dd_host_admin_edit(uuid,text,text,text,text,integer),public.dd_host_admin_post(uuid,text),
  public.dd_discussions_host_labels(uuid[]) from public,anon,authenticated,service_role;
grant execute on function public.dd_host_admin_queue(),public.dd_host_admin_control(text,date),
  public.dd_host_admin_edit(uuid,text,text,text,text,integer),
  public.dd_host_admin_post(uuid,text) to authenticated;
grant execute on function public.dd_discussions_host_labels(uuid[]) to anon,authenticated;
commit;
