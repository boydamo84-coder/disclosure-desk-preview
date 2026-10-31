-- Disclosure Desk case comments: draft migration, run manually after review.
-- Authenticated comments are visible only after moderator approval.
create table if not exists public.dd_case_comments (
 id uuid primary key default gen_random_uuid(),
 case_id text not null check (length(case_id) between 1 and 180),
 author_id uuid not null references auth.users(id) on delete cascade,
 parent_id uuid references public.dd_case_comments(id) on delete set null,
 body text not null check (char_length(btrim(body)) between 3 and 2000),
 status text not null default 'pending' check (status in ('pending','approved','hidden','rejected')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists dd_case_comments_public_idx on public.dd_case_comments(case_id,created_at desc) where status='approved';
create index if not exists dd_case_comments_author_idx on public.dd_case_comments(author_id,created_at desc);
create index if not exists dd_case_comments_review_idx on public.dd_case_comments(status,created_at) where status <> 'approved';

create table if not exists public.dd_case_comment_flags (
 id uuid primary key default gen_random_uuid(),
 comment_id uuid not null references public.dd_case_comments(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check (reason in ('privacy','abuse','spam','harmful','copyright','other')),
 details text not null default '' check (char_length(details) <= 500),
 created_at timestamptz not null default now(),
 unique (comment_id,reporter_id)
);
create index if not exists dd_case_comment_flags_comment_idx on public.dd_case_comment_flags(comment_id);

-- Explicit administrator allowlist managed only through Supabase service/admin controls.
create table if not exists public.dd_comment_moderators (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.dd_case_comments enable row level security;
alter table public.dd_case_comment_flags enable row level security;
alter table public.dd_comment_moderators enable row level security;

create or replace function public.dd_is_comment_moderator()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.dd_comment_moderators where user_id=auth.uid()) $$;
revoke all on function public.dd_is_comment_moderator() from public;
grant execute on function public.dd_is_comment_moderator() to authenticated;

drop policy if exists dd_comments_read on public.dd_case_comments;
create policy dd_comments_read on public.dd_case_comments for select to authenticated
 using (status='approved' or author_id=auth.uid() or public.dd_is_comment_moderator());
drop policy if exists dd_comments_submit on public.dd_case_comments;
create policy dd_comments_submit on public.dd_case_comments for insert to authenticated
 with check (author_id=auth.uid() and status='pending'
  and (parent_id is null or exists(select 1 from public.dd_case_comments parent where parent.id=parent_id and parent.case_id=case_id and parent.status='approved')));
-- Never permit client UPDATE/DELETE: moderation and withdrawal must use trusted server workflows.
drop policy if exists dd_flags_insert on public.dd_case_comment_flags;
create policy dd_flags_insert on public.dd_case_comment_flags for insert to authenticated
 with check (reporter_id=auth.uid() and exists(select 1 from public.dd_case_comments c where c.id=comment_id and c.status='approved'));
drop policy if exists dd_flags_read_moderators on public.dd_case_comment_flags;
create policy dd_flags_read_moderators on public.dd_case_comment_flags for select to authenticated
 using (reporter_id=auth.uid() or public.dd_is_comment_moderator());
-- No client access to moderator allowlist. Administrators provision entries through trusted service role.
revoke all on public.dd_comment_moderators from anon,authenticated;
grant select,insert on public.dd_case_comments to authenticated;
grant select,insert on public.dd_case_comment_flags to authenticated;
revoke update,delete on public.dd_case_comments from anon,authenticated;
revoke update,delete on public.dd_case_comment_flags from anon,authenticated;
