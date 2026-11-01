-- Watch & Read: additive DEV migration. Do not run against production before testing.
create table if not exists public.dd_media_titles (
 id text primary key check (length(id) between 3 and 150),
 category text not null check (category in ('documentaries','movies','books')),
 title text not null check (char_length(title) between 2 and 250),
 release_year integer check (release_year between 1800 and 2200),
 creator text not null default '',
 imdb_url text,
 status text not null default 'approved' check (status in ('approved','pending','rejected')),
 submitted_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 check (imdb_url is null or imdb_url ~ '^https://(www\\.)?imdb\\.com/title/tt[0-9]+/?$')
);
create unique index if not exists dd_media_title_dedupe on public.dd_media_titles(category,lower(btrim(title)),coalesce(release_year,0));
create table if not exists public.dd_media_votes (
 title_id text not null references public.dd_media_titles(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 score integer check (score between 1 and 10),
 recommended boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(title_id,user_id),
 check (score is not null or recommended)
);
create index if not exists dd_media_votes_title on public.dd_media_votes(title_id);
alter table public.dd_media_titles enable row level security;
alter table public.dd_media_votes enable row level security;
drop policy if exists dd_media_titles_read on public.dd_media_titles;
create policy dd_media_titles_read on public.dd_media_titles for select to anon,authenticated using (status='approved' or submitted_by=auth.uid());
drop policy if exists dd_media_votes_read on public.dd_media_votes;
create policy dd_media_votes_read on public.dd_media_votes for select to authenticated using (user_id=auth.uid());
-- Aggregate scores without disclosing individual voters.
create or replace function public.dd_media_ranking()
returns table(title_id text,ratings bigint,average_score numeric,recommendations bigint)
language sql stable security definer set search_path=public as $$
 select t.id, count(v.score),round(avg(v.score)::numeric,2),
 count(*) filter(where v.recommended)
 from public.dd_media_titles t left join public.dd_media_votes v on v.title_id=t.id
 where t.status='approved' group by t.id
$$;
revoke all on function public.dd_media_ranking() from public;
grant execute on function public.dd_media_ranking() to anon,authenticated;
-- Signed-in users may rate and recommend approved titles, never impersonate others.
drop policy if exists dd_media_votes_insert on public.dd_media_votes;
create policy dd_media_votes_insert on public.dd_media_votes for insert to authenticated
 with check (user_id=auth.uid() and exists(select 1 from public.dd_media_titles t where t.id=title_id and t.status='approved'));
drop policy if exists dd_media_votes_update on public.dd_media_votes;
create policy dd_media_votes_update on public.dd_media_votes for update to authenticated
 using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.dd_media_titles t where t.id=title_id and t.status='approved'));
drop policy if exists dd_media_votes_delete on public.dd_media_votes;
create policy dd_media_votes_delete on public.dd_media_votes for delete to authenticated using(user_id=auth.uid());
-- Only trusted admins seed and approve catalogue records.
revoke all on public.dd_media_titles from anon,authenticated;
grant select on public.dd_media_titles to anon,authenticated;
grant select,insert,update,delete on public.dd_media_votes to authenticated;

-- Curated starter records; no invented ratings or votes.
insert into public.dd_media_titles(id,category,title,release_year,creator,status) values
 ('documentaries-the-phenomenon','documentaries','The Phenomenon',2020,'James Fox','approved'),
 ('documentaries-moment-of-contact','documentaries','Moment of Contact',2022,'James Fox','approved'),
 ('documentaries-the-age-of-disclosure','documentaries','The Age of Disclosure',2025,'Dan Farah','approved'),
 ('movies-close-encounters-of-the-third-kind','movies','Close Encounters of the Third Kind',1977,'Steven Spielberg','approved'),
 ('movies-arrival','movies','Arrival',2016,'Denis Villeneuve','approved'),
 ('movies-contact','movies','Contact',1997,'Robert Zemeckis','approved'),
 ('books-ufos-generals-pilots-and-government-officials-go-on-the-record','books','UFOs: Generals, Pilots, and Government Officials Go on the Record',2010,'Leslie Kean','approved'),
 ('books-passport-to-magonia','books','Passport to Magonia',1969,'Jacques Vallée','approved'),
 ('books-in-plain-sight','books','In Plain Sight',2021,'Ross Coulthart','approved')
on conflict (id) do nothing;
