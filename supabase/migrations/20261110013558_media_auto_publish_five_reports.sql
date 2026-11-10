-- Owner-approved M48: publish valid member links immediately, hide after five
-- distinct registered reports, and retain owner restore/remove control.
begin;
alter table public.dd_media_titles drop constraint dd_media_titles_category_check;
alter table public.dd_media_titles add constraint dd_media_titles_category_check check(category in ('documentaries','movies','books','podcasts'));
alter table public.dd_media_titles add column public_url text, add column display_year text not null default '',
 add column source_kind text not null default 'editorial' check(source_kind in ('editorial','member')),
 add column moderation_round integer not null default 0 check(moderation_round>=0),
 add column publication_title_key text, add column publication_url_key text;
create function dd_media_private.title_key(p text) returns text language sql immutable set search_path='' as $$
 select btrim(regexp_replace(lower(btrim(p)),'[^[:alnum:]]+',' ','g'))
$$;
create function dd_media_private.clean_url(p text) returns text language plpgsql immutable set search_path='' as $$
declare m text[]; host text; path text; query text; result text;
begin
 if p is null or length(p)>1800 or p ~ '[[:space:]]' then raise exception 'Public HTTPS link required';end if;
 m:=regexp_match(split_part(btrim(p),'#',1),'^https://([^/?#]+)([^?#]*)([?]([^#]*))?$');
 if m is null then raise exception 'Public HTTPS link required';end if;
 host:=regexp_replace(lower(m[1]),':443$','');
 if host !~ '^([a-z0-9-]+\.)+[a-z]{2,}$' or host ~ '(^|[.])(localhost|local|internal|test)$' then raise exception 'Public HTTPS link required';end if;
 path:=coalesce(nullif(m[2],''),'/');
 select string_agg(q,'&' order by q) into query from unnest(string_to_array(coalesce(m[4],''),'&')) q
 where q<>'' and split_part(lower(q),'=',1) !~ '^(utm_.+|gclid|fbclid)$';
 result:='https://'||host||path||case when query is null then '' else '?'||query end;
 return result;
end $$;
create function dd_media_private.url_key(p text) returns text language plpgsql immutable set search_path='' as $$
declare clean text; host text; path text; video text;
begin
 if p is null then return null;end if;
 clean:=dd_media_private.clean_url(p);host:=split_part(split_part(clean,'://',2),'/',1);
 host:=regexp_replace(host,'^www[.]','');path:=substring(clean from '^https://[^/]+(.*)$');
 if host='youtu.be' then video:=substring(path from '^/([A-Za-z0-9_-]{11})([?]|$)');
 elsif host in ('youtube.com','m.youtube.com') then
  video:=substring(path from '[?&]v=([A-Za-z0-9_-]{11})(&|$)');
  if video is null then video:=substring(path from '^/(shorts|embed)/([A-Za-z0-9_-]{11})([?]|$)');
   -- Extract the ID separately because the format prefix is a capture group.
   if path ~ '^/(shorts|embed)/[A-Za-z0-9_-]{11}([?]|$)' then video:=split_part(split_part(path,'/',3),'?',1);end if;
  end if;
 end if;
 if video is not null and length(video)=11 then return 'youtube:'||video;end if;
 return host||regexp_replace(split_part(path,'?',1),'/$','')||case when position('?' in path)>0 then '?'||split_part(path,'?',2) else '' end;
end $$;
revoke all on function dd_media_private.title_key(text),dd_media_private.clean_url(text),dd_media_private.url_key(text) from public,anon,authenticated;
update public.dd_media_titles set publication_title_key=dd_media_private.title_key(title),display_year=coalesce(release_year::text,'');
-- Exact editorial catalogue from assets/watch-read.js is seeded below, preserving IDs and votes.
insert into public.dd_media_titles(id,category,title,release_year,creator,public_url,display_year,publication_title_key,publication_url_key) values
('documentaries-the-phenomenon','documentaries','The Phenomenon',2020,'James Fox',null,'2020',dd_media_private.title_key('The Phenomenon'),null),
('documentaries-moment-of-contact','documentaries','Moment of Contact',2022,'James Fox',null,'2022',dd_media_private.title_key('Moment of Contact'),null),
('documentaries-the-age-of-disclosure','documentaries','The Age of Disclosure',2025,'Dan Farah',null,'2025',dd_media_private.title_key('The Age of Disclosure'),null),
('movies-close-encounters-of-the-third-kind','movies','Close Encounters of the Third Kind',1977,'Steven Spielberg',null,'1977',dd_media_private.title_key('Close Encounters of the Third Kind'),null),
('movies-arrival','movies','Arrival',2016,'Denis Villeneuve',null,'2016',dd_media_private.title_key('Arrival'),null),
('movies-contact','movies','Contact',1997,'Robert Zemeckis',null,'1997',dd_media_private.title_key('Contact'),null),
('books-ufos-generals-pilots-and-government-officials-go-on-the-record','books','UFOs: Generals, Pilots, and Government Officials Go on the Record',2010,'Leslie Kean',null,'2010',dd_media_private.title_key('UFOs: Generals, Pilots, and Government Officials Go on the Record'),null),
('books-passport-to-magonia','books','Passport to Magonia',1969,'Jacques Vallée',null,'1969',dd_media_private.title_key('Passport to Magonia'),null),
('books-in-plain-sight','books','In Plain Sight',2021,'Ross Coulthart',null,'2021',dd_media_private.title_key('In Plain Sight'),null),
('podcasts-confessions-of-a-ufo-insider-the-david-grusch-revelations','podcasts','Confessions Of A UFO Insider — The David Grusch Revelations',2023,'WEAPONIZED · Episode 21','https://www.youtube.com/watch?v=dc6V0O_OPJ0','2023',dd_media_private.title_key('Confessions Of A UFO Insider — The David Grusch Revelations'),dd_media_private.url_key('https://www.youtube.com/watch?v=dc6V0O_OPJ0')),
('podcasts-hollywood-the-cia-ufos-the-history-beyond-spielberg','podcasts','Hollywood, The CIA & UFOs: The History Beyond Spielberg',2026,'American Alchemy · Jesse Michels','https://www.youtube.com/watch?v=yJUBSuPh1pM','2026',dd_media_private.title_key('Hollywood, The CIA & UFOs: The History Beyond Spielberg'),dd_media_private.url_key('https://www.youtube.com/watch?v=yJUBSuPh1pM')),
('podcasts-david-grusch-ufos-atomic-secrecy-and-anti-gravity-research','podcasts','David Grusch: UFOs, Atomic Secrecy and Anti-Gravity Research',2023,'American Alchemy · Jesse Michels','https://www.youtube.com/watch?v=kRO5jOa06Qw','2023',dd_media_private.title_key('David Grusch: UFOs, Atomic Secrecy and Anti-Gravity Research'),dd_media_private.url_key('https://www.youtube.com/watch?v=kRO5jOa06Qw')),
('podcasts-weaponized-21-the-david-grusch-whistleblower-story','podcasts','WEAPONIZED #21 — The David Grusch Whistleblower Story',2023,'WEAPONIZED · Corbell & Knapp','https://www.weaponizedpodcast.com/episodes-1/episode-number-21','2023',dd_media_private.title_key('WEAPONIZED #21 — The David Grusch Whistleblower Story'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-21')),
('podcasts-diana-pasulka-the-others-ufos-ai-death-the-vatican','podcasts','Diana Pasulka: The Others, UFOs, AI, Death & the Vatican',2026,'That UFO Podcast · Andy McGrillen','https://www.thatufopodcast.com/thatufopodcast/diana-pasulka-the-others-ufos-ai-death-amp-the-vatican','2026',dd_media_private.title_key('Diana Pasulka: The Others, UFOs, AI, Death & the Vatican'),dd_media_private.url_key('https://www.thatufopodcast.com/thatufopodcast/diana-pasulka-the-others-ufos-ai-death-amp-the-vatican')),
('podcasts-dr-eric-davis-recovered-craft-nhi-bodies-and-government-contact','podcasts','Dr Eric Davis: Recovered Craft, NHI Bodies and Government Contact',2026,'That UFO Podcast · Andy McGrillen','https://www.thatufopodcast.com/thatufopodcast/dr-eric-davis-recovered-craft-nhi-bodies-and-government-contact','2026',dd_media_private.title_key('Dr Eric Davis: Recovered Craft, NHI Bodies and Government Contact'),dd_media_private.url_key('https://www.thatufopodcast.com/thatufopodcast/dr-eric-davis-recovered-craft-nhi-bodies-and-government-contact')),
('podcasts-chris-ramsay-returns-ufo-crashes-disclosure-fatigue-secret-technology','podcasts','Chris Ramsay Returns: UFO Crashes, Disclosure Fatigue & Secret Technology',2026,'That UFO Podcast · Andy McGrillen','https://www.thatufopodcast.com/thatufopodcast/chris-ramsay-returns-ufo-crashes-disclosure-fatigue-amp-secret-technology','2026',dd_media_private.title_key('Chris Ramsay Returns: UFO Crashes, Disclosure Fatigue & Secret Technology'),dd_media_private.url_key('https://www.thatufopodcast.com/thatufopodcast/chris-ramsay-returns-ufo-crashes-disclosure-fatigue-amp-secret-technology')),
('podcasts-if-you-still-think-ufos-are-fake-watch-this-ryan-graves-interview','podcasts','If You Still Think UFOs Are Fake, Watch This — Ryan Graves Interview',2026,'Daniel Dushy · Ryan Graves','https://www.youtube.com/watch?v=u9hCc2RTIhI','2026',dd_media_private.title_key('If You Still Think UFOs Are Fake, Watch This — Ryan Graves Interview'),dd_media_private.url_key('https://www.youtube.com/watch?v=u9hCc2RTIhI')),
('podcasts-joe-rogan-experience-1315-bob-lazar-jeremy-corbell','podcasts','Joe Rogan Experience #1315 — Bob Lazar & Jeremy Corbell',2019,'Joe Rogan Experience · Bob Lazar & Jeremy Corbell','https://jrelibrary.com/1315-bob-lazar-jeremy-corbell/','2019',dd_media_private.title_key('Joe Rogan Experience #1315 — Bob Lazar & Jeremy Corbell'),dd_media_private.url_key('https://jrelibrary.com/1315-bob-lazar-jeremy-corbell/')),
('podcasts-joe-rogan-experience-1361-cmdr-david-fravor-jeremy-corbell','podcasts','Joe Rogan Experience #1361 — Cmdr. David Fravor & Jeremy Corbell',2019,'Joe Rogan Experience · Cmdr. David Fravor & Jeremy Corbell','https://jrelibrary.com/1361-cmdr-david-fravor-jeremy-corbell/','2019',dd_media_private.title_key('Joe Rogan Experience #1361 — Cmdr. David Fravor & Jeremy Corbell'),dd_media_private.url_key('https://jrelibrary.com/1361-cmdr-david-fravor-jeremy-corbell/')),
('podcasts-joe-rogan-experience-1510-george-knapp-jeremy-corbell','podcasts','Joe Rogan Experience #1510 — George Knapp & Jeremy Corbell',2020,'Joe Rogan Experience · George Knapp & Jeremy Corbell','https://jrelibrary.com/1510-george-knapp-jeremy-corbell/','2020',dd_media_private.title_key('Joe Rogan Experience #1510 — George Knapp & Jeremy Corbell'),dd_media_private.url_key('https://jrelibrary.com/1510-george-knapp-jeremy-corbell/')),
('podcasts-joe-rogan-experience-1574-jacques-vall-e-james-fox','podcasts','Joe Rogan Experience #1574 — Jacques Vallée & James Fox',2020,'Joe Rogan Experience · Jacques Vallée & James Fox','https://jrelibrary.com/1574-jacques-vallee-james-fox/','2020',dd_media_private.title_key('Joe Rogan Experience #1574 — Jacques Vallée & James Fox'),dd_media_private.url_key('https://jrelibrary.com/1574-jacques-vallee-james-fox/')),
('podcasts-joe-rogan-experience-1597-travis-walton','podcasts','Joe Rogan Experience #1597 — Travis Walton',2021,'Joe Rogan Experience · Travis Walton','https://jrelibrary.com/1597-travis-walton/','2021',dd_media_private.title_key('Joe Rogan Experience #1597 — Travis Walton'),dd_media_private.url_key('https://jrelibrary.com/1597-travis-walton/')),
('podcasts-joe-rogan-experience-1645-christopher-mellon','podcasts','Joe Rogan Experience #1645 — Christopher Mellon',2021,'Joe Rogan Experience · Christopher Mellon','https://jrelibrary.com/1645-christopher-mellon/','2021',dd_media_private.title_key('Joe Rogan Experience #1645 — Christopher Mellon'),dd_media_private.url_key('https://jrelibrary.com/1645-christopher-mellon/')),
('podcasts-joe-rogan-experience-1853-jeremy-corbell','podcasts','Joe Rogan Experience #1853 — Jeremy Corbell',2022,'Joe Rogan Experience · Jeremy Corbell','https://jrelibrary.com/1853-jeremy-corbell/','2022',dd_media_private.title_key('Joe Rogan Experience #1853 — Jeremy Corbell'),dd_media_private.url_key('https://jrelibrary.com/1853-jeremy-corbell/')),
('podcasts-joe-rogan-experience-1883-ryan-graves','podcasts','Joe Rogan Experience #1883 — Ryan Graves',2022,'Joe Rogan Experience · Ryan Graves','https://jrelibrary.com/1883-ryan-graves/','2022',dd_media_private.title_key('Joe Rogan Experience #1883 — Ryan Graves'),dd_media_private.url_key('https://jrelibrary.com/1883-ryan-graves/')),
('podcasts-joe-rogan-experience-1976-james-fox','podcasts','Joe Rogan Experience #1976 — James Fox',2023,'Joe Rogan Experience · James Fox','https://jrelibrary.com/1976-james-fox/','2023',dd_media_private.title_key('Joe Rogan Experience #1976 — James Fox'),dd_media_private.url_key('https://jrelibrary.com/1976-james-fox/')),
('podcasts-joe-rogan-experience-2028-jeremy-corbell-george-knapp','podcasts','Joe Rogan Experience #2028 — Jeremy Corbell & George Knapp',2023,'Joe Rogan Experience · Jeremy Corbell & George Knapp','https://jrelibrary.com/2028-jeremy-corbell-george-knapp/','2023',dd_media_private.title_key('Joe Rogan Experience #2028 — Jeremy Corbell & George Knapp'),dd_media_private.url_key('https://jrelibrary.com/2028-jeremy-corbell-george-knapp/')),
('podcasts-joe-rogan-experience-2065-david-grusch','podcasts','Joe Rogan Experience #2065 — David Grusch',2023,'Joe Rogan Experience · David Grusch','https://jrelibrary.com/2065-david-grusch/','2023',dd_media_private.title_key('Joe Rogan Experience #2065 — David Grusch'),dd_media_private.url_key('https://jrelibrary.com/2065-david-grusch/')),
('podcasts-joe-rogan-experience-2091-diana-walsh-pasulka','podcasts','Joe Rogan Experience #2091 — Diana Walsh Pasulka',2024,'Joe Rogan Experience · Diana Walsh Pasulka','https://jrelibrary.com/2091-diana-walsh-pasulka/','2024',dd_media_private.title_key('Joe Rogan Experience #2091 — Diana Walsh Pasulka'),dd_media_private.url_key('https://jrelibrary.com/2091-diana-walsh-pasulka/')),
('podcasts-joe-rogan-experience-2194-luis-elizondo','podcasts','Joe Rogan Experience #2194 — Luis Elizondo',2024,'Joe Rogan Experience · Luis Elizondo','https://jrelibrary.com/2194-luis-elizondo/','2024',dd_media_private.title_key('Joe Rogan Experience #2194 — Luis Elizondo'),dd_media_private.url_key('https://jrelibrary.com/2194-luis-elizondo/')),
('podcasts-joe-rogan-experience-2244-ryan-graves','podcasts','Joe Rogan Experience #2244 — Ryan Graves',2024,'Joe Rogan Experience · Ryan Graves','https://jrelibrary.com/2244-ryan-graves/','2024',dd_media_private.title_key('Joe Rogan Experience #2244 — Ryan Graves'),dd_media_private.url_key('https://jrelibrary.com/2244-ryan-graves/')),
('podcasts-joe-rogan-experience-2246-james-fox','podcasts','Joe Rogan Experience #2246 — James Fox',2024,'Joe Rogan Experience · James Fox','https://jrelibrary.com/2246-james-fox/','2024',dd_media_private.title_key('Joe Rogan Experience #2246 — James Fox'),dd_media_private.url_key('https://jrelibrary.com/2246-james-fox/')),
('podcasts-joe-rogan-experience-2288-jacques-vall-e','podcasts','Joe Rogan Experience #2288 — Jacques Vallée',2025,'Joe Rogan Experience · Jacques Vallée','https://jrelibrary.com/2288-jacques-vallee/','2025',dd_media_private.title_key('Joe Rogan Experience #2288 — Jacques Vallée'),dd_media_private.url_key('https://jrelibrary.com/2288-jacques-vallee/')),
('podcasts-joe-rogan-experience-2314-hal-puthoff','podcasts','Joe Rogan Experience #2314 — Hal Puthoff',2025,'Joe Rogan Experience · Hal Puthoff','https://jrelibrary.com/2314-hal-puthoff/','2025',dd_media_private.title_key('Joe Rogan Experience #2314 — Hal Puthoff'),dd_media_private.url_key('https://jrelibrary.com/2314-hal-puthoff/')),
('podcasts-joe-rogan-experience-2331-jesse-michels','podcasts','Joe Rogan Experience #2331 — Jesse Michels',2025,'Joe Rogan Experience · Jesse Michels','https://jrelibrary.com/2331-jesse-michels/','2025',dd_media_private.title_key('Joe Rogan Experience #2331 — Jesse Michels'),dd_media_private.url_key('https://jrelibrary.com/2331-jesse-michels/')),
('podcasts-joe-rogan-experience-2372-garry-nolan','podcasts','Joe Rogan Experience #2372 — Garry Nolan',2025,'Joe Rogan Experience · Garry Nolan','https://jrelibrary.com/2372-garry-nolan/','2025',dd_media_private.title_key('Joe Rogan Experience #2372 — Garry Nolan'),dd_media_private.url_key('https://jrelibrary.com/2372-garry-nolan/')),
('podcasts-joe-rogan-experience-2479-bob-lazar-luigi-vendittelli','podcasts','Joe Rogan Experience #2479 — Bob Lazar & Luigi Vendittelli',2026,'Joe Rogan Experience · Bob Lazar & Luigi Vendittelli','https://jrelibrary.com/2479-bob-lazar-luigi-vendittelli/','2026',dd_media_private.title_key('Joe Rogan Experience #2479 — Bob Lazar & Luigi Vendittelli'),dd_media_private.url_key('https://jrelibrary.com/2479-bob-lazar-luigi-vendittelli/')),
('podcasts-joe-rogan-experience-2560-david-grusch','podcasts','Joe Rogan Experience #2560 — David Grusch',2026,'Joe Rogan Experience · David Grusch','https://jrelibrary.com/2560-david-grusch/','2026',dd_media_private.title_key('Joe Rogan Experience #2560 — David Grusch'),dd_media_private.url_key('https://jrelibrary.com/2560-david-grusch/')),
('podcasts-weaponized-episode-1','podcasts','WEAPONIZED — Episode #1',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-1','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #1'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-1')),
('podcasts-weaponized-episode-2','podcasts','WEAPONIZED — Episode #2',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-2','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #2'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-2')),
('podcasts-weaponized-episode-3','podcasts','WEAPONIZED — Episode #3',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-3','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #3'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-3')),
('podcasts-weaponized-episode-4','podcasts','WEAPONIZED — Episode #4',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-4','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #4'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-4')),
('podcasts-weaponized-episode-5','podcasts','WEAPONIZED — Episode #5',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-5','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #5'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-5')),
('podcasts-weaponized-episode-6','podcasts','WEAPONIZED — Episode #6',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-6','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #6'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-6')),
('podcasts-weaponized-episode-7','podcasts','WEAPONIZED — Episode #7',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-7','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #7'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-7')),
('podcasts-weaponized-episode-8','podcasts','WEAPONIZED — Episode #8',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-8','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #8'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-8')),
('podcasts-weaponized-episode-9','podcasts','WEAPONIZED — Episode #9',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-9','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #9'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-9')),
('podcasts-weaponized-episode-10','podcasts','WEAPONIZED — Episode #10',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-10','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #10'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-10')),
('podcasts-weaponized-episode-11','podcasts','WEAPONIZED — Episode #11',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-11','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #11'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-11')),
('podcasts-weaponized-episode-12','podcasts','WEAPONIZED — Episode #12',null,'Jeremy Corbell & George Knapp · WEAPONIZED','https://www.weaponizedpodcast.com/episodes-1/episode-number-12','2023–2024',dd_media_private.title_key('WEAPONIZED — Episode #12'),dd_media_private.url_key('https://www.weaponizedpodcast.com/episodes-1/episode-number-12'))
on conflict(id) do update set public_url=coalesce(public.dd_media_titles.public_url,excluded.public_url),publication_url_key=coalesce(public.dd_media_titles.publication_url_key,excluded.publication_url_key),display_year=excluded.display_year;
create unique index dd_media_publication_url on public.dd_media_titles(publication_url_key) where publication_url_key is not null;
create unique index dd_media_publication_name on public.dd_media_titles(category,publication_title_key);
create index dd_media_title_submitter on public.dd_media_titles(submitted_by);
create index dd_media_title_review on public.dd_media_titles(created_at) where status='pending';
revoke all on public.dd_media_votes from public,anon,authenticated;
grant select,insert,update,delete on public.dd_media_votes to authenticated;
-- Public catalogue reads never expose submitter identity, notes or reporters.
revoke select on public.dd_media_titles from anon,authenticated;
grant select(id,category,title,release_year,creator,public_url,display_year,source_kind,status,created_at) on public.dd_media_titles to anon,authenticated;
alter policy dd_media_titles_read on public.dd_media_titles using(status='approved' or submitted_by=(select auth.uid()));
create table public.dd_media_reports(
 title_id text not null references public.dd_media_titles(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 report_round integer not null check(report_round>=0),
 reason text not null check(reason in ('spam','abuse','privacy','harassment','harmful','other')),
 created_at timestamptz not null default now(),primary key(title_id,reporter_id,report_round)
);
create index dd_media_reporter_date on public.dd_media_reports(reporter_id,created_at desc);
alter table public.dd_media_reports enable row level security;
revoke all on public.dd_media_reports from public,anon,authenticated;
grant select on public.dd_media_reports to authenticated;
create policy dd_media_report_own on public.dd_media_reports for select to authenticated using(reporter_id=(select auth.uid()));
alter table public.dd_media_suggestions drop constraint dd_media_suggestions_status_check;
alter table public.dd_media_suggestions add constraint dd_media_suggestions_status_check check(status in ('pending','reviewed','declined','published'));
alter policy dd_media_suggestion_insert on public.dd_media_suggestions with check(user_id=(select auth.uid()) and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) and status='published' and reviewed_by is null and reviewed_at is null);
create or replace function dd_media_private.guard_suggestion() returns trigger language plpgsql security definer set search_path='' as $$
declare normalized text; title_key text; url_key text;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Registered account required';end if;
 if TG_OP='INSERT' then
  if new.user_id<>auth.uid() then raise exception 'Account mismatch';end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('dd-media-suggestion:'||new.user_id::text,0));
  if (select count(*) from public.dd_media_suggestions where user_id=new.user_id and created_at>now()-interval '24 hours')>=10 then raise exception 'Suggestion limit reached';end if;
  new.title:=btrim(new.title);new.notes:=btrim(new.notes);normalized:=dd_media_private.clean_url(new.url);
  title_key:=dd_media_private.title_key(new.title);if title_key='' then raise exception 'Enter a valid title';end if;url_key:=dd_media_private.url_key(normalized);
  if exists(select 1 from public.dd_media_titles t where t.publication_url_key=url_key or (t.category=new.category and t.publication_title_key=title_key)) then raise exception 'This title or link is already added';end if;
  new.url:=normalized;new.status:='published';new.created_at:=now();new.reviewed_at:=null;new.reviewed_by:=null;
  insert into public.dd_media_titles(id,category,title,creator,public_url,publication_title_key,publication_url_key,source_kind,submitted_by)
   values('member-'||new.id::text,new.category,new.title,'Community suggestion',normalized,title_key,url_key,'member',new.user_id);
 else
  if not public.dd_discussions_is_owner() then raise exception 'Site owner required';end if;
  if new.status not in ('reviewed','declined','published') then raise exception 'Invalid review status';end if;
  new.reviewed_at:=now();new.reviewed_by:=auth.uid();
 end if;
 return new;
end $$;
create function public.dd_media_catalogue() returns table(id text,category text,title text,release_year integer,creator text,public_url text,display_year text,source_kind text,created_at timestamptz)
 language sql stable security invoker set search_path='' as $$
 select t.id,t.category,t.title,t.release_year,t.creator,t.public_url,t.display_year,t.source_kind,t.created_at
 from public.dd_media_titles t where t.status='approved' order by t.created_at desc,t.id limit 1000
$$;
revoke all on function public.dd_media_catalogue() from public,anon,authenticated;
grant execute on function public.dd_media_catalogue() to anon,authenticated;
create function dd_media_private.report_title(p_id text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare viewer uuid:=auth.uid(); item public.dd_media_titles%rowtype; flags bigint;
begin
 if viewer is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Registered account required';end if;
 if p_reason is null or p_reason not in ('spam','abuse','privacy','harassment','harmful','other') then raise exception 'Choose a valid report reason';end if;
 select * into item from public.dd_media_titles t where t.id=p_id for update;
 if not found or item.status<>'approved' then raise exception 'This title is unavailable or already hidden';end if;
 if item.submitted_by=viewer then raise exception 'You cannot report your own suggestion';end if;
 if exists(select 1 from public.dd_media_reports r where r.title_id=p_id and r.reporter_id=viewer and r.report_round=item.moderation_round) then return jsonb_build_object('reported',false,'already_reported',true,'hidden',false);end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('dd-media-report:'||viewer::text,0));
 if (select count(*) from public.dd_media_reports r where r.reporter_id=viewer and r.created_at>now()-interval '24 hours')>=30 then raise exception 'Reporting limit reached';end if;
 insert into public.dd_media_reports(title_id,reporter_id,report_round,reason) values(p_id,viewer,item.moderation_round,p_reason);
 select count(*) into flags from public.dd_media_reports r where r.title_id=p_id and r.report_round=item.moderation_round;
 if flags>=5 then update public.dd_media_titles set status='pending' where id=p_id;end if;
 return jsonb_build_object('reported',true,'already_reported',false,'hidden',flags>=5);
end $$;
create function dd_media_private.review_queue() returns table(id text,category text,title text,url text,report_count bigint)
 language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.dd_discussions_is_owner() then raise exception 'Site owner required';end if;
 return query select t.id,t.category,t.title,t.public_url,count(r.reporter_id) from public.dd_media_titles t
 join public.dd_media_reports r on r.title_id=t.id and r.report_round=t.moderation_round
 where t.status='pending' group by t.id order by min(r.created_at) limit 100;
end $$;
create table dd_media_private.review_actions(
 id bigint generated always as identity primary key,
 title_id text not null references public.dd_media_titles(id) on delete cascade,
 reviewer_id uuid references auth.users(id) on delete set null,
 decision text not null check(decision in ('restore','remove')),
 report_round integer not null,reviewed_at timestamptz not null default now()
);
create index dd_media_review_action_title on dd_media_private.review_actions(title_id);
create index dd_media_review_action_reviewer on dd_media_private.review_actions(reviewer_id);
alter table dd_media_private.review_actions enable row level security;
revoke all on dd_media_private.review_actions from public,anon,authenticated;
create function dd_media_private.review_title(p_id text,p_decision text) returns boolean language plpgsql security definer set search_path='' as $$
declare item public.dd_media_titles%rowtype;
begin
 if auth.uid() is null or not public.dd_discussions_is_owner() then raise exception 'Site owner required';end if;
 if p_decision is null or p_decision not in ('restore','remove') then raise exception 'Choose restore or remove';end if;
 select * into item from public.dd_media_titles t where t.id=p_id for update;
 if not found or item.status<>'pending' then return false;end if;
 insert into dd_media_private.review_actions(title_id,reviewer_id,decision,report_round) values(p_id,auth.uid(),p_decision,item.moderation_round);
 update public.dd_media_titles set status=case when p_decision='restore' then 'approved' else 'rejected' end,
  moderation_round=moderation_round+case when p_decision='restore' then 1 else 0 end where id=p_id;
 update public.dd_media_suggestions set status=case when p_decision='restore' then 'published' else 'declined' end
 where 'member-'||id::text=p_id;
 return true;
end $$;
grant usage on schema dd_media_private to authenticated;
revoke all on function dd_media_private.report_title(text,text),dd_media_private.review_queue(),dd_media_private.review_title(text,text) from public,anon,authenticated;
grant execute on function dd_media_private.report_title(text,text),dd_media_private.review_queue(),dd_media_private.review_title(text,text) to authenticated;
create function public.dd_media_report(p_id text,p_reason text) returns jsonb language sql security invoker set search_path='' as $$select dd_media_private.report_title(p_id,p_reason)$$;
create function public.dd_media_review_queue() returns table(id text,category text,title text,url text,report_count bigint) language sql stable security invoker set search_path='' as $$select * from dd_media_private.review_queue()$$;
create function public.dd_media_review(p_id text,p_decision text) returns boolean language sql security invoker set search_path='' as $$select dd_media_private.review_title(p_id,p_decision)$$;
revoke all on function public.dd_media_report(text,text),public.dd_media_review_queue(),public.dd_media_review(text,text) from public,anon,authenticated;
grant execute on function public.dd_media_report(text,text),public.dd_media_review_queue(),public.dd_media_review(text,text) to authenticated;
-- Legacy pre-publication review cannot publish/remove a separate catalogue row.
revoke execute on function public.dd_media_suggestion_review(uuid,text) from authenticated;
commit;
