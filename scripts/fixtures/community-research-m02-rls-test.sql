-- Synthetic account / public paper fixtures. No actual Disclosure Desk data.
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
insert into public.dd_cr_publications (id,author_id,status,current_edition) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','published',2),
 ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','withdrawn',1),
 ('33333333-3333-4333-8333-333333333333','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','published',1);
insert into public.dd_cr_editions (paper_id,edition,title,abstract,body,paper_type,source_urls) values
 ('11111111-1111-4111-8111-111111111111',1,'Original publication 2026','Testing original public research entry with documentation.',repeat('Original evidence and source review. ',10),'case',array['https://archives.gov/example']),
 ('11111111-1111-4111-8111-111111111111',2,'Corrected publication 2026','Testing visible corrected research edition with history.',repeat('Revised evidence and source review. ',10),'case',array['https://archives.gov/example']),
 ('22222222-2222-4222-8222-222222222222',1,'Withdrawn publication 2026','Testing withdrawn research information from authors.',repeat('A report withdrawn by an author. ',10),'archive',array[]::text[]),
 ('33333333-3333-4333-8333-333333333333',1,'Other author publication','Testing independent ownership and private feedback.',repeat('An independent report of source findings. ',10),'methods',array[]::text[]);

-- No verified user: public published papers and editions only.
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 if (select count(*) from public.dd_cr_publications)<>2 then raise exception 'Guest must see only published paper registries'; end if;
 if (select count(*) from public.dd_cr_editions)<>3 then raise exception 'Guest sees both public revisions and no withdrawn edition'; end if;
 begin
  perform count(*) from public.dd_cr_drafts;
  raise exception 'Guest must not be able to read author drafts';
 exception when insufficient_privilege then null; end;
 begin
  perform count(*) from public.dd_cr_votes;
  raise exception 'Guest must not be able to read private votes';
 exception when insufficient_privilege then null; end;
 begin
  perform count(*) from public.dd_cr_reports;
  raise exception 'Guest must not be able to read private flags';
 exception when insufficient_privilege then null; end;
end $check$;

-- Authenticated role with an anonymous session is NOT a registered author.
reset role;
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":true}';
do $check$
begin
 if (select count(*) from public.dd_cr_publications)<>2 then raise exception 'Anonymous session must not see withdrawn owner paper'; end if;
 begin
  insert into public.dd_cr_drafts(title) values('Anonymous paper draft');
  raise exception 'Anonymous auth session created a private draft';
 exception when insufficient_privilege or check_violation then null; end;
 begin
  insert into public.dd_cr_votes (paper_id,value) values ('11111111-1111-4111-8111-111111111111',1);
  raise exception 'Anonymous authenticated user voted';
 exception when insufficient_privilege or check_violation then null; end;
 begin
  insert into public.dd_cr_comments (paper_id,category,body) values('11111111-1111-4111-8111-111111111111','question','Anonymous question');
  raise exception 'Anonymous authenticated user commented';
 exception when insufficient_privilege or check_violation then null; end;
end $check$;

-- Fully registered author A; separate private save and server-controlled publication.
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
 values('Author A private investigation','Private abstract',repeat('Unpublished research notes. ',7),'case',array['https://example.org/source']);
do $check$
begin
 if (select count(*) from public.dd_cr_drafts)<>1 then raise exception 'Author cannot access own draft'; end if;
 if (select count(*) from public.dd_cr_publications)<>3 then raise exception 'Author cannot see own withdrawn paper'; end if;
 if (select count(*) from public.dd_cr_editions)<>4 then raise exception 'Author cannot read own revision history'; end if;
 begin
  insert into public.dd_cr_publications(author_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  raise exception 'Direct public posting was permitted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.dd_cr_drafts(author_id,title) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Cross-account spoofed draft');
  raise exception 'Draft author spoofing was permitted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.dd_cr_drafts(title,source_urls) values('Research with unsafe URL',array['javascript:alert(1)']);
  raise exception 'Unsafe source protocol accepted';
 exception when check_violation then null; end;
end $check$;
update public.dd_cr_drafts set body='Edited research content'
 where title='Author A private investigation';
do $check$
begin
 if (select revision from public.dd_cr_drafts where title='Author A private investigation')<>2 then
  raise exception 'Draft revision must increment on author update';
 end if;
 begin
  update public.dd_cr_drafts set author_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  raise exception 'Author ownership was writable';
 exception when insufficient_privilege then null; end;
 begin
  update public.dd_cr_editions set body='rewritten';
  raise exception 'Published edition content was editable';
 exception when insufficient_privilege then null; end;
end $check$;

-- Registered author B cannot see/edit A's drafts or withdrawn papers.
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $check$
declare touched int;
begin
 if (select count(*) from public.dd_cr_drafts)<>0 then raise exception 'Cross-user draft read leaked';end if;
 if (select count(*) from public.dd_cr_publications)<>2 then raise exception 'Withdrawn author A paper leaked';end if;
 if (select count(*) from public.dd_cr_editions)<>3 then raise exception 'Withdrawn author A edition leaked';end if;
 update public.dd_cr_drafts set title='Stolen by B' where true;
 get diagnostics touched=row_count;
 if touched<>0 then raise exception 'Cross-user draft update permitted';end if;
 delete from public.dd_cr_drafts where true;
 get diagnostics touched=row_count;
 if touched<>0 then raise exception 'Cross-user draft deletion permitted';end if;
end $check$;
insert into public.dd_cr_votes(paper_id,value)
 values('11111111-1111-4111-8111-111111111111',1);
insert into public.dd_cr_comments(paper_id,category,body)
 values('11111111-1111-4111-8111-111111111111','counter','A fair counter-evidence comment');
insert into public.dd_cr_reports(paper_id,reason,details)
 values('11111111-1111-4111-8111-111111111111','source','Please provide original document reference.');
do $check$
begin
 if (select count(*) from public.dd_cr_votes)<>1 then raise exception 'Owner voter cannot read own private vote'; end if;
 if (select count(*) from public.dd_cr_reports)<>1 then raise exception 'Reporter cannot read own report'; end if;
 begin
  insert into public.dd_cr_votes(paper_id,value)
   values('11111111-1111-4111-8111-111111111111',-1);
  raise exception 'Duplicate voter registration accepted';
 exception when unique_violation then null; end;
 begin
  insert into public.dd_cr_votes(paper_id,value)
   values('22222222-2222-4222-8222-222222222222',1);
  raise exception 'Member voted on withdrawn paper';
 exception when insufficient_privilege or check_violation then null; end;
 begin
  insert into public.dd_cr_comments(paper_id,category,body)
   values('22222222-2222-4222-8222-222222222222','source','Source for withdrawn report');
  raise exception 'Member commented on withdrawn paper';
 exception when insufficient_privilege or check_violation then null; end;
 begin
  insert into public.dd_cr_reports(paper_id,reason)
   values('11111111-1111-4111-8111-111111111111','source');
  raise exception 'Duplicate report accepted';
 exception when unique_violation then null; end;
end $check$;

-- A cannot see B's vote or report, but can see B's public on-topic comment.
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
begin
 if (select count(*) from public.dd_cr_votes)<>0 then raise exception 'Voter identities leaked';end if;
 if (select count(*) from public.dd_cr_reports)<>0 then raise exception 'Reporter identity leaked';end if;
 if (select count(*) from public.dd_cr_comments)<>1 then raise exception 'Public feedback not visible';end if;
end $check$;
insert into public.dd_cr_comments(paper_id,parent_id,category,body)
 select '11111111-1111-4111-8111-111111111111',id,'source','A supporting original archive link'
 from public.dd_cr_comments where category='counter' limit 1;
do $check$
begin
 if (select count(*) from public.dd_cr_comments)<>2 then raise exception 'Same-paper reply failed';end if;
 begin
  insert into public.dd_cr_comments(paper_id,parent_id,category,body)
   select '33333333-3333-4333-8333-333333333333',id,'question','Improper cross-paper child'
   from public.dd_cr_comments where category='counter' limit 1;
  raise exception 'Cross-paper replies were allowed';
 exception when check_violation then null; end;
end $check$;

-- Test authentication-free public access to visible comments; private votes hidden.
reset role;
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 if (select count(*) from public.dd_cr_comments)<>2 then raise exception 'Public moderated comments unavailable';end if;
end $check$;
reset role;

-- Owner deletion must cascade away drafts, public papers, user comments/votes/reports.
delete from auth.users where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
do $check$
begin
 if exists(select 1 from public.dd_cr_votes) then raise exception 'Votes survived account erasure';end if;
 if exists(select 1 from public.dd_cr_reports) then raise exception 'Reports survived account erasure';end if;
 if exists(select 1 from public.dd_cr_publications where id='33333333-3333-4333-8333-333333333333') then raise exception 'Author publication survived account erasure';end if;
 if exists(select 1 from public.dd_cr_comments where category='counter') then raise exception 'Account owner comment survived erasure';end if;
end $check$;

-- Confirm no one can insert public papers via anonymous/registered grants.
do $check$
begin
 if has_table_privilege('anon','public.dd_cr_publications','INSERT') or
    has_table_privilege('authenticated','public.dd_cr_publications','INSERT') or
    has_table_privilege('authenticated','public.dd_cr_editions','INSERT') then
  raise exception 'Publications are writable before an approved publish service exists';
 end if;
 if exists(select 1 from pg_policies where schemaname='public'
   and tablename like 'dd_cr_%' and cmd='ALL' and qual='true') then
  raise exception 'Unrestricted RLS policy found';
 end if;
end $check$;
select 'PASS M02: guest/anonymous/2 members, draft isolation, immutability, published/withdrawn editions, private votes and reports, structured comments, cross-paper reply, account deletion, no public publish' as result;
