-- Disclosure Desk: read-only checks before post-01:30 release
-- No user records, email addresses, tokens or Board content returned.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('investigation_boards','video_progress','dd_email_backup_limit')
and c.relkind in ('r','p')
order by c.relname;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename in ('investigation_boards','video_progress','dd_email_backup_limit')
order by tablename,policyname;

select table_name,column_name,data_type
from information_schema.columns
where table_schema='public' and table_name='video_progress'
and column_name in ('user_id','watched','skipped','last_clip_id','updated_at')
order by column_name;
