-- Release acceptance of the actual nomination policies using existing account IDs.
-- No emails, passwords, tokens or existing member content are read or returned.
-- Every disposable nomination is rolled back; the deployed schema remains.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';
do $qa$
declare
 owner_id uuid; members uuid[]; a uuid; b uuid; item uuid; result boolean;
 test_url text := 'https://example.org/disclosure-desk-release-qa/' || gen_random_uuid();
 expected boolean; message text; seen bigint; baseline bigint;
begin
 select x.user_id into owner_id from public.dd_forum_owner_admins x
 join auth.users u on u.id=x.user_id where not coalesce(u.is_anonymous,false) limit 1;
 select array_agg(id) into members from (select u.id from auth.users u
 where not coalesce(u.is_anonymous,false) and not exists
 (select 1 from public.dd_forum_owner_admins x where x.user_id=u.id) order by u.id limit 2) q;
 if owner_id is null or coalesce(array_length(members,1),0)<2 then
  raise exception 'Acceptance needs an owner and two registered test identities';
 end if;
 a:=members[1]; b:=members[2];
 select count(*) into baseline from public.dd_media_suggestions;
 -- With a newly deployed table, there should be no real nominations yet.
 if baseline<>0 then raise exception 'Existing nominations present: use a dedicated QA plan instead';end if;
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','is_anonymous',false)::text,true);
 execute 'set local role authenticated';
 item:=public.dd_media_suggest('books',test_url,'Disposable release QA','Rolled back after acceptance');
 if item is null then raise exception 'Receipt missing';end if;
 select count(*) into seen from public.dd_media_suggestions where id=item and user_id=auth.uid() and status='pending';
 if seen<>1 then raise exception 'Own nomination unreadable';end if;
 expected:=false;
 begin perform public.dd_media_suggest('books',test_url,'Duplicate title','');
 exception when unique_violation then expected:=true;end;
 if not expected then raise exception 'Duplicate accepted';end if;
 expected:=false;
 begin perform public.dd_media_suggestion_review(item,'reviewed');
 exception when raise_exception then get stacked diagnostics message=message_text;
  if message not like '%Site owner required%' then raise;end if;expected:=true;end;
 if not expected then raise exception 'Member review allowed';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','is_anonymous',false)::text,true);
 select count(*) into seen from public.dd_media_suggestions where id=item;
 if seen<>0 then raise exception 'Second member can read another member nomination';end if;
 expected:=false;
 begin insert into public.dd_media_suggestions(user_id,category,url,title) values(a,'books',test_url||'/spoof','Spoofed nomination');
 exception when raise_exception then get stacked diagnostics message=message_text;
  if message not like '%Account mismatch%' then raise;end if;expected:=true;end;
 if not expected then raise exception 'Submitting identity spoofed';end if;
 expected:=false;
 begin perform public.dd_media_suggest('books','http://example.org/qa','Invalid HTTP link','');
 exception when raise_exception then get stacked diagnostics message=message_text;
  if message not like '%HTTPS%' then raise;end if;expected:=true;end;
 if not expected then raise exception 'HTTP nomination accepted';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','is_anonymous',true)::text,true);
 expected:=false;
 begin perform public.dd_media_suggest('books',test_url||'/anon','Anonymous nomination','');
 exception when raise_exception then get stacked diagnostics message=message_text;
  if message not like '%Registered account required%' then raise;end if;expected:=true;end;
 if not expected then raise exception 'Anonymous auth nomination accepted';end if;
 execute 'reset role';execute 'set local role anon';
 expected:=false;
 begin perform id from public.dd_media_suggestions limit 1;
 exception when insufficient_privilege then expected:=true;end;
 if not expected then raise exception 'Anonymous role can access table';end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','is_anonymous',false)::text,true);
 execute 'set local role authenticated';
 select count(*) into seen from public.dd_media_suggestion_queue() q where q.id=item;
 if seen<>1 then raise exception 'Owner queue did not return nomination';end if;
 result:=public.dd_media_suggestion_review(item,'reviewed');
 if result is distinct from true then raise exception 'Owner review not confirmed';end if;
 select count(*) into seen from public.dd_media_suggestions where id=item and status='reviewed' and reviewed_by=auth.uid() and reviewed_at is not null;
 if seen<>1 then raise exception 'Owner review audit missing';end if;
 select count(*) into seen from public.dd_media_suggestion_queue() q where q.id=item;
 if seen<>0 then raise exception 'Reviewed item remains pending';end if;
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','is_anonymous',false)::text,true);
 select count(*) into seen from public.dd_media_suggestions where id=item and status='reviewed';
 if seen<>1 then raise exception 'Member cannot see own review status';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','is_anonymous',false)::text,true);
 for n in 1..10 loop perform public.dd_media_suggest('podcasts',test_url||'/episode/'||n,'Disposable episode '||n,'');end loop;
 expected:=false;
 begin perform public.dd_media_suggest('podcasts',test_url||'/episode/11','Eleventh episode','');
 exception when raise_exception then get stacked diagnostics message=message_text;
  if message not like '%limit reached%' then raise;end if;expected:=true;end;
 if not expected then raise exception 'Rate limit bypassed';end if;
 execute 'reset role';
 select count(*) into seen from public.dd_media_suggestions;
 if seen<>baseline+11 then raise exception 'Unexpected nomination count';end if;
 if has_function_privilege('anon','dd_media_private.guard_suggestion()','execute') then raise exception 'Private trigger executable by anon';end if;
end $qa$;
rollback;
select 'PASS: actual RLS, own receipt, isolation, duplicates, review, HTTPS, anonymous denial and rate limit; all QA nominations rolled back' as acceptance;
