-- Disposable isolated PostgreSQL 17 acceptance: never execute against Supabase.
\set ON_ERROR_STOP on
-- Admin role owner may assign contact opt-ins for fake identities only.
update public.dd_public_names set chat_contact_opt_in=true
where user_id::text not like '%000000000007';
-- A(1), B(2), C(3) unrelated, owner(8); all synthetic UUIDs.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select set_config('request.jwt.claims','{"is_anonymous":false}',false);
create temporary table chat_test_ids(label text primary key,id uuid not null);
insert into chat_test_ids(label,id)
values('ab',public.dd_chat_request('Researcher02','Please review this historic sighting'));
do $$
begin
 if (select count(*) from public.dd_chat_my_pairs()
    where direction='sent' and status='pending')<>1
 then raise exception 'Sender pending view missing';end if;
 -- Only the safe pending-pair projection is exposed. Table rows are not
 -- directly readable with a web client's role (checked explicitly below).
end $$;
-- Sender cannot send another message or accept own request.
do $$
declare denied boolean:=false; accepted boolean;
begin
 begin perform public.dd_chat_send_message((select id from chat_test_ids where label='ab'),'Early followup');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Pending sender was allowed to send';end if;
 select public.dd_chat_respond((select id from chat_test_ids where label='ab'),true) into accepted;
 if accepted then raise exception 'Sender cannot accept';end if;
end $$;
-- Nonparticipant C can't see pairs, read history or accept.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$
declare rejected boolean:=false; result boolean;
begin
 if (select count(*) from public.dd_chat_my_pairs())<>0
 then raise exception 'Nonparticipant sees a private pair';end if;
 begin perform count(*) from public.dd_chat_history((select id from chat_test_ids where label='ab'),10);
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Nonparticipant can fetch history';end if;
 select public.dd_chat_respond((select id from chat_test_ids where label='ab'),true) into result;
 if result then raise exception 'Nonparticipant accepted invitation';end if;
end $$;
-- C cannot mark messages as seen in someone else's pair.
do $$
declare denied boolean;
begin
 if public.dd_chat_mark_read((select id from chat_test_ids where label='ab'),
    '00000000-0000-0000-0000-000000000099') then
  raise exception 'Outsider falsely marked private chat as read';end if;
end $$;
-- Recipient sees only one preview and may accept.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$
declare ok boolean;
begin
 if (select count(*) from public.dd_chat_my_pairs()
    where direction='received' and status='pending'
      and initial_preview='Please review this historic sighting')<>1
 then raise exception 'Recipient cannot see accepted pending preview';end if;
 select public.dd_chat_respond((select id from chat_test_ids where label='ab'),true) into ok;
 if not ok then raise exception 'Recipient could not accept';end if;
 if (select count(*) from public.dd_chat_history(
  (select id from chat_test_ids where label='ab'),100)
  where body='Please review this historic sighting' and mine=false)<>1
 then raise exception 'Accepted introduction not first chat message';end if;
end $$;
-- Acceptance is idempotent and cannot duplicate original preview.
do $$
declare again boolean;
begin
 select public.dd_chat_respond((select id from chat_test_ids where label='ab'),true) into again;
 if again then raise exception 'Repeated accept unexpectedly succeeded';end if;
 if (select count(*) from public.dd_chat_history(
  (select id from chat_test_ids where label='ab'),100))<>1
 then raise exception 'Duplicate initial message after repeated accept';end if;
end $$;

-- B receives one unread first message when A's pending invite is accepted.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$
declare seen_id uuid;ok boolean;
begin
 if (select unread_count from public.dd_chat_my_pairs()
   where pair_id=(select id from chat_test_ids where label='ab'))<>1
 then raise exception 'Accepted intro must appear as one unread message for recipient';end if;
 select message_id into seen_id from public.dd_chat_history(
  (select id from chat_test_ids where label='ab'),100) limit 1;
 select public.dd_chat_mark_read((select id from chat_test_ids where label='ab'),seen_id) into ok;
 if not ok then raise exception 'Recipient failed to acknowledge a displayed message';end if;
 if (select unread_count from public.dd_chat_my_pairs()
   where pair_id=(select id from chat_test_ids where label='ab'))<>0
 then raise exception 'Read marker failed to clear recipient unread counter';end if;
end $$;
-- Accepted two-way messaging.
select public.dd_chat_send_message((select id from chat_test_ids where label='ab'),'Found the government archive!');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.dd_chat_send_message((select id from chat_test_ids where label='ab'),'Thanks, checking sources now');
do $$
begin
 if (select count(*) from public.dd_chat_history(
 (select id from chat_test_ids where label='ab'),100))<>3
 then raise exception 'Two-way chat history missing';end if;
end $$;

-- A must see B's unread reply, then marking the actual loaded message clears it.
do $$
declare seen_id uuid;ok boolean;
begin
 if (select unread_count from public.dd_chat_my_pairs()
   where pair_id=(select id from chat_test_ids where label='ab'))<>1
 then raise exception 'Sender missing unread message from recipient';end if;
 select message_id into seen_id from public.dd_chat_history(
  (select id from chat_test_ids where label='ab'),100)
  order by sent_at desc limit 1;
 select public.dd_chat_mark_read((select id from chat_test_ids where label='ab'),seen_id) into ok;
 if not ok then raise exception 'Sender failed read marker';end if;
 if (select unread_count from public.dd_chat_my_pairs()
   where pair_id=(select id from chat_test_ids where label='ab'))<>0
 then raise exception 'Sender unread not cleared';end if;
end $$;
-- A self-request must be rejected even if public.
do $$
declare denied boolean:=false;
begin
 begin perform public.dd_chat_request('Researcher01','Message to self');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Self-chat request succeeded';end if;
end $$;
-- Someone who opts out is not discoverable.
do $$
declare denied boolean:=false;
begin
 begin perform public.dd_chat_request('Researcher07','I would like to discuss a case');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Opt-out ignored';end if;
end $$;
-- Synthetic per-user message throttling: 30 in ten minutes are allowed;
-- an additional one is denied by the server. B already sent one message.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$
declare i integer;denied boolean:=false;
begin
 for i in 1..29 loop
  perform public.dd_chat_send_message((select id from chat_test_ids where label='ab'),
   'Synthetic message burst '||i::text);
 end loop;
 begin perform public.dd_chat_send_message((select id from chat_test_ids where label='ab'),
  'Thirty-first blocked message');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Message rate cap failed';end if;
end $$;
-- Participant B explicitly reports one selected message (NOT whole history).
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$
declare id uuid;ok boolean;
begin
 select message_id into id from public.dd_chat_history(
  (select x.id from chat_test_ids x where x.label='ab'),100)
  where body='Thanks, checking sources now';
 select public.dd_chat_report((select x.id from chat_test_ids x where x.label='ab'),
  'harassment',id) into ok;
 if not ok then raise exception 'Participant report failed';end if;
end $$;
-- No arbitrary outsiders can inspect private report excerpts.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$
declare denied boolean:=false;flag boolean;
begin
 begin perform count(*) from public.dd_chat_report_queue(10);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Ordinary account can read owner reports';end if;
 select public.dd_chat_report((select id from chat_test_ids where label='ab'),
   'spam',null) into flag;
 if flag then raise exception 'Outsider reported a pair';end if;
end $$;
reset role;
insert into public.dd_chat_owner_admins(user_id)
values('00000000-0000-0000-0000-000000000008');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000008',false);
do $$
begin
 if (select count(*) from public.dd_chat_report_queue(10)
  where reason='harassment' and reported_excerpt='Thanks, checking sources now')<>1
 then raise exception 'Owner cannot review reported single-message excerpt';end if;
end $$;
-- Blocking must stop both message operations and history, on both sides.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$
declare ok boolean;denied boolean:=false;
begin
 select public.dd_chat_block((select id from chat_test_ids where label='ab')) into ok;
 if not ok then raise exception 'Blocking failed';end if;
 if (select count(*) from public.dd_chat_my_pairs()
     where status='accepted' and contact_unavailable=true)<>1
 then raise exception 'Blocked contact not flagged to UI';end if;
 begin perform count(*) from public.dd_chat_history(
  (select id from chat_test_ids where label='ab'),100);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Blocker still reads blocked messages';end if;
 denied:=false;
 begin perform public.dd_chat_send_message((select id from chat_test_ids where label='ab'),'Blocked send');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Blocker still sends blocked messages';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$
declare denied boolean:=false;
begin
 begin perform count(*) from public.dd_chat_history((select id from chat_test_ids where label='ab'),100);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Blocked counterpart can still read messages';end if;
end $$;
-- Newly declined pair D(4) -> E(5) cannot be re-requested in either direction.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
insert into chat_test_ids(label,id)
values('de',public.dd_chat_request('Researcher05','I would like to contact you'));
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',false);
select public.dd_chat_respond((select id from chat_test_ids where label='de'),false);
do $$
declare denied boolean:=false;
begin
 if (select count(*) from public.dd_chat_my_pairs() where status='declined')<>1
 then raise exception 'Declined pair missing from list';end if;
 begin perform public.dd_chat_request('Researcher04','Try reversing after decline');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Reverse declined request succeeded';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $$
declare denied boolean:=false;
begin
 begin perform public.dd_chat_request('Researcher05','Try a second time');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Repeated declined request succeeded';end if;
end $$;
-- Five outgoing invite requests per account in a rolling day, not six.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.dd_chat_request('Researcher03','Hello, looking for researchers');
select public.dd_chat_request('Researcher04','Hello, looking for researchers');
select public.dd_chat_request('Researcher05','Hello, looking for researchers');
select public.dd_chat_request('Researcher06','Hello, looking for researchers');
do $$
declare denied boolean:=false;
begin
 begin perform public.dd_chat_request('Researcher08','Sixth invite must fail');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Daily request rate cap failed';end if;
end $$;
-- Anonymous JWT is not an authenticated human even under authenticated PG role.
select set_config('request.jwt.claims','{"is_anonymous":true}',false);
do $$
declare denied boolean:=false;
begin
 begin perform public.dd_chat_my_pairs();exception when others then denied:=true;end;
 -- SQL helper can return empty data instead of raising, but must never return pairs.
 if (select count(*) from public.dd_chat_my_pairs())<>0
 then raise exception 'Anonymous signed-in user can inspect private chats';end if;
 denied:=false;
 begin perform public.dd_chat_request('Researcher06','Hi, can we talk?');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Anonymous account could send request';end if;
end $$;
select set_config('request.jwt.claims','{"is_anonymous":false}',false);
-- Data API direct table access must fail for web client roles (RLS + ACL).
do $$
declare denied boolean:=false;
begin
 begin execute 'select count(*) from public.dd_chat_messages';
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Authenticated direct message table access granted';end if;
end $$;
reset role;
set role anon;
do $$
declare denied boolean:=false;
begin
 begin perform public.dd_chat_my_pairs();exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Anonymous database role executed chat private RPC';end if;
end $$;
reset role;
select 'PASS: consent, first-message acceptance, participant isolation, decline, block, owner-only excerpts, anonymous rejection, direct ACLs' as result;
