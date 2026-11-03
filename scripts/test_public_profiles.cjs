'use strict';
// Source/privacy contract checks for unpublished display-name feature.
// Real Supabase owner RLS, unique names and public alias filtering still need
// authenticated acceptance testing after a reviewed additive migration.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const sql=read('supabase/PUBLIC_USERNAMES_REVIEW.sql');
const js=read('assets/public-profiles.js');
const site=read('index.html'),boards=read('cloud-boards.js');
const cases=read('assets/case-discussions.js');
const news=read('assets/inline-news-comments.js');
const chat=read('assets/live-chat.js');
assert.doesNotThrow(()=>new Function(js));
assert.match(sql,/add column if not exists is_public boolean not null default false/);
assert.match(sql,/name_key = lower\(display_name\)/,'Owner writes cannot forge normalisation');
assert.match(sql,/create or replace function public\.dd_public_aliases/);
assert.match(sql,/cardinality\(p_ids\)>100/);
assert.match(sql,/status='approved'/,'Only approved comments/chat');
assert.match(sql,/n\.is_public=true/g);
assert.match(sql,/e\.is_public=true/,'No hidden hearing aliases');
assert.match(sql,/returns table\(content_id uuid,display_name text\)/);
assert.doesNotMatch(sql,/returns table\([^;]*email|returns table\([^;]*author_id/);
assert.match(sql,/revoke all on function public\.dd_public_aliases\(text,uuid\[\]\) from public,anon,authenticated/);
assert.match(sql,/grant execute on function public\.dd_public_aliases\(text,uuid\[\]\) to anon,authenticated/);
assert.doesNotMatch(sql,/grant select on public\.dd_public_names to anon/,'Do not open owner-private names table');
assert.match(js,/environment==='test'/,'Keep production feature off');
assert.match(js,/\.upsert\(/,'Edit owner name via existing RLS table');
assert.match(js,/is_public:publicName/,'Opt-in owner-controlled');
assert.match(js,/\.rpc\('dd_public_aliases'/,'Only explicit approved alias RPC for public reads');
assert.match(js,/auth\.getUser\(\)/,'Verified account on name save');
assert.match(js,/optIn\.checked=row\?\.is_public===true/,'Load opt-in explicitly');
assert.match(boards,/dd_requested_username:requestedName/,'Signup preference is just metadata for prefill');
assert.match(site,/id="ddSignupUsername"/);
assert.match(site,/assets\/public-profiles\.js/);
assert.match(cases,/DDPublicProfiles\?\.namesFor\('comment'/);
assert.match(news,/DDPublicProfiles\?\.namesFor\('comment'/);
assert.match(chat,/DDPublicProfiles\?\.namesFor\('chat'/);
assert.doesNotMatch(chat,/replaceAll\('-',''\)\.slice\(0,6\)/,'Never expose a UUID fragment as alias');
console.log('PASS: staged public usernames are owner-only with opt-in and approval-gated alias lookup; backend acceptance still required');
