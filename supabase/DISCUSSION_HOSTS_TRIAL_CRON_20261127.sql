-- Installed only after owner approval. Creates private worker, not an active job.
begin;
create extension pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
-- One short local SQL job; never receives secrets or calls an external API.
create function dd_host_private.run_scheduled_trial()
returns void language plpgsql set search_path = '' as $$
declare t dd_host_private.trial%rowtype;
begin
  select * into strict t from dd_host_private.trial where singleton for update;
  if not t.enabled_by_operator or t.starts_on is null then return; end if;
  perform dd_host_private.publish_due();
  if (clock_timestamp() at time zone 'UTC')::date >= t.starts_on+14 then
    update dd_host_private.trial set enabled_by_operator=false,paused=true where singleton;
    insert into dd_host_private.audit(action) values ('scheduler stopped after 14 days');
    perform cron.unschedule('dd-discussion-hosts-14-day-trial');
  end if;
end $$;
revoke all on function dd_host_private.run_scheduled_trial() from public,anon,authenticated,service_role;
commit;
