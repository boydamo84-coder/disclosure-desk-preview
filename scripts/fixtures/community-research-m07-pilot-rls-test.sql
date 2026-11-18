-- M07: synthetic only. Must run after M06 + M07 schema in DISPOSABLE PostgreSQL.
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');

do $db$
begin
 if (select count(*) from dd_cr_private.pilot_members)<>0
 then raise exception 'Pilot launch was not empty by default'; end if;
 if has_table_privilege('anon','public.dd_cr_drafts','SELECT')
 or has_function_privilege('anon','public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)','EXECUTE')
 or has_table_privilege('authenticated','dd_cr_private.pilot_members','SELECT')
 then raise exception 'Pilot has public or member roster exposure';end if;
end $db$;

-- Third permanent account is not invited and must NOT read, write or call RPCs.
set role authenticated;
set request.jwt.claims='{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","is_anonymous":false}';
do $deny$
begin
 if (select count(*) from public.dd_cr_drafts)<>0 then
  raise exception 'Nonpilot saw private drafts';end if;
 if dd_cr_private.is_pilot() then raise exception 'Nonpilot gained pilot status';end if;
 begin
  insert into public.dd_cr_drafts(title) values('Uninvited research draft');
  raise exception 'Nonpilot inserted draft';
 exception when insufficient_privilege then null;end;
 begin
  perform public.dd_cr_my_papers();
  raise exception 'Nonpilot called private portfolio RPC';
 exception when insufficient_privilege then null;end;
end $deny$;

reset role;
insert into dd_cr_private.pilot_members(user_id)
 values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
        ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
do $roster$
begin
 if (select count(*) from dd_cr_private.pilot_members)<>2 then
  raise exception 'Two pilot accounts not enrolled';end if;
end $roster$;

set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $author$
declare d uuid; p jsonb;
begin
 if not dd_cr_private.is_pilot() then raise exception 'Pilot A not authorised';end if;
 insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
 values('Private historical archive pilot report',
  'This original report tests independent public archive evidence attribution.',
  repeat('This is synthetic research content with primary sources and alternative explanations. ',6),
  'archive',array['https://www.archives.gov/research'])
 returning id into d;
 perform pg_catalog.set_config('pilot_test.draft',d::text,false);
 if (select count(*) from public.dd_cr_drafts)<>1 then
  raise exception 'Pilot did not save private draft';end if;
 begin
  perform public.dd_cr_publish_copy(d,1,false);
  raise exception 'Unconsented publication was accepted';
 exception when insufficient_privilege then null;end;
 p:=public.dd_cr_publish_copy(d,1,true);
 perform pg_catalog.set_config('pilot_test.paper',p->>'paper_id',false);
 if p->>'status'<>'published' or p->>'edition'<>'1' or
  pg_catalog.jsonb_array_length(public.dd_cr_my_papers())<>1 then
  raise exception 'Pilot owner publish/recovery failed';end if;
end $author$;

-- Third user is NOT allowed to see even a published pilot paper.
set request.jwt.claims='{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","is_anonymous":false}';
do $deny$
begin
 if (select count(*) from public.dd_cr_publications)<>0 or
    (select count(*) from public.dd_cr_editions)<>0 or
    (select count(*) from public.dd_cr_drafts)<>0
 then raise exception 'Uninvited authenticated member saw pilot research';end if;
 begin
  perform public.dd_cr_publish_copy(current_setting('pilot_test.draft')::uuid,1,true);
  raise exception 'Uninvited member published foreign draft';
 exception when insufficient_privilege then null;end;
end $deny$;

-- B can see A's pilot publication, not the underlying private draft,
-- and cannot rewrite/withdraw it.
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $authorb$
begin
 if not dd_cr_private.is_pilot() then raise exception 'Pilot B not authorised';end if;
 if (select count(*) from public.dd_cr_publications)<>1 or
    (select count(*) from public.dd_cr_editions)<>1 then
  raise exception 'Pilot B cannot see published pilot paper';end if;
 if (select count(*) from public.dd_cr_drafts)<>0 then
  raise exception 'Pilot B can see A private drafts';end if;
 if pg_catalog.jsonb_array_length(public.dd_cr_my_papers())<>0 then
  raise exception 'Pilot B can see A owner portfolio';end if;
 begin
  perform public.dd_cr_withdraw_paper(current_setting('pilot_test.paper')::uuid,1,true);
  raise exception 'Pilot B withdrew A publication';
 exception when insufficient_privilege then null;end;
end $authorb$;

-- Revision (append only) and withdrawal with exact edition.
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
update public.dd_cr_drafts
 set body=repeat('Correction: new attributed records and limitations are documented. ',7)
 where id=current_setting('pilot_test.draft')::uuid;
reset role;
update public.dd_cr_publications set changed_at=clock_timestamp()-interval '6 minutes'
 where id=current_setting('pilot_test.paper')::uuid;
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $revised$
declare p jsonb; wd jsonb;
begin
 p:=public.dd_cr_publish_copy(current_setting('pilot_test.draft')::uuid,2,true,
  current_setting('pilot_test.paper')::uuid,1);
 if p->>'edition'<>'2'
 or (select count(*) from public.dd_cr_editions where paper_id=current_setting('pilot_test.paper')::uuid)<>2
 then raise exception 'Corrected edition was not appended';end if;
 wd:=public.dd_cr_withdraw_paper(current_setting('pilot_test.paper')::uuid,2,true);
 if wd->>'status'<>'withdrawn'
 or (select count(*) from public.dd_cr_publications
    where id=current_setting('pilot_test.paper')::uuid and status='withdrawn')<>1
 then raise exception 'Owner withdrawal failed';end if;
end $revised$;

set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $hidden$
begin
 if (select count(*) from public.dd_cr_editions)<>0 then
  raise exception 'Other pilot still sees withdrawn editions';end if;
end $hidden$;

reset role;
update dd_cr_private.pilot_members set active=false
 where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $disable$
begin
 if dd_cr_private.is_pilot() then raise exception 'Disabled pilot still allowed';end if;
 if (select count(*) from public.dd_cr_drafts)<>0 or
    (select count(*) from public.dd_cr_publications)<>0 then
  raise exception 'Revoked pilot still reads research';end if;
 begin
  perform public.dd_cr_my_papers();
  raise exception 'Revoked pilot still reads owner paper RPC';
 exception when insufficient_privilege then null;end;
 begin
  perform public.dd_cr_withdraw_paper(current_setting('pilot_test.paper')::uuid,2,true);
  raise exception 'Revoked pilot still invokes privileged action';
 exception when insufficient_privilege then null;end;
end $disable$;

reset role;
set role anon;
set request.jwt.claims='{}';
do $guest$
begin
 begin
  perform count(*) from public.dd_cr_publications;
  raise exception 'Guest read limited pilot papers';
 exception when insufficient_privilege then null;end;
 begin
  perform public.dd_cr_my_papers();
  raise exception 'Guest reached owner-only RPC';
 exception when insufficient_privilege then null;end;
end $guest$;
reset role;
select 'PASS M07: default empty allowlist, 2 pilots and third uninvited user, signed-in anonymous/guest exclusion, exact publication revision and withdrawal, immediate revocation' as result;
