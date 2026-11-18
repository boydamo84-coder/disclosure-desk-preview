-- M05 isolated auth/RLS archive pagination: applied ONLY to disposable Postgres.
-- No real Disclosure Desk author, account or research data.
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
select 'Private owner A investigation '||n,
       'Independently checked archive sources for study '||n,
       repeat('This text is private to the original author. ',6),
       'archive',
       array['https://www.archives.gov/research']
from generate_series(1,65) as n;
do $check$
declare total integer; seen integer; count_page4 integer;
begin
 select count(*) into total from public.dd_cr_drafts;
 if total<>65 then raise exception 'A did not create 65 owner-scoped drafts';end if;
 select count(*) into seen from
   (select id from public.dd_cr_drafts
    order by updated_at desc,id desc limit 20 offset 20) t;
 if seen<>20 then raise exception 'Second page of drafts is incomplete';end if;
 select count(*) into count_page4 from
   (select id from public.dd_cr_drafts
    order by updated_at desc,id desc limit 20 offset 60) t;
 if count_page4<>5 then raise exception 'Fourth page should have exactly five drafts';end if;
 if exists(select 1 from public.dd_cr_drafts limit 20 offset 65) then
  raise exception 'Private draft pagination leaks past the archive end';end if;
end $check$;

set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $check$
begin
 if (select count(*) from public.dd_cr_drafts)<>0 then
  raise exception 'Member B saw member A private archive';end if;
end $check$;
insert into public.dd_cr_drafts(title,body)
select 'B own research report '||n,repeat('B private source draft. ',8)
from generate_series(1,4) n;
do $check$
begin
 if (select count(*) from public.dd_cr_drafts)<>4 then
  raise exception 'B cannot see exactly four of their own drafts';end if;
end $check$;

set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
begin
 if (select count(*) from public.dd_cr_drafts)<>65 then
  raise exception 'B papers crossed into A archive';end if;
end $check$;
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":true}';
do $check$
begin
 if (select count(*) from public.dd_cr_drafts)<>0 then
  raise exception 'Anonymous auth account read member research';end if;
end $check$;
reset role;
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 begin
  perform count(*) from public.dd_cr_drafts;
  raise exception 'Guest selected private drafts';
 exception when insufficient_privilege then null;end;
end $check$;
reset role;
select 'PASS M05: 65 owner A + four owner B private drafts; 20-row pages, final five, guest/anon/cross-user exclusions' as result;
