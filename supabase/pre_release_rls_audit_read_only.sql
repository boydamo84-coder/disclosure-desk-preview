-- Disclosure Desk pre-release access-control audit (READ ONLY).
-- Run in Supabase SQL Editor, inspect the results, and share only policy metadata.
-- Do not paste auth tokens, emails, or private Board data into chat.

select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('investigation_boards','dd_email_backup_limit')
  and c.relkind in ('r','p')
order by c.relname;

select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies
where schemaname='public'
  and tablename in ('investigation_boards','dd_email_backup_limit')
order by tablename,policyname;

select table_schema,table_name,column_name,data_type,column_default
from information_schema.columns
where table_schema='public' and table_name='investigation_boards'
  and column_name in ('user_id','owner_id','account_id')
order by column_name;

-- Note: seeing RLS enabled alone is insufficient. Confirm SELECT/INSERT/
-- UPDATE/DELETE are scoped to auth.uid() for each user's own rows.
-- Test cross-account read/write denial with a dedicated non-owner test account.
