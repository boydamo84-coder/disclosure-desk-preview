-- W.NE Research Edition: private recovery history for verified saves.
-- Separate from account-wide automatic backups, not accessible to anonymous users.
-- ADDITIVE: does not modify existing manuscript content or prior revisions.
create table if not exists public.research_document_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.research_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null check (revision >= 1),
  title text not null,
  content jsonb not null,
  saved_at timestamptz not null default now(),
  unique(document_id, revision)
);

create index if not exists dd_research_revisions_owner_doc_time
  on public.research_document_revisions(user_id, document_id, saved_at desc);
alter table public.research_document_revisions enable row level security;
revoke all on public.research_document_revisions from anon, authenticated;
grant select on public.research_document_revisions to authenticated;
drop policy if exists "read own recovery versions" on public.research_document_revisions;
create policy "read own recovery versions"
  on public.research_document_revisions
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Internal trigger namespace is not exposed by the Supabase Data API.
create schema if not exists dd_internal;
revoke all on schema dd_internal from public, anon, authenticated;
create or replace function dd_internal.capture_research_history()
returns trigger language plpgsql security definer
set search_path=''
as $body$
begin
  if new.revision = old.revision then return new; end if;
  if old.user_id is distinct from new.user_id then
    raise exception 'Research document ownership cannot change';
  end if;
  -- Record the last confirmed state at most once every five minutes.
  -- A save in between does not overwrite older checkpoints.
  if not exists (
    select 1 from public.research_document_revisions v
     where v.document_id = old.id
       and v.saved_at > now() - interval '5 minutes'
  ) then
    insert into public.research_document_revisions(document_id,user_id,revision,title,content,saved_at)
    values (old.id,old.user_id,old.revision,old.title,old.content,now());
    -- Keep at most 40 non-destructive snapshots for each document.
    delete from public.research_document_revisions v
    where v.id in (
      select v2.id from public.research_document_revisions v2
       where v2.document_id=old.id
       order by v2.saved_at desc, v2.revision desc
       offset 40
    );
  end if;
  return new;
end
$body$;
revoke all on function dd_internal.capture_research_history() from public, anon, authenticated;
drop trigger if exists dd_research_history_after_save on public.research_documents;
create trigger dd_research_history_after_save
after update of revision on public.research_documents
for each row when (new.revision > old.revision)
execute function dd_internal.capture_research_history();

comment on table public.research_document_revisions is
'Owner-only prior confirmed versions of W.NE Research Edition cloud documents. Browser clients can read but never change history.';
