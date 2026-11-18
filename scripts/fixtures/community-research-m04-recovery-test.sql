-- Synthetic tests: M02 bootstrap + M02 + M03 + M04 SQL (separate local pg17).
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
do $check$
begin
 if has_function_privilege('anon','public.dd_cr_my_papers(integer,integer)','execute')
 or has_function_privilege('anon','dd_cr_private.list_my_papers(integer,integer)','execute')
 or has_table_privilege('authenticated','dd_cr_private.draft_papers','select')
 then raise exception 'Guest/public private map exposure';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on p.pronamespace=n.oid
    where n.nspname='public' and p.proname='dd_cr_my_papers' and p.prosecdef)
 then raise exception 'Exposed recovery wrapper uses SECURITY DEFINER';end if;
end $check$;
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 begin
  perform public.dd_cr_my_papers();
  raise exception 'Guest could read owner papers';
 exception when insufficient_privilege then null;end;
end $check$;
reset role;
set role authenticated;
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":true}';
do $check$
begin
 begin
  perform public.dd_cr_my_papers();
  raise exception 'Anonymous authenticated user recovered papers';
 exception when insufficient_privilege then null;end;
end $check$;

-- Member A creates two genuinely private saved documents (separate from W.NE).
set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
declare id1 uuid;id2 uuid;response jsonb;
begin
 insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
 values('A source-led independent archive investigation',
        'This research reviews independent public records and records limitations in the historical reporting.',
        repeat('Original records were checked and dated independently. ',7),
        'archive',array['https://www.archives.gov/research'])
 returning id into id1;
 response:=public.dd_cr_publish_copy(id1,1,true);
 perform pg_catalog.set_config('m04.a_paper_one',response->>'paper_id',false);
 perform pg_catalog.set_config('m04.a_draft_one',id1::text,false);
 insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
 values('Another independent record analysis',
        'A second research paper reviews a distinct official publication and checks its source references.',
        repeat('A separate account of the evidence and original documentation. ',7),
        'methods',array['https://www.canada.ca/en/library-archives.html'])
 returning id into id2;
 response:=public.dd_cr_publish_copy(id2,1,true);
 perform pg_catalog.set_config('m04.a_paper_two',response->>'paper_id',false);
 perform pg_catalog.set_config('m04.a_draft_two',id2::text,false);
end $check$;

-- Member B creates another paper, then cannot see A's own listing.
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $check$
declare idb uuid;response jsonb;all_papers jsonb;
begin
 insert into public.dd_cr_drafts(title,abstract,body,paper_type,source_urls)
 values('Separate account source investigation',
        'Another researcher reviews the same subject using their own original sources.',
        repeat('Independent method and independently reviewed public-source record. ',7),
        'case',array['https://www.archives.gov/research'])
 returning id into idb;
 response:=public.dd_cr_publish_copy(idb,1,true);
 perform pg_catalog.set_config('m04.b_paper',response->>'paper_id',false);
 all_papers:=public.dd_cr_my_papers();
 if pg_catalog.jsonb_array_length(all_papers)<>1 then
  raise exception 'Cross-account recovery returned other papers';end if;
 if all_papers->0->>'paper_id'<>response->>'paper_id' then
  raise exception 'B recovered a foreign publication';end if;
 if (all_papers->0 ? 'author_id') or (all_papers->0 ? 'body') then
  raise exception 'Recovery leaked personal author identity or full draft body';end if;
end $check$;

set request.jwt.claims='{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","is_anonymous":false}';
do $check$
declare all_papers jsonb;single jsonb;
begin
 all_papers:=public.dd_cr_my_papers(20,0);
 if pg_catalog.jsonb_array_length(all_papers)<>2 then
  raise exception 'A did not recover both papers';end if;
 if all_papers::text like '%'||current_setting('m04.b_paper')||'%' then
  raise exception 'A saw B paper ID in My Research';end if;
 if not exists(select 1 from pg_catalog.jsonb_array_elements(all_papers) x
   where x->>'paper_id'=current_setting('m04.a_paper_one')
   and x->>'draft_id'=current_setting('m04.a_draft_one')
   and (x->>'current_edition')::integer=1
   and x->>'status'='published') then
   raise exception 'Owner mapping/version lost during recovery';end if;
 single:=public.dd_cr_my_papers(1,1);
 if pg_catalog.jsonb_array_length(single)<>1 or single->0->>'paper_id' is null then
  raise exception 'Published paper pagination failed';end if;
 if pg_catalog.jsonb_array_length(public.dd_cr_my_papers(20,2))<>0 then
  raise exception 'Empty-page recovery did not fail closed';end if;
 for all_papers in select public.dd_cr_my_papers(-1,0)
 loop
  raise exception 'Invalid negative page size allowed';
 end loop;
 exception when invalid_parameter_value then null;
end $check$;

-- Author withdraws exactly one paper; listing remains available to its owner.
do $check$
declare response jsonb;all_papers jsonb;
begin
 response:=public.dd_cr_withdraw_paper(current_setting('m04.a_paper_one')::uuid,1,true);
 all_papers:=public.dd_cr_my_papers(20,0);
 if not exists(select 1 from pg_catalog.jsonb_array_elements(all_papers) x
  where x->>'paper_id'=current_setting('m04.a_paper_one')
  and x->>'status'='withdrawn') then
  raise exception 'Withdrawn owner publication disappeared from My Research';end if;
end $check$;

-- User deliberately deletes the linked private draft; the published paper
-- must be recoverable, with draft_id=null and intact public edition.
delete from public.dd_cr_drafts where id=current_setting('m04.a_draft_two')::uuid;
do $check$
declare rows jsonb;
begin
 rows:=public.dd_cr_my_papers();
 if not exists(select 1 from pg_catalog.jsonb_array_elements(rows) x
   where x->>'paper_id'=current_setting('m04.a_paper_two')
   and x->>'draft_id' is null and x->>'status'='published') then
  raise exception 'Orphaned published paper missing from owner recovery';end if;
end $check$;

-- B must NOT see withdrawn A paper. Guest sees only other public works.
set request.jwt.claims='{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","is_anonymous":false}';
do $check$
begin
 if pg_catalog.jsonb_array_length(public.dd_cr_my_papers())<>1 then
  raise exception 'B owner recovery changed when A withdrew draft';end if;
end $check$;
reset role;
set role anon;
set request.jwt.claims='{}';
do $check$
begin
 if exists(select 1 from public.dd_cr_editions
   where paper_id=current_setting('m04.a_paper_one')::uuid) then
  raise exception 'Withheld research visible publicly';end if;
 if (select count(*) from public.dd_cr_publications)<>2 then
  raise exception 'Expected B and A published papers still available';end if;
end $check$;
reset role;
select 'PASS M04: owner-only cross-device recovery, 2 accounts, guest/anon denied, withdrawn retained, orphan draft retained, pagination, no private mapping leaks' as result;
