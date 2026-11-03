'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/PRIVATE_CHAT_CONSENT_REVIEW.sql','utf8');
const cfg=fs.readFileSync('assets/community-test-config.js','utf8');
const master=fs.readFileSync('MASTER_HANDOVER.md','utf8');
assert.match(sql,/UNAPPLIED PRIVATE 1:1 CHAT BACKEND REVIEW/);
assert.match(sql,/add column if not exists chat_contact_opt_in boolean not null default false/);
assert.match(sql,/create unique index if not exists dd_chat_unique_unordered_pair/,'Reverse requests must not bypass declined requests');
for(const table of ['dd_chat_pairs','dd_chat_messages','dd_chat_blocks','dd_chat_reports','dd_chat_owner_admins']){
 assert.match(sql,new RegExp('create table if not exists public\\.'+table+'\\('),'Missing table '+table);
 assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security'),'Missing RLS on '+table);
}
assert.match(sql,/revoke all on public\.dd_chat_pairs,public\.dd_chat_messages,public\.dd_chat_blocks/,'Direct table access is denied');
assert.match(sql,/from PUBLIC,anon,authenticated/);
const procedures=[
 ['dd_chat_request','text,text'],['dd_chat_respond','uuid,boolean'],['dd_chat_send_message','uuid,text'],
 ['dd_chat_my_pairs',''],['dd_chat_history','uuid,integer'],['dd_chat_block','uuid'],
 ['dd_chat_mark_read','uuid,uuid'],
 ['dd_chat_report','uuid,text,uuid'],['dd_chat_report_queue','integer']
];
for(const [name,args] of procedures){
 assert.ok(sql.includes('create or replace function public.'+name+'('),'Missing procedure '+name);
 assert.ok(sql.includes('revoke all on function public.'+name+'('+args+') from PUBLIC,anon,authenticated;'),'No revoke '+name);
 assert.ok(sql.includes('grant execute on function public.'+name+'('+args+') to authenticated;'),'Missing execute grant '+name);
}
assert.match(sql,/status='accepted'[\s\S]*inviter_id=actor or invitee_id=actor/,'Messages only in accepted participant chats');
assert.match(sql,/p\.invitee_id=actor and p\.status='pending'/,'Only invited recipient accepts');
assert.match(sql,/select n\.user_id into receiver[\s\S]*n\.chat_contact_opt_in/,'Recipient opt-in must be checked by server');
assert.match(sql,/n\.user_id=actor and n\.is_public and n\.chat_contact_opt_in/,'Sender consent required');
assert.match(sql,/char_length\(btrim\(p_preview\)\) not between 5 and 1000/,'Intro cap');
assert.match(sql,/char_length\(btrim\(p_body\)\) not between 1 and 2000/,'Message cap');
assert.match(sql,/select 1 from public\.dd_chat_blocks/,'Block check');
assert.match(sql,/dd_chat_owner_admins a where a\.user_id=auth\.uid\(\)/,'Owner-only private report snapshot');
assert.match(sql,/reported_excerpt/);
assert.doesNotMatch(sql,/grant (?:select|insert|update|delete) on public\.dd_chat_/i,'No direct table grants');
assert.doesNotMatch(sql,/insert into public\.dd_chat_owner_admins/,'No admin account seeded from public code');
assert.doesNotMatch(cfg,/privateChat:true/,'Backend should not be automatically exposed to public website');
assert.match(master,/Private one-to-one user messaging/);
console.log('PASS: reviewed-only 1:1 chat schema; consent, single preview, recipient-only acceptance, participant-only messages, block/report and owner-only snapshot, no rollout.');


/* First safe isolated SQL acceptance must cover real PostgreSQL execution,
 * not only matching source text. The SQL stays outside migrations. */
assert.match(sql,/values\(accepted_pair,inviter,preview\)/,
 'Accepted introduction is persisted exactly once as first message');
assert.match(sql,/contact_unavailable boolean/,'Client receives block status from server');
assert.match(sql,/Accepted and unblocked chat required/,'Blocked history must be denied');
const privateWorkflow=fs.readFileSync('.github/workflows/validate-private-chat-isolated.yml','utf8');
const fixture=fs.readFileSync('scripts/private-chat-isolated-fixture.sql','utf8');
const acceptance=fs.readFileSync('scripts/private-chat-isolated-acceptance.sql','utf8');
assert.match(privateWorkflow,/postgres:17/);
assert.match(privateWorkflow,/private-chat-isolated-acceptance\.sql/);
assert.match(fixture,/fake|Fake|synthetic|Synthetic/,'No real user data in security CI');
assert.match(acceptance,/Blocked counterpart can still read messages/);
assert.match(acceptance,/Reverse declined request succeeded/);
assert.match(acceptance,/Accepted introduction not first chat message/);
assert.match(acceptance,/Anonymous database role executed chat private RPC/);


assert.match(sql,/inviter_read_at timestamptz/);
assert.match(sql,/invitee_read_at timestamptz/);
assert.match(sql,/unread_count integer/);
assert.match(sql,/create or replace function public\.dd_chat_mark_read/);
assert.match(sql,/where m\.id=p_last_message_id and m\.pair_id=p_pair_id/,
 'Read marker is tied to a real message inside this accepted pair');
