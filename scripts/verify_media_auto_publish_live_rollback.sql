-- Actual DB role acceptance. Existing member IDs stay inside the transaction.
-- No real account content is read; all fictional catalogue/report writes roll back.
begin;
set local lock_timeout='3s';set local statement_timeout='20s';
do $qa$
declare a uuid;b uuid;owner_id uuid;receipt uuid;target text;result jsonb;expected boolean;message text;seen bigint;
 link text:='https://example.org/disclosure-desk-auto-release-qa/'||gen_random_uuid();
 title text:='DD release QA '||gen_random_uuid();
begin
 select u.id into a from auth.users u where not coalesce(u.is_anonymous,false) and not exists(select 1 from public.dd_forum_owner_admins x where x.user_id=u.id) order by u.id limit 1;
 select u.id into b from auth.users u where not coalesce(u.is_anonymous,false) and u.id<>a and not exists(select 1 from public.dd_forum_owner_admins x where x.user_id=u.id) order by u.id limit 1;
 select user_id into owner_id from public.dd_forum_owner_admins limit 1;
 if a is null or b is null or owner_id is null then raise exception 'Need two registered test identities and owner';end if;
 perform set_config('request.jwt.claim.sub',a::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated','is_anonymous',false)::text,true);
 execute 'set local role authenticated';
 receipt:=public.dd_media_suggest('books',link,title,'Private disposable acceptance note');target:='member-'||receipt::text;
 select count(*) into seen from public.dd_media_suggestions s where s.id=receipt and s.status='published';
 if seen<>1 then raise exception 'Published receipt missing';end if;
 expected:=false;begin perform public.dd_media_report(target,'spam');exception when raise_exception then get stacked diagnostics message=message_text;if message not like '%own suggestion%' then raise;end if;expected:=true;end;
 if not expected then raise exception 'Self report accepted';end if;
 execute 'reset role';execute 'set local role anon';
 select count(*) into seen from public.dd_media_catalogue() c where c.id=target and c.public_url=link;
 if seen<>1 then raise exception 'Immediate public catalogue entry missing';end if;
 expected:=false;begin perform submitted_by from public.dd_media_titles limit 1;exception when insufficient_privilege then expected:=true;end;
 if not expected then raise exception 'Submitter identity exposed';end if;
 expected:=false;begin perform notes from public.dd_media_suggestions limit 1;exception when insufficient_privilege then expected:=true;end;
 if not expected then raise exception 'Private notes exposed';end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',b::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated','is_anonymous',false)::text,true);execute 'set local role authenticated';
 expected:=false;begin perform public.dd_media_suggest('movies',link||'?utm_source=qa','Another title','');exception when raise_exception then get stacked diagnostics message=message_text;if message not like '%already added%' then raise;end if;expected:=true;end;
 if not expected then raise exception 'Cross-account duplicate accepted';end if;
 result:=public.dd_media_report(target,'spam');if result->>'reported' is distinct from 'true' or result->>'hidden' is distinct from 'false' then raise exception 'First report incorrect';end if;
 result:=public.dd_media_report(target,'other');if result->>'already_reported' is distinct from 'true' then raise exception 'Duplicate account report counted';end if;
 execute 'reset role';execute 'set local role anon';
 select count(*) into seen from public.dd_media_catalogue() c where c.id=target;if seen<>1 then raise exception 'Single report incorrectly hides title';end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',owner_id::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','is_anonymous',false)::text,true);execute 'set local role authenticated';
 select count(*) into seen from public.dd_media_review_queue() q where q.id=target;if seen<>0 then raise exception 'Unflagged title in hidden review queue';end if;
 execute 'reset role';select count(*) into seen from public.dd_media_reports r where r.title_id=target;if seen<>1 then raise exception 'Report uniqueness mismatch';end if;
end $qa$;
rollback;
select 'PASS: real-role immediate publication, public read, duplicate rejection, private metadata, self-report denial and one-report idempotency; all QA writes rolled back. Five-distinct threshold and restore/remove are covered by isolated PostgreSQL acceptance.' as acceptance;
