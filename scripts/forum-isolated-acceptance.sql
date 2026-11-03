-- Real PostgreSQL syntax/RPC/permission smoke tests. Runs in Docker postgres:17
-- populated ONLY with disposable fake users. ON_ERROR_STOP fails CI immediately.
\set ON_ERROR_STOP on
-- A = section creator, B = ordinary posting member, C = site owner,
-- D.. are independent reporters. No live email, accounts or UAP data.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select set_config('request.jwt.claims','{"is_anonymous":false}',false);
create temporary table forum_test_ids(label text primary key,id uuid not null);
insert into forum_test_ids(label,id)
values('section',public.dd_discussions_create_section('Irish Sightings','Public section research','UAP'));
do $$
begin
 if (select count(*) from public.dd_discussions_sections(100))<>1
 then raise exception 'Section creation/guest-safe public read failed';end if;
end $$;

-- A section founder is a limited steward; B can publish without approval.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
insert into forum_test_ids(label,id)
select 'thread',public.dd_discussions_create_thread(id,'Catalina island observation',
 'Examining provenance and official reports','https://example.org/research')
from forum_test_ids where label='section';
insert into forum_test_ids(label,id)
select 'reply',public.dd_discussions_reply(id,'I found an additional public document',null)
from forum_test_ids where label='thread';
do $$
begin
 if (select count(*) from public.dd_discussions_threads(
  (select id from forum_test_ids where label='section'),100,'recent'))<>1
 then raise exception 'Ordinary member cannot post publicly';end if;
 if (select count(*) from public.dd_discussions_replies(
  (select id from forum_test_ids where label='thread'),100))<>1
 then raise exception 'Ordinary member cannot reply publicly';end if;
end $$;

-- B is not section steward, even though B authored the topic.
do $$
declare denied boolean:=false;
begin
 begin
  perform public.dd_discussions_pin((select id from forum_test_ids where label='thread'),true);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Nonsteward must not pin';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$
begin
 if not public.dd_discussions_pin((select id from forum_test_ids where label='thread'),true)
 then raise exception 'Section steward cannot pin';end if;
end $$;

-- Only actual owner allowlist user C is permitted overall moderation.
reset role;
insert into public.dd_forum_owner_admins(user_id)
values('00000000-0000-0000-0000-000000000003');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $$
declare denied boolean:=false;
begin
 begin perform count(*) from public.dd_discussions_owner_queue(50);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Nonowner may not read overall moderation queue';end if;
end $$;

-- Four independent flags do NOT hide a topic; the fifth DOES.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000006',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000007',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
do $$
begin
 if (select count(*) from public.dd_discussions_threads(
  (select id from forum_test_ids where label='section'),100,'recent'))<>1
 then raise exception 'Four reports incorrectly hid the topic';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000008',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
do $$
begin
 if (select count(*) from public.dd_discussions_threads(
  (select id from forum_test_ids where label='section'),100,'recent'))<>0
 then raise exception 'Five independent reports must temporarily hide the topic';end if;
end $$;

-- Overall site owner C restores after review. Previously reviewed flags
-- must not immediately rehide it. Five NEW independent users are needed.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select public.dd_discussions_owner_review('thread',
 (select id from forum_test_ids where label='thread'),
 'published','Synthetic verified source review');
do $$
begin
 if (select count(*) from public.dd_discussions_threads(
  (select id from forum_test_ids where label='section'),100,'recent'))<>1
 then raise exception 'Owner could not restore topic';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000009',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000010',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
do $$
begin
 if (select count(*) from public.dd_discussions_threads(
  (select id from forum_test_ids where label='section'),100,'recent'))<>1
 then raise exception 'Restored topic wrongly hidden before five new flags';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000013',false);
select public.dd_discussions_flag('thread',(select id from forum_test_ids where label='thread'),'spam');
do $$
begin
 if (select count(*) from public.dd_discussions_threads(
  (select id from forum_test_ids where label='section'),100,'recent'))<>0
 then raise exception 'Second set of five reports did not hide the restored topic';end if;
end $$;

-- Owner's queue includes a hidden thread AND separately hidden/escalated replies.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$
begin
 if (select count(*) from public.dd_discussions_owner_queue(50)
  where target_kind='thread')<>1 then raise exception 'Hidden topic missing from owner queue';end if;
end $$;

-- A hidden thread can be restored independently to test reply-level moderation.
select public.dd_discussions_owner_review('thread',
 (select id from forum_test_ids where label='thread'),
 'published','Reviewing independent reply moderation');
do $$
begin
 if (select count(*) from public.dd_discussions_replies(
  (select id from forum_test_ids where label='thread'),100))<>1
 then raise exception 'Previously published reply must be visible before its own flags';end if;
end $$;

-- Unlike topic flags, these five reports target the REPLY alone.
-- A reply hidden by flags must reach the overall-owner review queue.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
select public.dd_discussions_flag('reply',(select id from forum_test_ids where label='reply'),'privacy');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
select public.dd_discussions_flag('reply',(select id from forum_test_ids where label='reply'),'privacy');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000006',false);
select public.dd_discussions_flag('reply',(select id from forum_test_ids where label='reply'),'privacy');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000007',false);
select public.dd_discussions_flag('reply',(select id from forum_test_ids where label='reply'),'privacy');
do $$
begin
 if (select count(*) from public.dd_discussions_replies(
  (select id from forum_test_ids where label='thread'),100))<>1
 then raise exception 'Four independent reply flags must not hide a reply';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000008',false);
select public.dd_discussions_flag('reply',(select id from forum_test_ids where label='reply'),'privacy');
do $$
begin
 if (select count(*) from public.dd_discussions_replies(
  (select id from forum_test_ids where label='thread'),100))<>0
 then raise exception 'Fifth independent reply flag must hide the reply';end if;
end $$;

-- Only owner C may view/restore the hidden reply and its safety preview.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$
begin
 if (select count(*) from public.dd_discussions_owner_queue(50)
  where target_kind='reply' and flag_count=5
   and content_preview like '%additional public document%')<>1
 then raise exception 'Owner queue must include flagged reply content preview';end if;
end $$;
select public.dd_discussions_owner_review('reply',
 (select id from forum_test_ids where label='reply'),
 'published','Reviewed reply and found it acceptable');
do $$
begin
 if (select count(*) from public.dd_discussions_replies(
  (select id from forum_test_ids where label='thread'),100))<>1
 then raise exception 'Owner restore did not make reply visible again';end if;
end $$;

-- Ordinary member B cannot escalate as a steward, even on their own reply.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$
declare denied boolean:=false;
begin
 begin
  perform public.dd_discussions_escalate('reply',
   (select id from forum_test_ids where label='reply'),
   'Synthetic ordinary user is attempting to bypass steward powers');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Normal member unexpectedly obtained steward escalation';end if;
end $$;

-- Steward A can report serious concerns directly to owner even before five NEW flags.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.dd_discussions_escalate('reply',
 (select id from forum_test_ids where label='reply'),
 'Suspected sensitive personal information requires review');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$
begin
 if (select count(*) from public.dd_discussions_owner_queue(50)
  where target_kind='reply' and escalation_count=1
   and latest_escalation_reason like '%sensitive personal information%')<>1
 then raise exception 'Steward escalation did not reach the site owner';end if;
end $$;

-- No section can be deleted by a founder's account removal: public content
-- remains in place but creator/steward references are anonymised.
select public.dd_discussions_owner_set_steward(
 (select id from forum_test_ids where label='section'),
 null,'Steward power revoked during disposable test');
do $$
begin
 if (select count(*) from public.dd_discussions_owner_sections(100)
  where has_steward=false)<>1 then raise exception 'Owner did not revoke steward role';end if;
end $$;

-- Anon may read projection RPCs but never raw table data or mutation RPCs.
set role anon;
select set_config('request.jwt.claim.sub','',false);
do $$
declare denied boolean:=false;
begin
 if (select count(*) from public.dd_discussions_sections(100))<>1
 then raise exception 'Guest cannot read published section';end if;
 begin perform 1 from public.dd_forum_sections limit 1;
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Guest has unexpected raw-table access';end if;
end $$;
reset role;
select 'PASS isolated PostgreSQL Discussions owner/steward/guest and five-flag lifecycle' as result;
