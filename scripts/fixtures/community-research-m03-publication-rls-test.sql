-- M03 integrated multi-account tests. Runs ONLY in disposable PostgreSQL 17.
-- Requires M02 bootstrap, M02 schema and M03 SQL, in that order.
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');

-- No generic public/anonymous function execution, no writable editions.
do $check$
begin
 if has_function_privilege('anon','public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)','execute')
 or has_function_privilege('anon','public.dd_cr_withdraw_paper(uuid,integer,boolean)','execute')
 or has_function_privilege('anon','dd_cr_private.publish_saved_copy(uuid,integer,boolean,uuid,integer)','execute')
 or has_function_privilege('anon','dd_cr_private.withdraw_paper(uuid,integer,boolean)','execute') then
  raise exception 'Anonymous role can invoke privileged publishing functions';
 end if;
 if has_table_privilege('authenticated','public.dd_cr_publications','insert')
 or has_table_privilege('authenticated','public.dd_cr_editions','insert')
 or has_table_privilege('authenticated','dd_cr_private.publication_events','select') then
  raise exception 'Privileged tables are directly available to clients';
 end if;
 if not has_function_privilege('authenticated','public.dd_cr_publish_copy(uuid,integer,boolean,uuid,integer)','execute')
 then raise exception 'Registered publish wrapper not callable';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on p.pronamespace=n.oid
     where n.nspname='public' and p.proname in ('dd_cr_publish_copy','dd_cr_withdraw_paper')
       and p.prosecdef) then
  raise exception 'Exposed public function must NEVER use SECURITY DEFINER';
 end if;
end $check$;

set role anon;
set request.jwt.claims='{}';
do $check$
begin
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',1,true);
  raise exception 'Guest published a paper';
 exception when insufficient_privilege then null; end;
end $check$;
reset role;

set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":true}';
do $check$
begin
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',1,true);
  raise exception 'Anonymous authenticated session published';
 exception when insufficient_privilege then null; end;
end $check$;
reset role;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
-- Author A prepares a PRIVATE draft, not a W.NE source.
insert into public.dd_cr_drafts(id,author_id,title,abstract,body,paper_type,source_urls)
values('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'Original investigation of a historical sighting',
 'This original report compares attributed primary sources, identifies gaps and discusses alternative explanations.',
 repeat('Every claim is attributed to a dated primary source. ',7),
 'case',array['https://www.archives.gov/research']);
set role authenticated;

-- A private draft may contain unsafe but syntactically HTTPS-like URLs.
-- The publication boundary must independently reject them.
do $check$
declare v_draft uuid;
begin
 insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
 values('Research from a private network URL',
        'A complete abstract used to test unsuitable original-source URLs.',
        repeat('Original study text and attributed research methods. ',7),
        'case',array['https://localhost/private'])
 returning id into v_draft;
 begin
   perform public.dd_cr_publish_copy(v_draft,1,true);
   raise exception 'Private network source passed publication validation';
 exception when check_violation then null; end;
 insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
 values('Research with credentials in a URL',
        'A second complete abstract used to test credential-bearing URLs.',
        repeat('Verified source and method details for test research. ',7),
        'case',array['https://user:password@example.org/private'])
 returning id into v_draft;
 begin
   perform public.dd_cr_publish_copy(v_draft,1,true);
   raise exception 'Credential-bearing URL passed publication validation';
 exception when check_violation then null; end;
end $check$;

-- Public paper creation must not be possible without positive consent.
do $check$
begin
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',1,false);
  raise exception 'Unconsented publication succeeded';
 exception when insufficient_privilege then null;end;
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',7,true);
  raise exception 'Outdated saved draft unexpectedly published';
 exception when serialization_failure then null;end;
 if (select count(*) from public.dd_cr_publications)<>0 then
  raise exception 'Invalid publication attempt created public row';
 end if;
end $check$;

do $check$
declare result jsonb;
begin
 result:=public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',1,true);
 if result->>'status'<>'published' or (result->>'edition')::int<>1 then
  raise exception 'First edition publication failed';
 end if;
 perform pg_catalog.set_config('cr_test.a_paper',result->>'paper_id',false);
 if (select count(*) from public.dd_cr_publications)<>1
 or (select count(*) from public.dd_cr_editions)<>1 then
  raise exception 'Atomic publication did not create exactly one registry row + edition';
 end if;
 if (select count(*) from public.dd_cr_editions
     where paper_id=(result->>'paper_id')::uuid and edition=1
       and title='Original investigation of a historical sighting')<>1 then
  raise exception 'Public edition is not a copy of the saved draft';
 end if;
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',1,true);
  raise exception 'Duplicate first publication succeeded';
 exception when unique_violation then null;end;
 if (select count(*) from public.dd_cr_publications)<>1 then
  raise exception 'Duplicate first publication created extra row';
 end if;
end $check$;

-- User B cannot publish/revise/withdraw User A's content.
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $check$
declare p uuid:=current_setting('cr_test.a_paper')::uuid;
begin
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',1,true);
  raise exception 'Cross-account draft published';
 exception when insufficient_privilege then null;end;
 begin
  perform public.dd_cr_withdraw_paper(p,1,true);
  raise exception 'Cross-account paper withdrawn';
 exception when insufficient_privilege then null;end;
end $check$;

-- B may publish a separate legitimate source-led paper.
-- CI fixture seeds an explicit draft ID as postgres; signed-in writer cannot set ID.
reset role;
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
insert into public.dd_cr_drafts(id,author_id,title,abstract,body,paper_type,source_urls)
values('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 'A separate author examines available records',
 'This report independently reviews an archival publication and notes its unresolved evidence limitations.',
 repeat('A separately attributed analysis and documented source record. ',7),
 'archive',array['https://www.canada.ca/en/library-archives.html']);
set role authenticated;
do $check$
declare result jsonb;
begin
 result:=public.dd_cr_publish_copy('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb',1,true);
 perform pg_catalog.set_config('cr_test.b_paper',result->>'paper_id',false);
end $check$;

-- Only the original A draft may be revised into the linked A paper.
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
update public.dd_cr_drafts set
 body=repeat('This revision adds an independently corroborated primary record. ',7),
 abstract='This updated account includes an additional source and clearly separates the unresolved evidence gaps.'
where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
do $check$
declare p uuid:=current_setting('cr_test.a_paper')::uuid;
begin
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',1,true,p,1);
  raise exception 'Stale private revision accepted';
 exception when serialization_failure then null;end;
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',2,true,p,1);
  raise exception 'Revision cooldown bypassed';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',2,true,
    current_setting('cr_test.b_paper')::uuid,1);
  raise exception 'Draft illegally linked to another paper';
 exception when insufficient_privilege then null;end;
end $check$;

-- CI-only privileged clock fixture moves the prior revision beyond 5-minute
-- cooldown. This manipulation is NOT available to a site account.
reset role;
update public.dd_cr_publications set changed_at=clock_timestamp()-interval '6 minutes'
 where id=current_setting('cr_test.a_paper')::uuid;
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
declare p uuid:=current_setting('cr_test.a_paper')::uuid; result jsonb;
begin
 result:=public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',2,true,p,1);
 if (result->>'edition')::int<>2 then raise exception 'Corrected edition not created';end if;
 if (select count(*) from public.dd_cr_editions where paper_id=p)<>2 then
  raise exception 'Revision failed to preserve first edition';end if;
 if (select current_edition from public.dd_cr_publications where id=p)<>2 then
  raise exception 'Current public edition pointer was not advanced';end if;
 if (select body from public.dd_cr_editions where paper_id=p and edition=1)
    <>repeat('Every claim is attributed to a dated primary source. ',7) then
  raise exception 'Original public edition was overwritten';end if;
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',2,true,p,1);
  raise exception 'Stale public edition accepted';
 exception when serialization_failure then null;end;
end $check$;

-- A third party sees the published revisions but not private identities or mappings.
reset role;
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 if (select count(*) from public.dd_cr_editions
     where paper_id=current_setting('cr_test.a_paper')::uuid)<>2 then
  raise exception 'Public revision history is not visible';end if;
 begin
  perform count(*) from dd_cr_private.draft_papers;
  raise exception 'Guest read private publication mapping';
 exception when insufficient_privilege then null;end;
end $check$;

-- Positive confirmation and exact edition are required to withdraw.
reset role;
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
declare p uuid:=current_setting('cr_test.a_paper')::uuid; result jsonb;
begin
 begin
  perform public.dd_cr_withdraw_paper(p,2,false);
  raise exception 'Unconsented withdrawal succeeded';
 exception when insufficient_privilege then null;end;
 begin
  perform public.dd_cr_withdraw_paper(p,1,true);
  raise exception 'Stale edition withdrawal succeeded';
 exception when serialization_failure then null;end;
 result:=public.dd_cr_withdraw_paper(p,2,true);
 if result->>'status'<>'withdrawn' then
  raise exception 'Withdrawal action was not recorded';end if;
 if (select status from public.dd_cr_publications where id=p)<>'withdrawn' then
  raise exception 'Paper remains public after withdrawal';end if;
 begin
  perform public.dd_cr_withdraw_paper(p,2,true);
  raise exception 'Repeated withdrawn action succeeded';
 exception when insufficient_privilege then null;end;
 begin
  perform public.dd_cr_publish_copy('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',2,true,p,2);
  raise exception 'Withdrawn content re-published automatically';
 exception when insufficient_privilege then null;end;
end $check$;

reset role;
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 if exists (select 1 from public.dd_cr_editions e
  where e.paper_id=current_setting('cr_test.a_paper')::uuid) then
  raise exception 'Withdrawn paper history leaked to guest';end if;
 if exists (select 1 from public.dd_cr_publications
  where id=current_setting('cr_test.a_paper')::uuid) then
  raise exception 'Withdrawn paper registry leaked to guest';end if;
 if (select count(*) from public.dd_cr_publications)<>1 then
  raise exception 'Other author published paper unexpectedly hidden';end if;
end $check$;

-- Confirm internal consent events are protected and cannot be forged by clients.
reset role;
do $check$
begin
 if (select count(*) from dd_cr_private.publication_events)<>4 then
  raise exception 'Expected exactly 4 publication/revision/withdraw audit entries';
 end if;
 if (select count(*) from dd_cr_private.publication_events
     where actor_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>3 then
  raise exception 'A consent event is missing or attributed to wrong author';end if;
 if has_table_privilege('authenticated','dd_cr_private.publication_events','insert') then
  raise exception 'Client can forge consent audit';end if;
end $check$;
-- New-paper quota counts withdrawn papers too. A has already published once;
-- A's two additional papers are permitted, then the fourth is denied.
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
declare v_draft uuid; v_result jsonb; i integer;
begin
 for i in 1..3 loop
  insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
  values('Additional independent archive study '||i,
         'This new study describes the historical research method and attribution.',
         repeat('This original public-record analysis cites its source precisely. ',6),
         'archive',array['https://www.archives.gov/research'])
   returning id into v_draft;
  if i<=2 then
   v_result:=public.dd_cr_publish_copy(v_draft,1,true);
   if v_result->>'status'<>'published' then
    raise exception 'Allowed paper publication failed';end if;
  else
   begin
    perform public.dd_cr_publish_copy(v_draft,1,true);
    raise exception 'Four new publications in one day were permitted';
   exception when invalid_parameter_value then null;end;
  end if;
 end loop;
 if (select count(*) from public.dd_cr_publications p
     where p.author_id=auth.uid())<>3 then
  raise exception 'Daily quota failed to protect publication registry';
 end if;
end $check$;
reset role;
select 'PASS M03: consent, cross-user isolation, immutable editions, withdrawal, private URLs rejected, quotas enforced and private audit' as result;
