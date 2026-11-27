-- Read-only, trial-scoped recommendations. No vote/like or membership writes.
begin;
create function public.dd_host_public_picks()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  t dd_host_private.trial%rowtype;
  today date := (statement_timestamp() at time zone 'UTC')::date;
  items jsonb := '[]'::jsonb;
  active boolean;
begin
  select * into strict t from dd_host_private.trial where singleton;
  active := coalesce(t.enabled_by_operator and not t.paused and today-t.starts_on between 0 and 13, false);
  if active then
    -- A daily, public, serious member-thread topic match; never pick a host
    -- thread, unpublished/hidden material, anonymous-deleted author or vote.
    select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'host',p.host)), '[]'::jsonb)
      into items
    from (
      select f.id,
        case
          when f.title ~* '\m(verification|verify|debunk|uncertainty|alternative explanation|limitations)\M' then 'sceptic'
          when f.title ~* '\m(science|measurement|sensor|analysis|method|methodology)\M' then 'scientist'
          when f.title ~* '\m(archive|archives|historical|history|foia)\M' then 'historian'
          when f.title ~* '\m(source|sources|evidence|record|records|document|documents)\M' then 'investigator'
          else 'explorer'
        end host
      from public.dd_forum_threads f
      join public.dd_forum_sections s on s.id=f.section_id and s.status='published'
      where f.status='published' and f.author_id is not null and f.post_tone='serious'
        and f.created_at <= statement_timestamp() and f.created_at >= statement_timestamp()-interval '60 days'
        and f.title ~* '\m(source|sources|evidence|research|archive|archives|historical|history|foia|record|records|document|documents|analysis|method|methodology|verification|verify|debunk|uncertainty|alternative explanation|limitations|science|measurement|sensor|suggestions)\M'
        and not exists(select 1 from dd_host_private.queue q where q.id=f.id)
      order by md5(today::text||f.id::text), f.id
      limit 1
    ) p;
  end if;
  return jsonb_build_object('active',active,'day',today::text,'discussions',items);
end
$$;
revoke all on function public.dd_host_public_picks() from public,anon,authenticated,service_role;
grant execute on function public.dd_host_public_picks() to anon, authenticated;
commit;
